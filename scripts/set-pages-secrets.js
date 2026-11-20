import { spawn } from "node:child_process";

function putSecret(name, value) {
  return new Promise((resolve, reject) => {
    if (!value) {
      return reject(new Error(`Valor ausente para o segredo: ${name}`));
    }

    console.log(`Configurando segredo ${name} no projeto Cloudflare Pages 'faurum'...`);
    const child = spawn(
      "npx",
      ["wrangler", "pages", "secret", "put", name, "--project-name", "faurum"],
      { stdio: ["pipe", "inherit", "inherit"], shell: true }
    );

    child.on("error", (err) => reject(new Error(`Falha ao executar wrangler: ${err.message}`)));
    child.on("close", (code) => {
      if (code === 0) {
        console.log(`Segredo ${name} configurado com sucesso!`);
        resolve();
      } else {
        reject(new Error(`Wrangler encerrou com código de saída ${code} para ${name}`));
      }
    });

    child.stdin.write(value.trim() + "\n");
    child.stdin.end();
  });
}

async function main() {
  try {
    const url = process.env.TURSO_DATABASE_URL;
    const token = process.env.TURSO_AUTH_TOKEN;

    if (!url || !token) {
      throw new Error("TURSO_DATABASE_URL ou TURSO_AUTH_TOKEN ausentes no .env.");
    }

    await putSecret("TURSO_DATABASE_URL", url);
    await putSecret("TURSO_AUTH_TOKEN", token);

    console.log("\nTodos os segredos do Turso foram enviados para a Cloudflare Pages com sucesso!");
  } catch (err) {
    console.error("Erro ao configurar segredos:", err.message);
    process.exit(1);
  }
}

main();
