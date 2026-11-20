import { getDb } from "../../shared/db.js";
import { getPhaseState } from "../../shared/config.js";
import { getAuthenticatedUser } from "../../shared/auth.js";
import { jsonResponse } from "../../shared/response.js";

export async function onRequestGet(context) {
  const { env, request } = context;

  const state = getPhaseState(env);

  let user = null;
  try {
    const db = getDb(env);
    user = await getAuthenticatedUser(db, request);
  } catch (err) {
    // Se falhar a conexão ou não tiver cookie, mantém user = null
  }

  return jsonResponse({
    ...state,
    user,
  });
}
