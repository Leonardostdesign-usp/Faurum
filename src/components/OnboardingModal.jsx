import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useFingerprint } from "../hooks/useFingerprint";
import { PrivacyOverlay } from "./PrivacyOverlay";
import { TYPO } from "../styles/typography";

export function OnboardingModal() {
  const { isOnboardingOpen, setIsOnboardingOpen, handleOnboardingSuccess } = useApp();
  const fingerprint = useFingerprint();

  const [nick, setNick] = useState("");
  const [course, setCourse] = useState("design"); // Pré-selecionado conforme o Figma (frame 123:610)
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isPrivacyOverlayOpen, setIsPrivacyOverlayOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOnboardingOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const cleanNick = nick.trim().replace(/^@/, "");

    if (cleanNick.length < 3 || cleanNick.length > 20) {
      setError("O nickname deve ter entre 3 e 20 caracteres.");
      return;
    }

    if (!/^[a-zA-Z0-9_.]+$/.test(cleanNick)) {
      setError("O nickname só pode conter letras, números, '_' e '.'.");
      return;
    }

    if (!privacyAccepted) {
      setError("É obrigatório concordar com o Aviso de Privacidade para entrar.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nick: cleanNick,
          course,
          privacyAccepted,
          fingerprint,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao registrar usuário.");
        return;
      }

      handleOnboardingSuccess(data.user);
    } catch (err) {
      setError("Falha de conexão com o servidor. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-dialog">
          <div className="modal-header">
            <div className="modal-badge">
              <span>👋</span>
              <span>BOAS-VINDAS AO FAURUM</span>
            </div>
            <h2 className="modal-title">Antes de começar...</h2>
            <p className="modal-subtitle">Personalize como você vai aparecer no fórum.</p>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: "var(--color-red-50)",
                border: "1.5px solid var(--color-red)",
                color: "var(--color-red)",
                padding: "10px 14px",
                borderRadius: "10px",
                ...TYPO.subtext,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="form-group">
              <label htmlFor="nick-input" className="form-label">
                Seu Nickname
              </label>
              <div className="input-with-prefix">
                <span className="input-prefix">@</span>
                <input
                  id="nick-input"
                  type="text"
                  className="text-input-field"
                  placeholder="criativo_fau"
                  value={nick}
                  onChange={(e) => setNick(e.target.value.replace(/^@/, "").replace(/\s+/g, ""))}
                  maxLength={20}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Qual é o seu curso?</label>
              <div className="course-options-container">
                <button
                  type="button"
                  className={`btn-course-option ${course === "arquitetura" ? "selected" : ""}`}
                  onClick={() => setCourse("arquitetura")}
                >
                  Arquitetura
                </button>
                <button
                  type="button"
                  className={`btn-course-option ${course === "design" ? "selected" : ""}`}
                  onClick={() => setCourse("design")}
                >
                  Design
                </button>
                <button
                  type="button"
                  className={`btn-course-option ${course === "outro" ? "selected" : ""}`}
                  onClick={() => setCourse("outro")}
                >
                  Outro
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="privacy-checkbox-label">
                <div
                  className={`custom-checkbox ${privacyAccepted ? "checked" : ""}`}
                  onClick={() => setPrivacyAccepted(!privacyAccepted)}
                  role="checkbox"
                  aria-checked={privacyAccepted}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      setPrivacyAccepted(!privacyAccepted);
                    }
                  }}
                >
                  {privacyAccepted && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <span>Estou ciente que, ao prosseguir, concordo com a coleta de dados previsto no </span>
                  <button
                    type="button"
                    style={{ color: "var(--color-interactive)", textDecoration: "underline", ...TYPO.subtext }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPrivacyOverlayOpen(true);
                    }}
                  >
                    Aviso de Privacidade
                  </button>
                  <span> da plataforma.</span>
                </div>
              </label>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setIsOnboardingOpen(false)}
              >
                Voltar
              </button>
              <button
                type="submit"
                className="btn-submit"
                style={{ flex: 2, padding: "14px" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Entrando..." : "Entrar no Fórum →"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {isPrivacyOverlayOpen && (
        <PrivacyOverlay onClose={() => setIsPrivacyOverlayOpen(false)} />
      )}
    </>
  );
}
