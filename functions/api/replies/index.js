import { getDb } from "../../../shared/db.js";
import { getPhaseState } from "../../../shared/config.js";
import { getAuthenticatedUser } from "../../../shared/auth.js";
import { jsonResponse, errorResponse } from "../../../shared/response.js";
import { REPLIES_SELECT_SQL, formatReplyRow } from "../../../shared/replies-helper.js";

export async function onRequestGet(context) {
  const { env, request } = context;
  const phaseState = getPhaseState(env);

  if (phaseState.phase === "before") {
    return errorResponse("A plataforma ainda não está aberta.", 403, "NOT_OPEN");
  }

  const url = new URL(request.url);
  const topicIdParam = url.searchParams.get("topicId");
  const parentIdParam = url.searchParams.get("parentId");

  let targetTopicId = topicIdParam ? Number(topicIdParam) : phaseState.activeTopicId;

  // Validação estrita de fase para visualização
  if (phaseState.phase === "topic1" && targetTopicId !== 1) {
    return jsonResponse({ replies: [] });
  }
  if (phaseState.phase === "topic2" && targetTopicId !== 2) {
    // Tópico 1 some por completo na fase 2
    return jsonResponse({ replies: [] });
  }
  if (phaseState.phase === "closed") {
    if (!targetTopicId || (targetTopicId !== 1 && targetTopicId !== 2)) {
      targetTopicId = 1;
    }
  }

  const db = getDb(env);
  const currentUser = await getAuthenticatedUser(db, request);
  const currentUserId = currentUser ? currentUser.id : null;

  let querySql = "";
  const queryArgs = [currentUserId, targetTopicId];

  if (parentIdParam !== null && parentIdParam !== undefined && parentIdParam !== "" && parentIdParam !== "null") {
    const parentId = Number(parentIdParam);
    querySql = `
      ${REPLIES_SELECT_SQL}
      WHERE r.topic_id = ? AND r.hidden = 0 AND r.parent_id = ?
      GROUP BY r.id, r.topic_id, r.parent_id, r.user_id, r.body, r.created_at, r.edited_at, r.deleted_at, u.nick, u.course
      ORDER BY r.created_at DESC;
    `;
    queryArgs.push(parentId);
  } else {
    querySql = `
      ${REPLIES_SELECT_SQL}
      WHERE r.topic_id = ? AND r.hidden = 0 AND r.parent_id IS NULL
      GROUP BY r.id, r.topic_id, r.parent_id, r.user_id, r.body, r.created_at, r.edited_at, r.deleted_at, u.nick, u.course
      ORDER BY r.created_at DESC;
    `;
  }

  const result = await db.execute({
    sql: querySql,
    args: queryArgs,
  });

  const replies = result.rows.map((row) =>
    formatReplyRow(row, currentUserId, phaseState.serverTime)
  );

  return jsonResponse({ replies });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const phaseState = getPhaseState(env);

  if (phaseState.phase === "before" || phaseState.phase === "closed") {
    return errorResponse(
      "O período de respostas para este tópico está encerrado.",
      409,
      "TOPIC_CLOSED"
    );
  }

  const db = getDb(env);
  const currentUser = await getAuthenticatedUser(db, request);

  if (!currentUser) {
    return errorResponse(
      "Você precisa escolher um nickname e aceitar os termos para responder.",
      401,
      "UNAUTHORIZED"
    );
  }

  let bodyData;
  try {
    bodyData = await request.json();
  } catch (err) {
    return errorResponse("Corpo da requisição inválido.");
  }

  const rawText = bodyData.body || bodyData.text;
  if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
    return errorResponse("A resposta não pode ser vazia.", 400, "EMPTY_BODY");
  }

  const cleanText = rawText.trim();
  if (cleanText.length > 500) {
    return errorResponse(
      "A resposta excede o limite máximo de 500 caracteres.",
      400,
      "BODY_TOO_LONG"
    );
  }

  const topicId = bodyData.topicId ? Number(bodyData.topicId) : phaseState.activeTopicId;
  if (topicId !== phaseState.activeTopicId) {
    return errorResponse(
      "Não é possível responder a um tópico fechado ou diferente do vigente.",
      409,
      "TOPIC_CLOSED"
    );
  }

  let parentId = null;
  if (bodyData.parentId !== null && bodyData.parentId !== undefined) {
    parentId = Number(bodyData.parentId);
    // Valida se o pai existe e pertence ao tópico vigente
    const parentCheck = await db.execute({
      sql: "SELECT id, topic_id FROM replies WHERE id = ? AND hidden = 0 LIMIT 1;",
      args: [parentId],
    });

    if (parentCheck.rows.length === 0) {
      return errorResponse("Resposta pai não encontrada.", 404, "PARENT_NOT_FOUND");
    }

    if (Number(parentCheck.rows[0].topic_id) !== phaseState.activeTopicId) {
      return errorResponse(
        "A resposta pai pertence a um tópico encerrado.",
        409,
        "TOPIC_CLOSED"
      );
    }
  }

  const nowIso = new Date().toISOString();
  const insertResult = await db.execute({
    sql: `INSERT INTO replies (topic_id, parent_id, user_id, body, created_at)
          VALUES (?, ?, ?, ?, ?);`,
    args: [topicId, parentId, currentUser.id, cleanText, nowIso],
  });

  const insertedId = Number(insertResult.lastInsertRowid);

  // Busca o registro recém-criado já no formato enriquecido
  const fetchResult = await db.execute({
    sql: `
      ${REPLIES_SELECT_SQL}
      WHERE r.id = ?
      GROUP BY r.id, r.topic_id, r.parent_id, r.user_id, r.body, r.created_at, r.edited_at, r.deleted_at, u.nick, u.course
      LIMIT 1;
    `,
    args: [currentUser.id, insertedId],
  });

  const reply = formatReplyRow(fetchResult.rows[0], currentUser.id, phaseState.serverTime);

  return jsonResponse({ reply }, 201);
}
