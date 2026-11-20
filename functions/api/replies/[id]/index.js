import { getDb } from "../../../../shared/db.js";
import { getPhaseState } from "../../../../shared/config.js";
import { getAuthenticatedUser } from "../../../../shared/auth.js";
import { jsonResponse, errorResponse } from "../../../../shared/response.js";
import { REPLIES_SELECT_SQL, formatReplyRow } from "../../../../shared/replies-helper.js";

export async function onRequestGet(context) {
  const { env, request, params } = context;
  const replyId = Number(params.id);

  if (!replyId || isNaN(replyId)) {
    return errorResponse("ID de resposta inválido.", 400);
  }

  const phaseState = getPhaseState(env);
  if (phaseState.phase === "before") {
    return errorResponse("A plataforma ainda não está aberta.", 403, "NOT_OPEN");
  }

  const db = getDb(env);
  const currentUser = await getAuthenticatedUser(db, request);
  const currentUserId = currentUser ? currentUser.id : null;

  // 1. Busca a resposta alvo
  const targetResult = await db.execute({
    sql: `
      ${REPLIES_SELECT_SQL}
      WHERE r.id = ? AND r.hidden = 0
      GROUP BY r.id, r.topic_id, r.parent_id, r.user_id, r.body, r.created_at, r.edited_at, r.deleted_at, u.nick, u.course
      LIMIT 1;
    `,
    args: [currentUserId, replyId],
  });

  if (targetResult.rows.length === 0) {
    return errorResponse("Resposta não encontrada.", 404, "NOT_FOUND");
  }

  const targetRow = targetResult.rows[0];
  const targetTopicId = Number(targetRow.topic_id);

  // Verificação de fase para o tópico
  if (phaseState.phase === "topic1" && targetTopicId !== 1) {
    return errorResponse("Resposta não encontrada.", 404, "NOT_FOUND");
  }
  if (phaseState.phase === "topic2" && targetTopicId !== 2) {
    return errorResponse("Resposta não encontrada.", 404, "NOT_FOUND");
  }

  const reply = formatReplyRow(targetRow, currentUserId, phaseState.serverTime);

  // 2. Busca a cadeia de ancestrais (do pai imediato até a raiz)
  const ancestors = [];
  let currentParentId = targetRow.parent_id;

  while (currentParentId !== null && currentParentId !== undefined) {
    const parentRes = await db.execute({
      sql: `
        ${REPLIES_SELECT_SQL}
        WHERE r.id = ? AND r.hidden = 0
        GROUP BY r.id, r.topic_id, r.parent_id, r.user_id, r.body, r.created_at, r.edited_at, r.deleted_at, u.nick, u.course
        LIMIT 1;
      `,
      args: [currentUserId, Number(currentParentId)],
    });

    if (parentRes.rows.length === 0) break;

    const parentRow = parentRes.rows[0];
    ancestors.unshift(formatReplyRow(parentRow, currentUserId, phaseState.serverTime));
    currentParentId = parentRow.parent_id;
  }

  // 3. Busca respostas diretas (filhas)
  const childrenResult = await db.execute({
    sql: `
      ${REPLIES_SELECT_SQL}
      WHERE r.parent_id = ? AND r.hidden = 0
      GROUP BY r.id, r.topic_id, r.parent_id, r.user_id, r.body, r.created_at, r.edited_at, r.deleted_at, u.nick, u.course
      ORDER BY r.created_at DESC;
    `,
    args: [currentUserId, replyId],
  });

  const replies = childrenResult.rows.map((row) =>
    formatReplyRow(row, currentUserId, phaseState.serverTime)
  );

  return jsonResponse({
    reply,
    ancestors,
    replies,
  });
}

