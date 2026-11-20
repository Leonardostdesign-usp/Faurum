/**
 * Utilitários de resposta HTTP para as Cloudflare Pages Functions
 */

export function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

export function errorResponse(message, status = 400, code = undefined, extra = {}) {
  return jsonResponse(
    {
      error: message,
      ...(code ? { code } : {}),
      ...extra,
    },
    status
  );
}
