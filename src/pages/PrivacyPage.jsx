import React from "react";
import { Link } from "react-router-dom";
import { TYPO } from "../styles/typography";
import { ArrowIcon } from "../components/ArrowIcon";

export function PrivacyPage() {
  return (
    <main className="main-content">
      {/* Hero Card */}
      <div
        style={{
          backgroundColor: "var(--color-brand)",
          border: "var(--border-thick)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-main)",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <h1 style={{ ...TYPO.h3, color: "var(--color-white)" }}>
          PRIVACIDADE E DADOS
        </h1>
        <p style={{ ...TYPO.text2, color: "var(--color-white)" }}>
          Transparência total e temporariedade garantida na intervenção do campus. Como cuidamos do espaço coletivo da FAU e EBA.
        </p>
      </div>

      {/* Card 1: Sobre os dados */}
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "var(--border-thick)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-main)",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div>
          <h2 style={{ ...TYPO.text1, color: "var(--color-black)", fontWeight: 700, marginBottom: "8px" }}>
            Sobre os dados produzidos pelos participantes
          </h2>
          <p style={{ ...TYPO.text2, color: "var(--color-black)" }}>
            Apesar de a plataforma não exigir login nem cadastro formal, a participação não é totalmente anônima. Cada pessoa terá uma espécie de “conta guest”, formada pela associação entre o nick escolhido e três elementos de identificação:
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "4px" }}>
          <div style={{ border: "var(--border-thick)", borderRadius: "14px", padding: "18px", backgroundColor: "var(--color-gray-50)", boxShadow: "var(--shadow-card-sm)" }}>
            <h3 style={{ ...TYPO.text2, color: "var(--color-black)", fontWeight: 700, marginBottom: "6px" }}>
              Fingerprint do Navegador
            </h3>
            <p style={{ ...TYPO.text2, color: "var(--color-black)" }}>
              Combate a bots repetitivos e automações maliciosas sem recolher documentos pessoais.
            </p>
          </div>

          <div style={{ border: "var(--border-thick)", borderRadius: "14px", padding: "18px", backgroundColor: "var(--color-gray-50)", boxShadow: "var(--shadow-card-sm)" }}>
            <h3 style={{ ...TYPO.text2, color: "var(--color-black)", fontWeight: 700, marginBottom: "6px" }}>
              Cookies Essenciais de Sessão
            </h3>
            <p style={{ ...TYPO.text2, color: "var(--color-black)" }}>
              Mantém seu nick e votos na jornada ativa pelo navegador sem necessitar de senha.
            </p>
          </div>

          <div style={{ border: "var(--border-thick)", borderRadius: "14px", padding: "18px", backgroundColor: "var(--color-gray-50)", boxShadow: "var(--shadow-card-sm)" }}>
            <h3 style={{ ...TYPO.text2, color: "var(--color-black)", fontWeight: 700, marginBottom: "6px" }}>
              Endereço IP de Rede
            </h3>
            <p style={{ ...TYPO.text2, color: "var(--color-black)" }}>
              Contenção de abuso no pátio acadêmico e integridade do espaço universitário compartilhado.
            </p>
          </div>
        </div>

        <p style={{ ...TYPO.text2, color: "var(--color-black)" }}>
          Isso mantém a capacidade técnica de coibir assédio, vandalismo digital e discurso de ódio, garantindo um ambiente democrático, acolhedor e respeitoso para todos no campus.
        </p>
      </div>

      {/* Card 2: Fim do projeto */}
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "var(--border-thick)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-main)",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <h2 style={{ ...TYPO.text1, color: "var(--color-black)", fontWeight: 700 }}>
          E após o fim do projeto?
        </h2>
        <p style={{ ...TYPO.text2, color: "var(--color-black)" }}>
          No fim do tempo de exibição do projeto, haverá um período de exibição das respostas de ambos os tópicos durante dois ou três dias. Após isso, o banco de dados será completamente deletado e todas as informações serão destruídas.
        </p>
      </div>

      {/* Card 3: Contato (Figma frame 196:261) */}
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "var(--border-thick)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-main)",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <h2 style={{ ...TYPO.text1, color: "var(--color-black)", fontWeight: 700 }}>
          Contato
        </h2>
        <p style={{ ...TYPO.text2, color: "var(--color-black)" }}>
          Qualquer dúvida, mande mensagem para o email:{" "}
          <a
            href="mailto:leonardostdesign@usp.br"
            style={{ color: "var(--color-interactive)", textDecoration: "underline", }}
          >
            leonardostdesign@usp.br
          </a>
        </p>
      </div>

      <Link
        to="/"
        className="btn-submit"
        style={{ width: "100%", padding: "18px", textAlign: "center", textDecoration: "none" }}
      >
        Ir para pergunta do dia
        <ArrowIcon direction="right" />
      </Link>
    </main>
  );
}
