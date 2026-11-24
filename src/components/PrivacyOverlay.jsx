import React from "react";
import { TYPO } from "../styles/typography";
import { ArrowIcon } from "./ArrowIcon";

export function PrivacyOverlay({ onClose }) {
  return (
    <div className="modal-overlay" style={{ zIndex: 110 }}>
      <div className="modal-dialog" style={{ maxHeight: "88vh" }}>
        <div className="modal-header">
          <h2 className="modal-title">PRIVACIDADE E DADOS</h2>
          <p className="modal-subtitle" style={{ color: "var(--color-gray)" }}>
            Transparência total e temporariedade garantida na intervenção do campus. Como cuidamos do espaço coletivo da FAU e EBA.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", ...TYPO.text2 }}>
          <div>
            <h3 style={{ ...TYPO.text2, marginBottom: "6px", fontWeight: 700 }}>
              Sobre os dados produzidos pelos participantes
            </h3>
            <p style={{ color: "var(--color-black)", marginBottom: "8px" }}>
              Apesar de a plataforma não exigir login nem cadastro formal, a participação não é totalmente anônima. Cada pessoa terá uma espécie de “conta guest”, formada pela associação entre o nick escolhido e três elementos de identificação:
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingBottom: "14px" }}>
            <div style={{ border: "var(--border-thick)", borderRadius: "12px", padding: "16px", backgroundColor: "var(--color-gray-50)", boxShadow: "var(--shadow-card-sm)" }}>
              <strong style={{ display: "block", ...TYPO.text2, marginBottom: "4px", fontWeight: 700 }}>
                Fingerprint do Navegador
              </strong>
              <p style={{ ...TYPO.text2, color: "var(--color-black)" }}>
                Combate a bots repetitivos e automações maliciosas sem recolher documentos pessoais.
              </p>
            </div>

            <div style={{ border: "var(--border-thick)", borderRadius: "12px", padding: "16px", backgroundColor: "var(--color-gray-50)", boxShadow: "var(--shadow-card-sm)" }}>
              <strong style={{ display: "block", ...TYPO.text2, marginBottom: "4px", fontWeight: 700 }}>
                Cookies Essenciais de Sessão
              </strong>
              <p style={{ ...TYPO.text2, color: "var(--color-black)" }}>
                Mantém seu nick e votos na jornada ativa pelo navegador sem necessitar de senha.
              </p>
            </div>

            <div style={{ border: "var(--border-thick)", borderRadius: "12px", padding: "16px", backgroundColor: "var(--color-gray-50)", boxShadow: "var(--shadow-card-sm)" }}>
              <strong style={{ display: "block", ...TYPO.text2, marginBottom: "4px", fontWeight: 700 }}>
                Endereço IP de Rede
              </strong>
              <p style={{ ...TYPO.text2, color: "var(--color-black)" }}>
                Contenção de abuso no pátio acadêmico e integridade do espaço universitário compartilhado.
              </p>
            </div>
          </div>

          <p style={{ color: "var(--color-black)", ...TYPO.text2 }}>
            Isso mantém a capacidade técnica de coibir assédio, vandalismo digital e discurso de ódio, garantindo um ambiente democrático, acolhedor e respeitoso para todos no campus.
          </p>

          <div style={{ paddingTop: "14px" }}>
            <h4 style={{ ...TYPO.text2, marginBottom: "4px", fontWeight: 700 }}>
              E após o fim do projeto?
            </h4>
            <p style={{ ...TYPO.text2, color: "var(--color-black)" }}>
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
          <ArrowIcon direction="left" />
          Retornar
        </button>
      </div>
    </div >
  );
}
