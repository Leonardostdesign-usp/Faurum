import { getDb } from "../../shared/db.js";
import { getPhaseState, TOPICS } from "../../shared/config.js";
import { jsonResponse, errorResponse } from "../../shared/response.js";

export async function onRequestGet(context) {
  const { env } = context;
  const phaseState = getPhaseState(env);

  if (phaseState.phase !== "closed") {
    return errorResponse(
      "O arquivo completo só fica disponível na fase de encerramento da plataforma.",
      403,
      "NOT_CLOSED"
    );
  }

  const db = getDb(env);

  // Contagem de comentários por tópico
  const countRes = await db.execute(`
    SELECT topic_id, COUNT(*) as cnt
    FROM replies
    WHERE hidden = 0
    GROUP BY topic_id;
  `);

  const counts = {};
  for (const row of countRes.rows) {
    counts[Number(row.topic_id)] = Number(row.cnt);
  }

  const topicsList = [
    {
      ...TOPICS[1],
      repliesCount: counts[1] || 0,
    },
    {
      ...TOPICS[2],
      repliesCount: counts[2] || 0,
    },
  ];

  return jsonResponse({
    phase: "closed",
    topics: topicsList,
  });
}
