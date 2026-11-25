import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useCountdown } from "../hooks/useCountdown";
import { ReplyCard } from "../components/ReplyCard";
import { EditModal } from "../components/EditModal";
import { DeleteModal } from "../components/DeleteModal";
import { TYPO } from "../styles/typography";
import periodoEncerrado from "../assets/periodo-encerrado.svg";
import { ArrowIcon } from "../components/ArrowIcon";

export function ForumPage() {
  const { appState, user, refreshState, showSnackbar, requireUser } = useApp();
  const replyTextareaRef = useRef(null);

  const [replies, setReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newReplyText, setNewReplyText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [activeTabTopicId, setActiveTabTopicId] = useState(1); // Para a fase 'closed'
  const [editingReply, setEditingReply] = useState(null);
  const [deletingReply, setDeletingReply] = useState(null);

  // Contador da próxima transição
  const countdownText = useCountdown(appState.nextTransitionAt, () => {
    refreshState();
  });

  const currentTopicId =
    appState.phase === "closed" ? activeTabTopicId : appState.activeTopicId;

  // Busca a lista de respostas principais do tópico
  const fetchReplies = useCallback(async () => {
    if (!currentTopicId || appState.phase === "before") {
      setReplies([]);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/replies?topicId=${currentTopicId}`);
      if (!res.ok) {
        if (res.status === 409) refreshState();
        return;
      }
      const data = await res.json();
      setReplies(data.replies || []);
    } catch (err) {
      // offline / falha
    } finally {
      setIsLoading(false);
    }
  }, [currentTopicId, appState.phase, refreshState]);

  useEffect(() => {
    setIsLoading(true);
    fetchReplies();
  }, [fetchReplies]);

  // Ação de Compartilhar
  async function handleShare() {
    const originUrl = window.location.origin;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(originUrl);
      } else {
        const input = document.createElement("input");
        input.value = originUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      showSnackbar("Link de compartilhamento salvo");
    } catch (err) {
      showSnackbar("Link de compartilhamento salvo");
    }
  }

  // Envio de nova resposta ao tópico ativo
  async function handlePostReply(e) {
    e.preventDefault();
    const clean = newReplyText.trim();
    if (!clean) return;

    requireUser(async () => {
      setIsPosting(true);
      try {
        const res = await fetch("/api/replies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicId: appState.activeTopicId,
            body: clean,
          }),
        });

        if (res.status === 409) {
          refreshState();
          return;
        }

        if (!res.ok) {
          const errData = await res.json();
          alert(errData.error || "Erro ao publicar resposta.");
          return;
        }

        const created = await res.json();
        const createdId = created.reply?.id;

        setNewReplyText("");
        await fetchReplies();
        refreshState();
        showSnackbar("Comentário postado.");
        if (createdId) {
          requestAnimationFrame(() => {
            document
              .querySelector(`[data-reply-id="${createdId}"]`)
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
        }
      } catch (err) {
        alert("Erro de conexão ao enviar.");
      } finally {
        setIsPosting(false);
      }
    });
  }

  // Votação
  async function handleVote(replyId, value) {
    try {
      const res = await fetch(`/api/replies/${replyId}/vote`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });

      if (res.status === 409) {
        refreshState();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setReplies((prev) =>
          prev.map((r) => (r.id === replyId ? data.reply : r))
        );
      }
    } catch (err) {
      // falha silenciosa
    }
  }

  // Edição
  async function handleSaveEdit(replyId, newBody) {
    const res = await fetch(`/api/replies/${replyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newBody }),
    });

    if (res.status === 409) {
      refreshState();
      throw new Error("O tópico já foi encerrado.");
    }

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Erro ao editar resposta.");
    }

    const data = await res.json();
    setReplies((prev) =>
      prev.map((r) => (r.id === replyId ? data.reply : r))
    );
  }

  // Exclusão
  async function handleConfirmDelete(replyId) {
    const res = await fetch(`/api/replies/${replyId}`, {
      method: "DELETE",
    });

    if (res.status === 409) {
      refreshState();
      throw new Error("O tópico já foi encerrado.");
    }

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Erro ao apagar resposta.");
    }

    fetchReplies();
  }

  // FASE 1: BEFORE
  if (appState.phase === "before") {
    return (
      <main className="main-content">
        <div className="question-card-container">
          <div className="question-hero" style={{ textAlign: "left", alignItems: "flex-start" }}>
            <h1 className="question-title">A plataforma ainda não está aberta.</h1>
            <p style={{ color: "rgba(255, 255, 255, 0.9)", ...TYPO.text2 }}>
              O Faurum iniciará suas perguntas em breve na TV de entrada da FAUUSP.
            </p>
            {countdownText && (
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  padding: "10px 20px",
                  borderRadius: "100px",
                  color: "#fff",
                  ...TYPO.text2,
                  marginTop: "8px",
                }}
              >
                Início em: {countdownText}
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // FASE 4: CLOSED (Tela Final dos dois tópicos em abas)
  if (appState.phase === "closed") {
    const topic1Title = "Como estava a sua janta ou o seu almoço do bandejão hoje?";
    const topic2Title = "O que você mais inveja do curso do amiguinho de design ou de arquitetura?";

    return (
      <main className="main-content">
        {/* Hero Section de Encerramento (Figma frame 192:151) */}
        <div
          style={{
            backgroundColor: "var(--color-white)",
            border: "var(--border-thick)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-main)",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "24px",

          }}
        >
          <img src={periodoEncerrado} alt="" aria-hidden="true" style={{ width: "56px", height: "auto" }} />
          <div className="modal-intro">
            <h1 style={{ ...TYPO.h3, color: "var(--color-black)", }}>
              Período de respostas encerrado
            </h1>
            <p style={{ ...TYPO.text2, color: "var(--color-gray-500)" }}>
              Porém, você ainda pode ver as respostas do pessoal logo abaixo!
            </p>
          </div>
        </div>

        {/* Abas para alternar entre Tópico 1 e Tópico 2 */}
        <div className="tabs-container">
          <button
            type="button"
            className={`tab-btn ${activeTabTopicId === 1 ? "active" : ""}`}
            onClick={() => setActiveTabTopicId(1)}
          >
            Pergunta do dia 1
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTabTopicId === 2 ? "active" : ""}`}
            onClick={() => setActiveTabTopicId(2)}
          >
            Pergunta do dia 2
          </button>
        </div>

        {/* Card do Tópico Selecionado */}
        <div className="question-card-container">
          <div className="question-hero">
            <div className="question-watermark">?</div>
            <h2 className="question-title">
              {activeTabTopicId === 1 ? topic1Title : topic2Title}
            </h2>
            <button type="button" className="btn-share" onClick={handleShare}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              <span>Compartilhar</span>
            </button>
          </div>
        </div>

        {/* Feed em Modo Somente Leitura */}
        <section className="feed-container">
          <div className="feed-header-bar">
            <span className="feed-count-text">
              {replies.length} {replies.length === 1 ? "comentário" : "comentários"}
            </span>
          </div>

          {isLoading ? (
            <div className="loading-box">
              <div className="loading-spinner" />
              <span>Carregando respostas arquivadas...</span>
            </div>
          ) : replies.length === 0 ? (
            <div className="empty-state-box">
              <h3 className="empty-state-title">Nenhum comentário arquivado</h3>
              <p className="empty-state-desc">Este tópico não recebeu respostas durante sua vigência.</p>
            </div>
          ) : (
            replies.map((reply) => (
              <ReplyCard
                key={reply.id}
                reply={reply}
                isReadOnly={true}
              />
            ))
          )}
        </section>
      </main>
    );
  }

  // FASES ATIVAS: TOPIC 1 e TOPIC 2
  return (
    <main className="main-content">
      {/* Question Card Principal (Roxo) */}
      <div className="question-card-container">
        <div className="question-hero">
          <div className="question-watermark">?</div>

          <div className="question-pill">
            <span>{appState.activeTopic?.label || `Pergunta do dia ${appState.activeTopicId}`}</span>
            <span className="question-pill-dot" />
            <span>{countdownText || "Calculando..."}</span>
          </div>

          <h1 className="question-title">
            {appState.activeTopic?.title}
          </h1>

          <button type="button" className="btn-share" onClick={handleShare}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            <span>Compartilhar</span>
          </button>
        </div>

        {/* Card de Envio de Resposta */}
        <div className="submission-card">
          <form onSubmit={handlePostReply} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="textarea-container">
              <textarea
                ref={replyTextareaRef}
                className="textarea-input"
                placeholder="Escreva sua resposta sincera ou reflexão..."
                value={newReplyText}
                onChange={(e) => setNewReplyText(e.target.value)}
                onFocus={() => {
                  if (!user) {
                    replyTextareaRef.current?.blur();
                    requireUser(() => replyTextareaRef.current?.focus());
                  }
                }}
                maxLength={500}
                required
              />
            </div>

            <div className="submission-footer">
              <div className="submission-meta">
                <div className={`char-counter ${newReplyText.length >= 500 ? "limit" : ""}`}>
                  {newReplyText.length}/500<span className="char-counter-label"> caracteres</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn-submit"
                disabled={isPosting || !newReplyText.trim()}
              >
                {isPosting ? "Postando..." : <>Postar<ArrowIcon direction="right" /></>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Feed de Comentários */}
      <section className="feed-container">
        <div className="feed-header-bar">
          <span className="feed-count-text">
            {replies.length} {replies.length === 1 ? "comentário" : "comentários"}
          </span>
        </div>

        {isLoading ? (
          <div className="loading-box">
            <div className="loading-spinner" />
            <span>Carregando respostas da comunidade...</span>
          </div>
        ) : replies.length === 0 ? (
          <div className="empty-state-box">
            <h3 className="empty-state-title" >Ainda não há respostas</h3>
            <p className="empty-state-desc">
              Seja a primeira pessoa a deixar sua impressão sincera sobre a pergunta do dia!
            </p>
          </div>
        ) : (
          replies.map((reply) => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              onVote={handleVote}
              onEditRequest={setEditingReply}
              onDeleteRequest={setDeletingReply}
            />
          ))
        )}
      </section>

      {/* Modais de Edição e Exclusão */}
      {editingReply && (
        <EditModal
          reply={editingReply}
          onClose={() => setEditingReply(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deletingReply && (
        <DeleteModal
          reply={deletingReply}
          onClose={() => setDeletingReply(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </main>
  );
}
