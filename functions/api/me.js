import { getDb } from "../../shared/db.js";
import { getAuthenticatedUser } from "../../shared/auth.js";
import { jsonResponse } from "../../shared/response.js";

export async function onRequestGet(context) {
  const { env, request } = context;

  try {
    const db = getDb(env);
    const user = await getAuthenticatedUser(db, request);
    return jsonResponse({ user });
  } catch (err) {
    return jsonResponse({ user: null });
  }
}
