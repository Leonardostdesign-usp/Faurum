import React from "react";
import { Link } from "react-router-dom";

export function PrivacyPage() {
  return (
    <main className="main-content">
      {/* Hero Card */}
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "var(--border-thick)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-main)",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-interactive)", letterSpacing: "1px" }}>
          PRIVACIDADE & DADOS
        </span>
        <h1 style={{ fontSize: "26px", fontWeight: "800", color: "var(--color-black)", lineHeight: "1.2" }}>
          Transparência total e temporariedade garantida na intervenção do campus. Como cuidamos do espaço coletivo da FAU e EBA.
        </h1>
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
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "var(--color-black)", marginBottom: "8px" }}>
            Sobre os dados produzidos pelos participantes
          </h2>
          <p style={{ fontSize: "16px", lineHeight: "1.5", color: "var(--color-black)" }}>
            Apesar de a plataforma não exigir login nem cadastro formal, a participação não é totalmente anônima. Cada pessoa terá uma espécie de “conta guest”, formada pela associação entre o nick escolhido e três elementos de identificação:
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ border: "var(--border-thin)", borderRadius: "14px", padding: "18px", backgroundColor: "var(--color-gray-50)" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "var(--color-black)", marginBottom: "6px" }}>
              Fingerprint do Navegador
            </h3>
            <p style={{ fontSize: "15px", color: "var(--color-gray-500)", lineHeight: "1.5" }}>
              Combate a bots repetitivos e automações maliciosas sem recolher documentos pessoais.
            </p>
          </div>

          <div style={{ border: "var(--border-thin)", borderRadius: "14px", padding: "18px", backgroundColor: "var(--color-gray-50)" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "var(--color-black)", marginBottom: "6px" }}>
              Cookies Essenciais de Sessão
            </h3>
            <p style={{ fontSize: "15px", color: "var(--color-gray-500)", lineHeight: "1.5" }}>
              Mantém seu nick e votos na jornada ativa pelo navegador sem necessitar de senha.
            </p>
          </div>

          <div style={{ border: "var(--border-thin)", borderRadius: "14px", padding: "18px", backgroundColor: "var(--color-gray-50)" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "var(--color-black)", marginBottom: "6px" }}>
              Endereço IP de Rede
            </h3>
            <p style={{ fontSize: "15px", color: "var(--color-gray-500)", lineHeight: "1.5" }}>
              Contenção de abuso no pátio acadêmico e integridade do espaço universitário compartilhado.
            </p>
          </div>
        </div>

        <p style={{ fontSize: "15px", lineHeight: "1.5", color: "var(--color-gray-500)" }}>
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
        <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--color-black)" }}>
          E após o fim do projeto?
        </h2>
        <p style={{ fontSize: "16px", lineHeight: "1.5", color: "var(--color-black)" }}>
          No fim do tempo de exibição do projeto, o banco de dados será completamente deletado e todas as informações serão destruídas.
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
        <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--color-black)" }}>
          Contato
        </h2>
        <p style={{ fontSize: "16px", lineHeight: "1.5", color: "var(--color-black)" }}>
          Qualquer dúvida, mande mensagem para o email:{" "}
          <a
            href="mailto:leonardostdesign@usp.br"
            style={{ color: "var(--color-interactive)", textDecoration: "underline", fontWeight: "600" }}
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
        Ir para pergunta do dia →
      </Link>
    </main>
  );
}
