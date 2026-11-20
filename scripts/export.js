import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb } from "./lib/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Converte data para formato ISO 8601 com offset fixo de America/Sao_Paulo (-03:00).
 * @param {string | Date} dateInput
 * @returns {string}
 */
function toSaoPauloIso(dateInput) {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";

  // Deslocamento de -3 horas (-180 minutos)
  const spTime = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  const year = spTime.getUTCFullYear();
  const month = String(spTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(spTime.getUTCDate()).padStart(2, "0");
  const hours = String(spTime.getUTCHours()).padStart(2, "0");
  const minutes = String(spTime.getUTCMinutes()).padStart(2, "0");
  const seconds = String(spTime.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-03:00`;
}

function escapeCsvCell(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function main() {
  const isProd = process.argv.includes("--prod");
  const targetLabel = isProd ? "PRODUÇÃO (faurum)" : "DESENVOLVIMENTO (faurum-dev)";

  console.log(`\n========================================`);
  console.log(`Iniciando exportação de ${targetLabel}...`);
  console.log(`========================================`);

  try {
    const db = await getDb({ prod: isProd });

    // Consulta todas as respostas com dados de autor e votos agrupados
    const queryResult = await db.execute(`
      SELECT
        r.id,
        r.topic_id,
        r.parent_id,
        r.body,
        r.created_at,
        r.edited_at,
        r.deleted_at,
        r.hidden,
        u.nick AS author_nick,
        u.course AS author_course,
        COALESCE(SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
        COALESCE(SUM(CASE WHEN v.value = -1 THEN 1 ELSE 0 END), 0) AS downvotes
      FROM replies r
      JOIN users u ON u.id = r.user_id
      LEFT JOIN votes v ON v.reply_id = r.id
      GROUP BY r.id, r.topic_id, r.parent_id, r.body, r.created_at, r.edited_at, r.deleted_at, r.hidden, u.nick, u.course
      ORDER BY r.created_at ASC;
    `);

    const rawRows = queryResult.rows;
    console.log(`Total de respostas recuperadas: ${rawRows.length}`);

    // Mapeamento e cálculo de profundidade (nível)
    const replyMap = new Map();
    for (const row of rawRows) {
      replyMap.set(Number(row.id), {
        id: Number(row.id),
        topic_id: Number(row.topic_id),
        parent_id: row.parent_id !== null ? Number(row.parent_id) : null,
        body: row.body,
        created_at: row.created_at,
        edited_at: row.edited_at,
        deleted_at: row.deleted_at,
        hidden: Number(row.hidden) === 1,
        nick: row.author_nick,
        course: row.author_course,
        upvotes: Number(row.upvotes),
        downvotes: Number(row.downvotes),
        saldo: Number(row.upvotes) - Number(row.downvotes),
        children: [],
        level: 0,
      });
    }

    // Calcula níveis
    function getLevel(item) {
      if (item.parent_id === null) return 0;
      const parent = replyMap.get(item.parent_id);
      return parent ? getLevel(parent) + 1 : 1;
    }

    for (const item of replyMap.values()) {
      item.level = getLevel(item);
    }

    // Monta hierarquia aninhada para o JSON
    const rootReplies = [];
    for (const item of replyMap.values()) {
      if (item.parent_id === null) {
        rootReplies.push(item);
      } else {
        const parent = replyMap.get(item.parent_id);
        if (parent) {
          parent.children.push(item);
        } else {
          rootReplies.push(item);
        }
      }
    }

    // Monta CSV
    const csvHeaders = [
      "id",
      "tópico",
      "parent_id",
      "nível",
      "nick",
      "curso",
      "texto",
      "criado_em",
      "editado_em",
      "apagada",
      "hidden",
      "upvotes",
      "downvotes",
      "saldo",
    ];

    const csvLines = [csvHeaders.join(",")];

    for (const item of replyMap.values()) {
      let texto = item.body || "";
      if (item.deleted_at) {
        texto = "[resposta apagada]";
      }

      const rowValues = [
        item.id,
        item.topic_id,
        item.parent_id ?? "",
        item.level,
        item.nick,
        item.course,
        texto,
        toSaoPauloIso(item.created_at),
        toSaoPauloIso(item.edited_at),
        item.deleted_at ? "sim" : "não",
        item.hidden ? "sim" : "não",
        item.upvotes,
        item.downvotes,
        item.saldo,
      ];

      csvLines.push(rowValues.map(escapeCsvCell).join(","));
    }

    // Garante que o diretório exports/ existe
    const exportsDir = path.resolve(__dirname, "../exports");
    await fs.mkdir(exportsDir, { recursive: true });

    const now = new Date();
    const timestampStr = now
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .slice(0, 19);

    const prefix = isProd ? "faurum_prod" : "faurum_dev";
    const csvFileName = `${prefix}_${timestampStr}.csv`;
    const jsonFileName = `${prefix}_${timestampStr}.json`;

    const csvPath = path.join(exportsDir, csvFileName);
    const jsonPath = path.join(exportsDir, jsonFileName);

    await fs.writeFile(csvPath, csvLines.join("\n"), "utf8");
    await fs.writeFile(jsonPath, JSON.stringify(rootReplies, null, 2), "utf8");

    console.log(`\nExportação gerada com sucesso!`);
    console.log(`- CSV: exports/${csvFileName}`);
    console.log(`- JSON: exports/${jsonFileName}`);
    console.log(`\nNenhum dado sensível (IP, fingerprint, session token, id de usuário) foi exportado.\n`);
  } catch (err) {
    console.error("\n❌ Erro durante a exportação:", err.message || "Erro desconhecido");
    process.exit(1);
  }
}

main();
