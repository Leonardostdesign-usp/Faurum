import { createClient } from "@libsql/client";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

/**
 * Retorna uma instância do cliente libSQL para scripts Node.
 * Por padrão, conecta SEMPRE ao banco de desenvolvimento (TURSO_DEV_*).
 * Se prod: true, solicita confirmação digitando "faurum" antes de conectar a TURSO_*.
 *
 * @param {{ prod?: boolean, confirmed?: boolean }} [options]
 * @returns {Promise<import("@libsql/client").Client>}
 */
export async function getDb(options = {}) {
  const isProd = Boolean(options.prod);

  if (isProd) {
    if (!options.confirmed) {
      const rl = readline.createInterface({ input, output });
      try {
        const answer = await rl.question(
          "\n⚠️  ATENÇÃO: Você está prestes a acessar o banco de PRODUÇÃO (faurum).\nDigite \"faurum\" para confirmar: "
        );
        if (answer.trim() !== "faurum") {
          throw new Error("Acesso à produção cancelado: confirmação incorreta.");
        }
      } finally {
        rl.close();
      }
    }

    const url = process.env.TURSO_DATABASE_URL?.trim();
    const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

    if (!url) {
      throw new Error("Variável de ambiente ausente no .env: TURSO_DATABASE_URL");
    }
    if (!authToken) {
      throw new Error("Variável de ambiente ausente no .env: TURSO_AUTH_TOKEN");
    }

    return createClient({ url, authToken });
  }

  // Banco de Desenvolvimento (Padrão)
  const url = process.env.TURSO_DEV_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_DEV_AUTH_TOKEN?.trim();

  if (!url) {
    throw new Error("Variável de ambiente ausente no .env: TURSO_DEV_DATABASE_URL");
  }
  if (!authToken) {
    throw new Error("Variável de ambiente ausente no .env: TURSO_DEV_AUTH_TOKEN");
  }

  return createClient({ url, authToken });
}
