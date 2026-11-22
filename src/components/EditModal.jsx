import { TYPO } from "../styles/typography";
import React, { useState } from "react";

export function EditModal({ reply, onClose, onSave }) {
  const [text, setText] = useState(reply?.body || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!reply) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) {
      setError("O comentário não pode ser vazio.");
      return;
    }
    if (clean.length > 500) {
      setError("O comentário excede 500 caracteres.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave(reply.id, clean);
      onClose();
    } catch (err) {
      setError(err.message || "Erro ao editar comentário.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-header">
          <h2 className="modal-title">Editar comentário</h2>
          <p className="modal-subtitle">Atualize sua resposta mantendo a clareza e respeito.</p>
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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="textarea-container">
            <textarea
              className="textarea-input"
              style={{ minHeight: "150px" }}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              required
            />
            <div className={`char-counter ${text.length >= 500 ? "limit" : ""}`}>
              {text.length}/500 caracteres
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="submit"
              className="btn-submit"
              style={{ flex: 2, padding: "14px" }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Editar comentário"}
            </button>
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
