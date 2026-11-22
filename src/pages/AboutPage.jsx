import React from "react";
import { Link } from "react-router-dom";
import { TYPO } from "../styles/typography";

export function AboutPage() {
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
        <span style={{ ...TYPO.subtext, color: "var(--color-interactive)", letterSpacing: "1px" }}>
          SOBRE O PROJETO
        </span>
        <h1 style={{ ...TYPO.h3, color: "var(--color-black)" }}>
          Uma breve explicação sobre a natureza e funcionamento do projeto e plataforma.
        </h1>
      </div>

      {/* Manifesto */}
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "var(--border-thick)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-main)",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <h2 style={{ ...TYPO.h3, color: "var(--color-black)" }}>
          De alunos pra alunos
        </h2>
        <p style={{ ...TYPO.text2, color: "var(--color-black)" }}>
          O ambiente da faculdade é diferente no período da manhã, tarde e noite, com pouca interação e pouco conhecimento da realidade do outro. Nesse contexto, o Faurum nasce como forma de conectar estas pessoas por meio de um fórum feito por alunos para alunos da FAU. Projeto desenvolvido na disciplina Cultura Urbana na Contemporaneidade, AUH2820, ministrada em 2026 pela Pofa. Dra. Giselle Beiguelman.
        </p>
      </div>

      {/* Como funciona */}
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "var(--border-thick)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-main)",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <h2 style={{ ...TYPO.h3, color: "var(--color-black)" }}>
          Como funciona
        </h2>

        {/* Step 1 */}
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              backgroundColor: "var(--color-interactive)",
              color: "var(--color-white)",
              borderRadius: "8px",
              border: "var(--border-thin)",
              boxShadow: "var(--shadow-button-active)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...TYPO.text2,
              flexShrink: 0,
            }}
          >
            01
          </div>
          <div>
            <h3 style={{ ...TYPO.text2, marginBottom: "4px" }}>
              Pergunta diária
            </h3>
            <p style={{ ...TYPO.text2, color: "var(--color-gray-500)" }}>
              Tópico norteador que convida à interação aparece.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              backgroundColor: "var(--color-brand)",
              color: "var(--color-white)",
              borderRadius: "8px",
              border: "var(--border-thin)",
              boxShadow: "var(--shadow-button-active)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...TYPO.text2,
              flexShrink: 0,
            }}
          >
            02
          </div>
          <div>
            <h3 style={{ ...TYPO.text2, marginBottom: "4px" }}>
              Interação dos alunos
            </h3>
            <p style={{ ...TYPO.text2, color: "var(--color-gray-500)" }}>
              Os alunos podem interagir com o tópico norteador ou, então, responder aos comentários feitos por outros alunos que já interagiram antes.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              backgroundColor: "var(--color-black)",
              color: "var(--color-white)",
              borderRadius: "8px",
              border: "var(--border-thin)",
              boxShadow: "var(--shadow-button-active)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...TYPO.text2,
              flexShrink: 0,
            }}
          >
            03
          </div>
          <div>
            <h3 style={{ ...TYPO.text2, marginBottom: "4px" }}>
              Repetição
            </h3>
            <p style={{ ...TYPO.text2, color: "var(--color-gray-500)" }}>
              Após um certo período um novo tópico substitui o anterior.
            </p>
          </div>
        </div>
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
