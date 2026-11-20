import { createClient } from "@libsql/client/web";

/**
 * Retorna uma instância de cliente libSQL configurada para Cloudflare Pages Functions (Workers).
 * @param {Record<string, any>} env - Objeto de bindings de ambiente da Cloudflare
 * @returns {import("@libsql/client/web").Client}
 */
export function getDb(env) {
  if (!env) {
    throw new Error("Objeto de ambiente 'env' não fornecido.");
  }
  if (!env.TURSO_DATABASE_URL) {
    throw new Error("Variável de ambiente ausente: TURSO_DATABASE_URL.");
  }
  if (!env.TURSO_AUTH_TOKEN) {
    throw new Error("Variável de ambiente ausente: TURSO_AUTH_TOKEN.");
  }

  let url = String(env.TURSO_DATABASE_URL).trim();
  if (url.startsWith("libsql://")) {
    url = url.replace(/^libsql:\/\//, "https://");
  }

  return createClient({
    url,
    authToken: String(env.TURSO_AUTH_TOKEN).trim(),
  });
}
