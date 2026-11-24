/**
 * Configuração de Tópicos, Fases e Datas da plataforma Faurum
 * Fuso horário: America/Sao_Paulo (UTC-3)
 */

export const TOPICS = {
  1: {
    id: 1,
    title: "Como estava a sua janta ou o seu almoço do bandejão hoje?",
    subtitle: "Compartilhe sua refeição, impressões e experiências no bandejão da FAU.",
    label: "Pergunta do dia 1",
  },
  2: {
    id: 2,
    title: "O que você mais inveja do curso do amiguinho de design ou de arquitetura?",
    subtitle: "Provocando conexões criativas entre arquitetura, urbanismo e design.",
    label: "Pergunta do dia 2",
  },
};

export const DEFAULT_DATES = {
  TOPIC1_START: "2026-11-23T06:00:00-03:00",
  TOPIC1_END: "2026-11-23T13:00:00-03:00",
  TOPIC2_START: "2026-11-23T13:00:00-03:00",
  TOPIC2_END: "2026-12-02T23:59:59-03:00",
  CLOSED_START: "2026-12-03T00:00:00-03:00",
};

/**
 * Obtém a data de referência atual, respeitando NOW_OVERRIDE.
 * Por segurança, só é aplicado fora de produção, ou em produção quando
 * ALLOW_PHASE_OVERRIDE="true" estiver explicitamente definido.
 * @param {Record<string, any>} [env]
 * @returns {Date}
 */
export function getCurrentDate(env = {}) {
  const isProduction = env.ENVIRONMENT === "production";
  const allowOverride = !isProduction || env.ALLOW_PHASE_OVERRIDE === "true";
  if (allowOverride && env.NOW_OVERRIDE) {
    const overrideDate = new Date(env.NOW_OVERRIDE);
    if (!isNaN(overrideDate.getTime())) {
      return overrideDate;
    }
  }
  return new Date();
}

/**
 * Calcula a fase atual e detalhes do tópico ativo com base nas variáveis de ambiente.
 *
 * FORCE_PHASE ('before' | 'topic1' | 'topic2' | 'closed') pode ser usada para
 * forçar a fase durante testes, sem depender do relógio. Por segurança, só é
 * aplicada fora de produção, ou em produção quando ALLOW_PHASE_OVERRIDE="true"
 * estiver explicitamente definido.
 *
 * @param {Record<string, any>} [env]
 * @param {Date} [currentDate]
 * @returns {{
 *   phase: 'before' | 'topic1' | 'topic2' | 'closed',
 *   activeTopicId: 1 | 2 | null,
 *   activeTopic: typeof TOPICS[1] | null,
 *   nextTransitionAt: string | null,
 *   serverTime: string
 * }}
 */
export function getPhaseState(env = {}, currentDate = null) {
  const now = currentDate || getCurrentDate(env);

  const t1Start = new Date(env.TOPIC1_START || DEFAULT_DATES.TOPIC1_START);
  const t1End = new Date(env.TOPIC1_END || DEFAULT_DATES.TOPIC1_END);
  const t2Start = new Date(env.TOPIC2_START || DEFAULT_DATES.TOPIC2_START);
  const t2End = new Date(env.TOPIC2_END || DEFAULT_DATES.TOPIC2_END);
  const closedStart = new Date(env.CLOSED_START || DEFAULT_DATES.CLOSED_START);

  const isProduction = env.ENVIRONMENT === "production";
  const allowOverride = !isProduction || env.ALLOW_PHASE_OVERRIDE === "true";
  const forcedPhase = allowOverride ? env.FORCE_PHASE : null;
  const validPhases = ["before", "topic1", "topic2", "closed"];

  let phase = "before";
  let activeTopicId = null;
  let nextTransitionAt = null;

  if (forcedPhase && validPhases.includes(forcedPhase)) {
    phase = forcedPhase;
  } else if (now < t1Start) {
    phase = "before";
  } else if (now >= t1Start && now < t1End) {
    phase = "topic1";
  } else if (now >= t2Start && now < t2End) {
    phase = "topic2";
  } else {
    phase = "closed";
  }

  if (phase === "before") {
    activeTopicId = null;
    nextTransitionAt = t1Start.toISOString();
  } else if (phase === "topic1") {
    activeTopicId = 1;
    nextTransitionAt = t1End.toISOString();
  } else if (phase === "topic2") {
    activeTopicId = 2;
    nextTransitionAt = t2End.toISOString();
  } else {
    activeTopicId = null;
    nextTransitionAt = null;
  }

  return {
    phase,
    activeTopicId,
    activeTopic: activeTopicId ? TOPICS[activeTopicId] : null,
    nextTransitionAt,
    serverTime: now.toISOString(),
  };
}
