/**
 * Utilitários de Autenticação e Sessão para a plataforma Faurum
 * Utiliza Web Crypto API para SHA-256, compatível com Cloudflare Workers e Node 18+
 */

export const COOKIE_NAME = "faurum_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 dias

/**
 * Calcula o hash SHA-256 de uma string em formato hexadecimal.
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Gera um token de sessão criptograficamente seguro.
 * @returns {string}
 */
export function generateSessionToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Monta o cabeçalho Set-Cookie para a sessão.
 * Em desenvolvimento local, omite Secure para compatibilidade com http://localhost.
 * @param {string} token
 * @param {Record<string, any>} [env]
 * @returns {string}
 */
export function createSessionCookie(token, env = {}) {
  const secure = env.ENVIRONMENT === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly${secure}; SameSite=Lax`;
}

/**
 * Extrai o token de sessão do cabeçalho Cookie da requisição.
 * @param {Request} request
 * @returns {string | null}
 */
export function getSessionTokenFromRequest(request) {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const c of cookies) {
    if (c.startsWith(`${COOKIE_NAME}=`)) {
      return c.slice(COOKIE_NAME.length + 1) || null;
    }
  }
  return null;
}

/**
 * Obtém o IP do cliente a partir dos cabeçalhos da Cloudflare.
 * Em ambiente local o header pode não existir; nesse caso retorna null.
 * @param {Request} request
 * @returns {string | null}
 */
export function getClientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null
  );
}

/**
 * Valida o formato do nickname.
 * Regra: 3 a 20 caracteres; letras (sem acento), números, '_' e '.'; sem espaços.
 * @param {string} nick
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateNick(nick) {
  if (typeof nick !== "string") {
    return { valid: false, error: "O nickname deve ser um texto." };
  }
  const trimmed = nick.trim();
  if (trimmed.length < 3 || trimmed.length > 20) {
    return { valid: false, error: "O nickname deve ter entre 3 e 20 caracteres." };
  }
  if (!/^[a-zA-Z0-9_.]+$/.test(trimmed)) {
    return {
      valid: false,
      error: "O nickname pode conter apenas letras, números, sublinhado (_) e ponto (.).",
    };
  }
  return { valid: true };
}

/**
 * Valida o curso selecionado.
 * @param {string} course
 * @returns {boolean}
 */
export function validateCourse(course) {
  return ["arquitetura", "design", "outro"].includes(course);
}

/**
 * Busca o usuário autenticado na requisição através do cookie de sessão.
 * NUNCA devolve fingerprint, IP, user_agent nem session_token_hash.
 *
 * @param {import("@libsql/client/web").Client} db
 * @param {Request} request
 * @returns {Promise<{ id: number, nick: string, course: string } | null>}
 */
export async function getAuthenticatedUser(db, request) {
  const rawToken = getSessionTokenFromRequest(request);
  if (!rawToken) return null;

  const tokenHash = await sha256(rawToken);
  const result = await db.execute({
    sql: "SELECT id, nick, course FROM users WHERE session_token_hash = ? LIMIT 1;",
    args: [tokenHash],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: Number(row.id),
    nick: String(row.nick),
    course: String(row.course),
  };
}
