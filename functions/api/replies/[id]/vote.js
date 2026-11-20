import { getDb } from "../../../../shared/db.js";
import { getPhaseState } from "../../../../shared/config.js";
import { getAuthenticatedUser } from "../../../../shared/auth.js";
import { jsonResponse, errorResponse } from "../../../../shared/response.js";
import { REPLIES_SELECT_SQL, formatReplyRow } from "../../../../shared/replies-helper.js";

export async function onRequestPut(context) {
  const { env, request, params } = context;
  const replyId = Number(params.id);

  if (!replyId || isNaN(replyId)) {
    return errorResponse("ID de resposta inválido.", 400);
  }

  const phaseState = getPhaseState(env);
  if (phaseState.phase === "before" || phaseState.phase === "closed") {
    return errorResponse("Votação encerrada para este tópico.", 409, "TOPIC_CLOSED");
  }

  const db = getDb(env);
  const currentUser = await getAuthenticatedUser(db, request);

  if (!currentUser) {
    return errorResponse("Você precisa definir um nickname para votar.", 401, "UNAUTHORIZED");
  }

  let bodyData;
  try {
    bodyData = await request.json();
  } catch (err) {
    return errorResponse("Corpo da requisição inválido.");
  }

  const voteValue = Number(bodyData.value);
  if (![1, -1, 0].includes(voteValue)) {
    return errorResponse("O valor do voto deve ser 1, -1 ou 0 (remover).", 400);
  }

  // Verifica existência da resposta e integridade da fase
  const replyRes = await db.execute({
    sql: "SELECT id, topic_id FROM replies WHERE id = ? AND hidden = 0 LIMIT 1;",
    args: [replyId],
  });

  if (replyRes.rows.length === 0) {
    return errorResponse("Resposta não encontrada.", 404, "NOT_FOUND");
  }

  const targetTopicId = Number(replyRes.rows[0].topic_id);
  if (targetTopicId !== phaseState.activeTopicId) {
    return errorResponse("O tópico desta resposta já foi encerrado para votos.", 409, "TOPIC_CLOSED");
  }

  const nowIso = new Date().toISOString();

  if (voteValue === 0) {
    // Remove o voto
    await db.execute({
      sql: "DELETE FROM votes WHERE user_id = ? AND reply_id = ?;",
      args: [currentUser.id, replyId],
    });
  } else {
    // Cria ou atualiza o voto (upsert)
    await db.execute({
      sql: `
        INSERT INTO votes (user_id, reply_id, value, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (user_id, reply_id) DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at;
      `,
      args: [currentUser.id, replyId, voteValue, nowIso, nowIso],
    });
  }

  // Busca estado atualizado da resposta
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
