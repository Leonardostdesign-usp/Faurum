import React from "react";

export function PrivacyOverlay({ onClose }) {
  return (
    <div className="modal-overlay" style={{ zIndex: 110 }}>
      <div className="modal-dialog" style={{ maxHeight: "88vh" }}>
        <div className="modal-header">
          <div className="modal-badge">
            <span>🔒</span>
            <span>PRIVACIDADE & DADOS</span>
          </div>
          <h2 className="modal-title">Transparência total e temporariedade</h2>
          <p className="modal-subtitle">
            Como cuidamos do espaço coletivo da FAU e EBA durante a intervenção do campus.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "15px", lineHeight: "1.5" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "6px" }}>
              Sobre os dados produzidos pelos participantes
            </h3>
            <p style={{ color: "var(--color-gray-500)", marginBottom: "8px" }}>
              Apesar de a plataforma não exigir login nem cadastro formal, a participação não é totalmente anônima. Cada pessoa terá uma espécie de “conta guest”, formada pela associação entre o nick escolhido e três elementos de identificação:
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ border: "var(--border-thin)", borderRadius: "12px", padding: "14px", backgroundColor: "var(--color-gray-50)" }}>
              <strong style={{ display: "block", fontSize: "15px", marginBottom: "4px" }}>
                1. Fingerprint do Navegador
              </strong>
              <p style={{ fontSize: "14px", color: "var(--color-gray-500)" }}>
                Combate a bots repetitivos e automações maliciosas sem recolher documentos pessoais.
              </p>
            </div>

            <div style={{ border: "var(--border-thin)", borderRadius: "12px", padding: "14px", backgroundColor: "var(--color-gray-50)" }}>
              <strong style={{ display: "block", fontSize: "15px", marginBottom: "4px" }}>
                2. Cookies Essenciais de Sessão
              </strong>
              <p style={{ fontSize: "14px", color: "var(--color-gray-500)" }}>
                Mantém seu nick e votos na jornada ativa pelo navegador sem necessitar de senha.
              </p>
            </div>

            <div style={{ border: "var(--border-thin)", borderRadius: "12px", padding: "14px", backgroundColor: "var(--color-gray-50)" }}>
              <strong style={{ display: "block", fontSize: "15px", marginBottom: "4px" }}>
                3. Endereço IP de Rede
              </strong>
              <p style={{ fontSize: "14px", color: "var(--color-gray-500)" }}>
                Contenção de abuso no pátio acadêmico e integridade do espaço universitário compartilhado.
              </p>
            </div>
          </div>

          <p style={{ color: "var(--color-gray-500)", fontSize: "14px" }}>
            Isso mantém a capacidade técnica de coibir assédio, vandalismo digital e discurso de ódio, garantindo um ambiente democrático, acolhedor e respeitoso para todos no campus.
          </p>

          <div style={{ borderTop: "var(--border-thin)", paddingTop: "14px" }}>
            <h4 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "4px" }}>
              E após o fim do projeto?
            </h4>
            <p style={{ fontSize: "14px", color: "var(--color-gray-500)" }}>
              No fim do tempo de exibição do projeto, o banco de dados será completamente deletado e todas as informações serão destruídas.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-submit"
          onClick={onClose}
          style={{ width: "100%", padding: "14px" }}
        >
          ← Retornar ao cadastro
        </button>
      </div>
    </div>
  );
}
