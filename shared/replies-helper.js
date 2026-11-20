import { formatRelativeTime } from "./relative-time.js";

/**
 * Consulta SQL base para buscar respostas enriquecidas com votos e contagem de respostas diretas.
 * NUNCA devolve fingerprint, IP, user_agent nem token.
 */
export const REPLIES_SELECT_SQL = `
  SELECT
    r.id,
    r.topic_id,
    r.parent_id,
    r.user_id,
    r.body,
    r.created_at,
    r.edited_at,
    r.deleted_at,
    u.nick AS author_nick,
    u.course AS author_course,
    COALESCE(SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
    COALESCE(SUM(CASE WHEN v.value = -1 THEN 1 ELSE 0 END), 0) AS downvotes,
    COALESCE(MAX(CASE WHEN uv.value IS NOT NULL THEN uv.value ELSE 0 END), 0) AS user_vote,
    (
      SELECT COUNT(*)
      FROM replies c
      WHERE c.parent_id = r.id AND c.hidden = 0
    ) AS replies_count
  FROM replies r
  JOIN users u ON u.id = r.user_id
  LEFT JOIN votes v ON v.reply_id = r.id
  LEFT JOIN votes uv ON uv.reply_id = r.id AND uv.user_id = ?
`;

/**
 * Formata um registro do banco no padrão esperado pelo frontend.
 *
 * @param {Record<string, any>} row
 * @param {number | null} [currentUserId]
 * @param {Date | string} [serverTime]
 * @returns {Record<string, any>}
 */
export function formatReplyRow(row, currentUserId = null, serverTime = new Date()) {
  const upvotes = Number(row.upvotes || 0);
  const downvotes = Number(row.downvotes || 0);
  const score = upvotes - downvotes;
  const isDeleted = Boolean(row.deleted_at);
  const repliesCount = Number(row.replies_count || 0);

  return {
    id: Number(row.id),
    topicId: Number(row.topic_id),
    parentId: row.parent_id !== null && row.parent_id !== undefined ? Number(row.parent_id) : null,
    author: {
      nick: String(row.author_nick || "anônimo"),
      course: String(row.author_course || "outro"),
    },
    isOwner: currentUserId !== null && Number(row.user_id) === Number(currentUserId),
    body: isDeleted ? "[resposta apagada]" : String(row.body || ""),
    createdAt: row.created_at,
    editedAt: row.edited_at,
    isEdited: !isDeleted && Boolean(row.edited_at),
    isDeleted,
    relativeTime: formatRelativeTime(row.created_at, serverTime),
    upvotes,
    downvotes,
    score,
    userVote: Number(row.user_vote || 0),
    repliesCount,
    isCollapsed: downvotes - upvotes > 3,
  };
}
