import { TYPO } from "../styles/typography";
import React, { useState } from "react";

export function DeleteModal({ reply, onClose, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!reply) return null;

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm(reply.id);
      onClose();
    } catch (err) {
      setError(err.message || "Erro ao remover comentário.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-header">
          <h2 className="modal-title">Deletar comentário?</h2>
          <p className="modal-subtitle">Tem certeza que deseja remover seu comentário?</p>
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

        <div className="modal-actions">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-modal-danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Removendo..." : "Remover comentário"}
          </button>
        </div>
      </div>
    </div>
  );
}
