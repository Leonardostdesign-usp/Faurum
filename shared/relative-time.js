/**
 * Formatação de datas relativas em PT-BR ("agora", "há 5 min", "há 2h", "há 3d")
 */

export function formatRelativeTime(dateInput, referenceDate = new Date()) {
  if (!dateInput) return "";

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const ref = typeof referenceDate === "string" ? new Date(referenceDate) : referenceDate;

  const diffMs = ref.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) {
    return "agora mesmo";
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `há ${diffMin} min`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `há ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `há ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}
