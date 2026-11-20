import assert from "node:assert";
import { getDb } from "./lib/db.js";
import { getPhaseState, getCurrentDate } from "../shared/config.js";
import {
  validateNick,
  validateCourse,
  generateSessionToken,
  sha256,
} from "../shared/auth.js";
import { formatReplyRow } from "../shared/replies-helper.js";

async function runTestSuite() {
  console.log("==================================================");
  console.log("INICIANDO SUÍTE DE TESTES AUTOMATIZADOS (FAURUM)");
  console.log("==================================================\n");

  let passedTests = 0;
  function test(desc, fn) {
    try {
      fn();
      console.log(`  ✓ ${desc}`);
      passedTests++;
    } catch (err) {
      console.error(`  ✗ ${desc}`);
      console.error(`    Erro: ${err.message}`);
      process.exit(1);
    }
  }

  async function testAsync(desc, fn) {
    try {
      await fn();
      console.log(`  ✓ ${desc}`);
      passedTests++;
    } catch (err) {
      console.error(`  ✗ ${desc}`);
      console.error(`    Erro: ${err.message}`);
      process.exit(1);
    }
  }

  // --- 1. Testes de Fases com NOW_OVERRIDE ---
  console.log("1. Validação de Fases com NOW_OVERRIDE:");

  test("Fase 'before': antes de 30/11/2026 06:00", () => {
    const env = { NOW_OVERRIDE: "2026-11-29T10:00:00-03:00", ENVIRONMENT: "development" };
    const state = getPhaseState(env);
    assert.strictEqual(state.phase, "before");
    assert.strictEqual(state.activeTopicId, null);
    assert(state.nextTransitionAt !== null);
  });

  test("Fase 'topic1': 30/11 06:00 até 01/12 13:00", () => {
    const env = { NOW_OVERRIDE: "2026-11-30T12:00:00-03:00", ENVIRONMENT: "development" };
    const state = getPhaseState(env);
    assert.strictEqual(state.phase, "topic1");
    assert.strictEqual(state.activeTopicId, 1);
    assert.strictEqual(state.activeTopic.id, 1);
  });

  test("Fase 'topic2': 01/12 13:00 até 02/12 23:59:59", () => {
    const env = { NOW_OVERRIDE: "2026-12-01T15:00:00-03:00", ENVIRONMENT: "development" };
    const state = getPhaseState(env);
    assert.strictEqual(state.phase, "topic2");
    assert.strictEqual(state.activeTopicId, 2);
    assert.strictEqual(state.activeTopic.id, 2);
  });

  test("Fase 'closed': a partir de 03/12 00:00", () => {
    const env = { NOW_OVERRIDE: "2026-12-03T01:00:00-03:00", ENVIRONMENT: "development" };
    const state = getPhaseState(env);
    assert.strictEqual(state.phase, "closed");
    assert.strictEqual(state.activeTopicId, null);
    assert.strictEqual(state.nextTransitionAt, null);
  });

  test("Proteção: NOW_OVERRIDE ignorado em ENVIRONMENT === 'production'", () => {
    const env = {
      NOW_OVERRIDE: "2026-11-20T10:00:00-03:00",
      ENVIRONMENT: "production",
    };
    const now = getCurrentDate(env);
    const diff = Math.abs(now.getTime() - Date.now());
    assert(diff < 2000, "Deveria usar Date.now() em produção");
  });

  // --- 2. Validações de Identidade & Nick ---
  console.log("\n2. Validações de Regras de Nick e Curso:");

  test("Nick válido (3 a 20 chars, sem espaço, letras/números/_/.)", () => {
    assert.strictEqual(validateNick("fau_design.26").valid, true);
    assert.strictEqual(validateNick("arq").valid, true);
    assert.strictEqual(validateNick("12345678901234567890").valid, true);
  });

  test("Rejeita nicks inválidos (< 3, > 20, espaços, caracteres especiais)", () => {
    assert.strictEqual(validateNick("ab").valid, false);
    assert.strictEqual(validateNick("123456789012345678901").valid, false);
    assert.strictEqual(validateNick("nick com espaco").valid, false);
    assert.strictEqual(validateNick("nick@fau").valid, false);
    assert.strictEqual(validateNick("nick!").valid, false);
  });

  test("Validação de cursos permitidos", () => {
    assert.strictEqual(validateCourse("arquitetura"), true);
    assert.strictEqual(validateCourse("design"), true);
    assert.strictEqual(validateCourse("outro"), true);
    assert.strictEqual(validateCourse("engenharia"), false);
  });

  // --- 3. Testes de Banco de Dados no faurum-dev ---
  console.log("\n3. Integração com Banco de Dados (faurum-dev):");

  const db = await getDb({ prod: false });

  let testUserId1 = null;
  let testUserId2 = null;
  let parentReplyId = null;
  let childReplyId = null;
  const uniquePrefix = `t_${Date.now()}`;

  await testAsync("Criação de usuário e hash de sessão", async () => {
    const nick1 = `${uniquePrefix}_arq`;
    const token = generateSessionToken();
    const tokenHash = await sha256(token);
    const nowIso = new Date().toISOString();

    const res = await db.execute({
      sql: `INSERT INTO users (nick, course, session_token_hash, fingerprint, ip, user_agent, privacy_accepted_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [nick1, "arquitetura", tokenHash, "fp_test_1", "127.0.0.1", "TestBot/1.0", nowIso, nowIso],
    });
    testUserId1 = Number(res.lastInsertRowid);
    assert(testUserId1 > 0);
  });

  await testAsync("Rejeição de nick duplicado (case-insensitive)", async () => {
    const nickLower = `${uniquePrefix}_arq`;
    const nickUpper = `${uniquePrefix}_ARQ`;

    // Verifica que o banco encontra colisão
    const check = await db.execute({
      sql: "SELECT id FROM users WHERE nick = ? COLLATE NOCASE;",
      args: [nickUpper],
    });
    assert.strictEqual(check.rows.length, 1);
  });

  await testAsync("Criação de segundo usuário", async () => {
    const nick2 = `${uniquePrefix}_des`;
    const token = generateSessionToken();
    const tokenHash = await sha256(token);
    const nowIso = new Date().toISOString();

    const res = await db.execute({
      sql: `INSERT INTO users (nick, course, session_token_hash, fingerprint, ip, user_agent, privacy_accepted_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [nick2, "design", tokenHash, "fp_test_2", "127.0.0.1", "TestBot/1.0", nowIso, nowIso],
    });
    testUserId2 = Number(res.lastInsertRowid);
    assert(testUserId2 > 0);
  });

  await testAsync("Postagem de resposta de nível raiz (tópico 1)", async () => {
    const body = "Resposta de teste sobre o almoço do bandejão da FAU.";
    const nowIso = new Date().toISOString();

    const res = await db.execute({
      sql: `INSERT INTO replies (topic_id, parent_id, user_id, body, created_at)
            VALUES (?, NULL, ?, ?, ?);`,
      args: [1, testUserId1, body, nowIso],
    });
    parentReplyId = Number(res.lastInsertRowid);
    assert(parentReplyId > 0);
  });

  await testAsync("Postagem de resposta aninhada (resposta à resposta anterior)", async () => {
    const body = "Resposta filha concordando com a refeição.";
    const nowIso = new Date().toISOString();

    const res = await db.execute({
      sql: `INSERT INTO replies (topic_id, parent_id, user_id, body, created_at)
            VALUES (?, ?, ?, ?, ?);`,
      args: [1, parentReplyId, testUserId2, body, nowIso],
    });
    childReplyId = Number(res.lastInsertRowid);
    assert(childReplyId > 0);
  });

  await testAsync("Sistema de votos: upvote, troca para downvote e remoção", async () => {
    const nowIso = new Date().toISOString();

    // 1. Upvote (+1) pelo usuário 2
    await db.execute({
      sql: `INSERT INTO votes (user_id, reply_id, value, created_at, updated_at)
            VALUES (?, ?, 1, ?, ?)
            ON CONFLICT (user_id, reply_id) DO UPDATE SET value = excluded.value;`,
      args: [testUserId2, parentReplyId, nowIso, nowIso],
    });

    let voteCheck = await db.execute({
      sql: "SELECT value FROM votes WHERE user_id = ? AND reply_id = ?;",
      args: [testUserId2, parentReplyId],
    });
    assert.strictEqual(Number(voteCheck.rows[0].value), 1);

    // 2. Troca para Downvote (-1)
    await db.execute({
      sql: `INSERT INTO votes (user_id, reply_id, value, created_at, updated_at)
            VALUES (?, ?, -1, ?, ?)
            ON CONFLICT (user_id, reply_id) DO UPDATE SET value = excluded.value;`,
      args: [testUserId2, parentReplyId, nowIso, nowIso],
    });
    voteCheck = await db.execute({
      sql: "SELECT value FROM votes WHERE user_id = ? AND reply_id = ?;",
      args: [testUserId2, parentReplyId],
    });
    assert.strictEqual(Number(voteCheck.rows[0].value), -1);

    // 3. Remoção do voto (value = 0)
    await db.execute({
      sql: "DELETE FROM votes WHERE user_id = ? AND reply_id = ?;",
      args: [testUserId2, parentReplyId],
    });
    voteCheck = await db.execute({
      sql: "SELECT value FROM votes WHERE user_id = ? AND reply_id = ?;",
      args: [testUserId2, parentReplyId],
    });
    assert.strictEqual(voteCheck.rows.length, 0);
  });

  test("Cálculo de Accordion (recolhimento quando downvotes - upvotes > 3)", () => {
    // Saldo = 0 - 4 = -4 (downvotes - upvotes = 4 > 3) -> recolhido
    const mockRowCollapsed = {
      id: 99,
      topic_id: 1,
      parent_id: null,
      user_id: 1,
      body: "Comentário impopular",
      created_at: new Date().toISOString(),
      edited_at: null,
      deleted_at: null,
      author_nick: "aluno",
      author_course: "design",
      upvotes: 0,
      downvotes: 4,
      user_vote: 0,
      replies_count: 0,
    };
    const formatted = formatReplyRow(mockRowCollapsed);
    assert.strictEqual(formatted.isCollapsed, true);

    // Saldo = 2 - 3 = -1 (downvotes - upvotes = 1 <= 3) -> não recolhido
    const mockRowNormal = {
      ...mockRowCollapsed,
      upvotes: 2,
      downvotes: 3,
    };
    const formattedNormal = formatReplyRow(mockRowNormal);
    assert.strictEqual(formattedNormal.isCollapsed, false);
  });

  await testAsync("Edição de resposta pelo autor (marcação de edited_at)", async () => {
    const editedText = "Texto da resposta editado com novas reflexões.";
    const nowIso = new Date().toISOString();

    await db.execute({
      sql: "UPDATE replies SET body = ?, edited_at = ? WHERE id = ?;",
      args: [editedText, nowIso, childReplyId],
    });

    const check = await db.execute({
      sql: "SELECT body, edited_at FROM replies WHERE id = ?;",
      args: [childReplyId],
    });
    assert.strictEqual(check.rows[0].body, editedText);
    assert(check.rows[0].edited_at !== null);
  });

  await testAsync("Exclusão lógica: resposta com filhas mantém '[resposta apagada]'", async () => {
    const nowIso = new Date().toISOString();
    // parentReplyId tem childReplyId como filha
    await db.execute({
      sql: "UPDATE replies SET deleted_at = ?, body = NULL WHERE id = ?;",
      args: [nowIso, parentReplyId],
    });

    const check = await db.execute({
      sql: "SELECT id, body, deleted_at FROM replies WHERE id = ?;",
      args: [parentReplyId],
    });
    assert.strictEqual(check.rows[0].body, null);
    assert(check.rows[0].deleted_at !== null);

    const formatted = formatReplyRow({
      ...check.rows[0],
      topic_id: 1,
      parent_id: null,
      user_id: testUserId1,
      created_at: nowIso,
      author_nick: "autor",
      author_course: "arquitetura",
      upvotes: 0,
      downvotes: 0,
    });
    assert.strictEqual(formatted.body, "[resposta apagada]");
    assert.strictEqual(formatted.isDeleted, true);
  });

  await testAsync("Exclusão física: resposta sem filhas é removida do banco", async () => {
    // childReplyId não tem filhas
    await db.execute({
      sql: "DELETE FROM replies WHERE id = ?;",
      args: [childReplyId],
    });

    const check = await db.execute({
      sql: "SELECT id FROM replies WHERE id = ?;",
      args: [childReplyId],
    });
    assert.strictEqual(check.rows.length, 0);
  });

  // Limpeza dos dados de teste
  await db.execute({ sql: "DELETE FROM replies WHERE id = ?;", args: [parentReplyId] });
  await db.execute({ sql: "DELETE FROM users WHERE id IN (?, ?);", args: [testUserId1, testUserId2] });

  console.log("\n==================================================");
  console.log(`TODOS OS ${passedTests} TESTES PASSARAM COM SUCESSO!`);
  console.log("==================================================\n");
}

runTestSuite().catch((err) => {
  console.error("Falha fatal na suíte de testes:", err);
  process.exit(1);
});
