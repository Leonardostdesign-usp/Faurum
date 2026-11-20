import { getDb } from "../../shared/db.js";
import { getPhaseState } from "../../shared/config.js";
import {
  validateNick,
  validateCourse,
  generateSessionToken,
  sha256,
  createSessionCookie,
  getClientIp,
} from "../../shared/auth.js";
import { jsonResponse, errorResponse } from "../../shared/response.js";

export async function onRequestPost(context) {
  const { env, request } = context;

  const phaseState = getPhaseState(env);
  if (phaseState.phase === "before" || phaseState.phase === "closed") {
    return errorResponse(
      "A criação de usuário só é permitida durante o período ativo de um tópico.",
      409,
      "TOPIC_CLOSED"
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return errorResponse("Corpo da requisição inválido.");
  }

  const { nick, course, privacyAccepted, fingerprint } = body || {};

  if (!privacyAccepted) {
    return errorResponse(
      "É obrigatório aceitar o Aviso de Privacidade para participar.",
      400,
      "PRIVACY_REQUIRED"
    );
  }

  const nickValidation = validateNick(nick);
  if (!nickValidation.valid) {
    return errorResponse(nickValidation.error, 400, "INVALID_NICK", { field: "nick" });
  }

  if (!validateCourse(course)) {
    return errorResponse("Curso selecionado inválido.", 400, "INVALID_COURSE", { field: "course" });
  }

  const cleanNick = nick.trim();
  const db = getDb(env);

  // Verifica se o nick já existe (case-insensitive)
  const existingUser = await db.execute({
    sql: "SELECT id FROM users WHERE nick = ? COLLATE NOCASE LIMIT 1;",
    args: [cleanNick],
  });

  if (existingUser.rows.length > 0) {
    return errorResponse("Este nickname já está em uso.", 409, "NICK_TAKEN", { field: "nick" });
  }

  const token = generateSessionToken();
  const tokenHash = await sha256(token);
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") || "unknown";
  const nowIso = new Date().toISOString();
  const clientFingerprint = String(fingerprint || "unknown").slice(0, 100);

  const insertResult = await db.execute({
    sql: `INSERT INTO users (nick, course, session_token_hash, fingerprint, ip, user_agent, privacy_accepted_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    args: [cleanNick, course, tokenHash, clientFingerprint, ip, userAgent, nowIso, nowIso],
  });

  const userId = Number(insertResult.lastInsertRowid);
  const cookieHeader = createSessionCookie(token);

  return jsonResponse(
    {
      user: {
        id: userId,
        nick: cleanNick,
        course,
      },
    },
    201,
    {
      "Set-Cookie": cookieHeader,
    }
  );
}