export async function onRequestPatch(context) {
  const { env, request, params } = context;
  const replyId = Number(params.id);

  if (!replyId || isNaN(replyId)) {
    return errorResponse("ID de resposta inválido.", 400);
  }

  const phaseState = getPhaseState(env);
  if (phaseState.phase === "before" || phaseState.phase === "closed") {
    return errorResponse("O tópico está fechado para edições.", 409, "TOPIC_CLOSED");
  }

  const db = getDb(env);
  const currentUser = await getAuthenticatedUser(db, request);

  if (!currentUser) {
    return errorResponse("Não autorizado.", 401, "UNAUTHORIZED");
  }

  // Localiza a resposta existente
  const checkRes = await db.execute({
    sql: "SELECT id, topic_id, user_id, deleted_at FROM replies WHERE id = ? AND hidden = 0 LIMIT 1;",
    args: [replyId],
  });

  if (checkRes.rows.length === 0) {
    return errorResponse("Resposta não encontrada.", 404, "NOT_FOUND");
  }

  const replyRecord = checkRes.rows[0];

  if (Number(replyRecord.topic_id) !== phaseState.activeTopicId) {
    return errorResponse("O tópico desta resposta já foi encerrado.", 409, "TOPIC_CLOSED");
  }

  if (Number(replyRecord.user_id) !== currentUser.id) {
    return errorResponse("Você só pode editar suas próprias respostas.", 403, "FORBIDDEN");
  }

  if (replyRecord.deleted_at) {
    return errorResponse("Não é possível editar uma resposta que foi apagada.", 400, "ALREADY_DELETED");
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
    return errorResponse("A resposta excede o limite máximo de 500 caracteres.", 400, "BODY_TOO_LONG");
  }

  const nowIso = new Date().toISOString();
  await db.execute({
    sql: "UPDATE replies SET body = ?, edited_at = ? WHERE id = ?;",
    args: [cleanText, nowIso, replyId],
  });

  // Retorna a resposta atualizada
  const updatedRes = await db.execute({
    sql: `
      ${REPLIES_SELECT_SQL}
      WHERE r.id = ?
      GROUP BY r.id, r.topic_id, r.parent_id, r.user_id, r.body, r.created_at, r.edited_at, r.deleted_at, u.nick, u.course
      LIMIT 1;
    `,
    args: [currentUser.id, replyId],
  });

  const reply = formatReplyRow(updatedRes.rows[0], currentUser.id, phaseState.serverTime);

  return jsonResponse({ reply });
}

export async function onRequestDelete(context) {
  const { env, request, params } = context;
  const replyId = Number(params.id);

  if (!replyId || isNaN(replyId)) {
    return errorResponse("ID de resposta inválido.", 400);
  }

  const phaseState = getPhaseState(env);
  if (phaseState.phase === "before" || phaseState.phase === "closed") {
    return errorResponse("O tópico está fechado para exclusões.", 409, "TOPIC_CLOSED");
  }

  const db = getDb(env);
  const currentUser = await getAuthenticatedUser(db, request);

  if (!currentUser) {
    return errorResponse("Não autorizado.", 401, "UNAUTHORIZED");
  }

  const checkRes = await db.execute({
    sql: "SELECT id, topic_id, user_id, deleted_at FROM replies WHERE id = ? AND hidden = 0 LIMIT 1;",
    args: [replyId],
  });

  if (checkRes.rows.length === 0) {
    return errorResponse("Resposta não encontrada.", 404, "NOT_FOUND");
  }

  const replyRecord = checkRes.rows[0];

  if (Number(replyRecord.topic_id) !== phaseState.activeTopicId) {
    return errorResponse("O tópico desta resposta já foi encerrado.", 409, "TOPIC_CLOSED");
  }

  if (Number(replyRecord.user_id) !== currentUser.id) {
    return errorResponse("Você só pode apagar suas próprias respostas.", 403, "FORBIDDEN");
  }

  // Verifica se a resposta possui respostas filhas
  const childrenCheck = await db.execute({
    sql: "SELECT COUNT(*) as cnt FROM replies WHERE parent_id = ? AND hidden = 0;",
    args: [replyId],
  });

  const hasChildren = Number(childrenCheck.rows[0].cnt) > 0;
  const nowIso = new Date().toISOString();

  if (hasChildren) {
    // Exclusão lógica com reserva de espaço
    await db.execute({
      sql: "UPDATE replies SET deleted_at = ?, body = NULL WHERE id = ?;",
      args: [nowIso, replyId],
    });
    return jsonResponse({ success: true, softDeleted: true });
  } else {
    // Sem filhas: some fisicamente
    await db.execute({
      sql: "DELETE FROM replies WHERE id = ?;",
      args: [replyId],
    });
    return jsonResponse({ success: true, softDeleted: false });
  }
}
