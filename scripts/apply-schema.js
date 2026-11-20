import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb } from "./lib/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const isProd = process.argv.includes("--prod");
  const targetName = isProd ? "PRODUÇÃO (faurum)" : "DESENVOLVIMENTO (faurum-dev)";

  console.log(`\n========================================`);
  console.log(`Aplicando schema no banco de ${targetName}...`);
  console.log(`========================================`);

  try {
    const schemaPath = path.resolve(__dirname, "../db/schema.sql");
    const schemaSql = await fs.readFile(schemaPath, "utf8");

    const db = await getDb({ prod: isProd });

    // 1. Aplicação do schema usando executeMultiple
    console.log("Executando executeMultiple com o arquivo db/schema.sql...");
    await db.executeMultiple(schemaSql);
    console.log("Schema aplicado com sucesso!");

    // 2. Listagem de tabelas em sqlite_master
    const tablesResult = await db.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
    );
    const tableNames = tablesResult.rows.map((row) => row.name);
    console.log("\nTabelas encontradas:", tableNames.join(", "));

    // 3. Teste de escrita e leitura
    console.log("\nExecutando teste de escrita e leitura...");
    const testNick = `test_${Date.now()}`;
    const insertRes = await db.execute({
      sql: `INSERT INTO users (nick, course, session_token_hash, fingerprint, ip, user_agent, privacy_accepted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?);`,
      args: [
        testNick,
        "outro",
        "hash_teste_verificacao",
        "fp_teste",
        "127.0.0.1",
        "SchemaTester/1.0",
        new Date().toISOString(),
      ],
    });

    const insertedId = Number(insertRes.lastInsertRowid);
    const selectRes = await db.execute({
      sql: "SELECT id, nick, course FROM users WHERE id = ?;",
      args: [insertedId],
    });

    if (selectRes.rows.length === 1 && selectRes.rows[0].nick === testNick) {
      console.log(`Teste de escrita e leitura bem-sucedido (registro ID ${insertedId} validado).`);
    } else {
      throw new Error("Falha na validação do registro de teste.");
    }

    // 4. Limpeza do registro de teste
    await db.execute({
      sql: "DELETE FROM users WHERE id = ?;",
      args: [insertedId],
    });
    console.log("Registro de teste removido com sucesso.");

    console.log(`\n✅ Concluído com sucesso no banco de ${targetName}!\n`);
  } catch (err) {
    // Nunca loga objetos de erro inteiros para evitar expor configurações do cliente ou tokens
    console.error("\n❌ Erro ao aplicar schema:", err.message || "Erro desconhecido");
    process.exit(1);
  }
}

main();
