import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkRecentExport() {
  const exportsDir = path.resolve(__dirname, "../exports");
  try {
    const files = await fs.readdir(exportsDir);
    const exportFiles = files.filter((f) => f.endsWith(".csv") || f.endsWith(".json"));

    if (exportFiles.length === 0) {
      return false;
    }

    // Verifica se algum arquivo foi modificado nas últimas 24 horas
    const now = Date.now();
    for (const f of exportFiles) {
      const stat = await fs.stat(path.join(exportsDir, f));
      if (now - stat.mtimeMs < 24 * 60 * 60 * 1000) {
        return true;
      }
    }
    return false;
  } catch (err) {
    return false;
  }
}

async function main() {
  console.log("\n========================================================");
  console.log("⚠️  DESTRUIÇÃO DO BANCO DE PRODUÇÃO (faurum)");
  console.log("========================================================");

  const hasRecentExport = await checkRecentExport();
  if (!hasRecentExport) {
    console.error(
      "\n❌ BLOQUEADO: Nenhum arquivo de exportação recente encontrado na pasta 'exports/'."
    );
    console.error("Execute primeiro o comando de exportação antes de destruir o banco:");
    console.error("  npm run export:prod\n");
    process.exit(1);
  }

  console.log("\n✅ Verificação de exportação recente em 'exports/' aprovada.");
  console.log("Esta ação apagará permanentemente o banco de produção e todos os seus dados.");

  const rl = readline.createInterface({ input, output });
  let confirmation = "";
  try {
    confirmation = await rl.question(
      '\nDigite exatamente "faurum" para confirmar a destruição: '
    );
  } finally {
    rl.close();
  }

  if (confirmation.trim() !== "faurum") {
    console.log("\nOperação cancelada: a confirmação não corresponde a 'faurum'.");
    process.exit(0);
  }

  console.log("\nExecutando destruição do banco 'faurum'...");
  try {
    // Tenta primeiro o turso nativo
    await execAsync("turso db destroy faurum --yes");
    console.log("✅ Banco de produção 'faurum' destruído com sucesso.");
  } catch (err) {
    // Fallback para WSL se o turso CLI estiver no WSL
    try {
      await execAsync("wsl turso db destroy faurum --yes");
      console.log("✅ Banco de produção 'faurum' destruído com sucesso via WSL.");
    } catch (wslErr) {
      console.error("\n❌ Falha ao executar 'turso db destroy faurum --yes':", err.message);
      console.error("Se necessário, execute manualmente: turso db destroy faurum --yes");
      process.exit(1);
    }
  }
}

main();
