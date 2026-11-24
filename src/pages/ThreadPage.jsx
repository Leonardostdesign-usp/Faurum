import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { ReplyCard } from "../components/ReplyCard";
import { EditModal } from "../components/EditModal";
import { DeleteModal } from "../components/DeleteModal";
import { PrivacyOverlay } from "../components/PrivacyOverlay";
import { TYPO } from "../styles/typography";
import { ArrowIcon } from "../components/ArrowIcon";

export function ThreadPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { appState, user, refreshState, showSnackbar, requireUser } = useApp();
  const replyTextareaRef = useRef(null);

  const [data, setData] = useState(null); // { reply, ancestors, replies }
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newReplyText, setNewReplyText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [editingReply, setEditingReply] = useState(null);
  const [deletingReply, setDeletingReply] = useState(null);
  const [isPrivacyOverlayOpen, setIsPrivacyOverlayOpen] = useState(false);

  const isReadOnly = appState.phase === "closed";

  const fetchThread = useCallback(async () => {
    try {
      const res = await fetch(`/api/replies/${id}`);
      if (res.status === 404) {
        setError("Comentário não encontrado ou não disponível nesta fase.");
        return;
      }
      if (!res.ok) {
        if (res.status === 409) refreshState();
        setError("Erro ao carregar comentário.");
        return;
      }

      const resData = await res.json();
      setData(resData);
    } catch (err) {
      setError("Falha de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  }, [id, refreshState]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchThread();
  }, [fetchThread]);

  async function handlePostChildReply(e) {
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
            topicId: data.reply.topicId,
            parentId: data.reply.id,
            body: clean,
          }),
        });

        if (res.status === 409) {
          refreshState();
          return;
        }

        if (!res.ok) {
          const errData = await res.json();
          alert(errData.error || "Erro ao responder.");
          return;
        }

        const created = await res.json();
        const createdId = created.reply?.id;

        setNewReplyText("");
        await fetchThread();
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
        const resJson = await res.json();
        // Atualiza tanto a resposta principal quanto as filhas/ancestrais
        setData((prev) => {
          if (!prev) return prev;
          const updatedReply = prev.reply.id === replyId ? resJson.reply : prev.reply;
          const updatedAncestors = prev.ancestors.map((a) =>
            a.id === replyId ? resJson.reply : a
          );
          const updatedChildren = prev.replies.map((c) =>
            c.id === replyId ? resJson.reply : c
          );
          return {
            ...prev,
            reply: updatedReply,
            ancestors: updatedAncestors,
            replies: updatedChildren,
          };
        });
      }
    } catch (err) {
      // falha silenciosa
    }
  }

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
      const resJson = await res.json();
      throw new Error(resJson.error || "Erro ao editar resposta.");
    }

    const resJson = await res.json();
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        reply: prev.reply.id === replyId ? resJson.reply : prev.reply,
        ancestors: prev.ancestors.map((a) => (a.id === replyId ? resJson.reply : a)),
        replies: prev.replies.map((c) => (c.id === replyId ? resJson.reply : c)),
      };
    });
  }

  async function handleConfirmDelete(replyId) {
    const res = await fetch(`/api/replies/${replyId}`, {
      method: "DELETE",
    });

    if (res.status === 409) {
      refreshState();
      throw new Error("O tópico já foi encerrado.");
    }

    if (!res.ok) {
      const resJson = await res.json();
      throw new Error(resJson.error || "Erro ao apagar resposta.");
    }

    fetchThread();
  }

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }

  if (isLoading) {
    return (
      <main className="main-content">
        <div className="loading-box">
          <div className="loading-spinner" />
          <span>Carregando discussão...</span>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="main-content">
        <button
          type="button"
          onClick={handleBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            ...TYPO.text2,
            color: "var(--color-black)",
            padding: "8px 0",
          }}
        >
          <ArrowIcon direction="left" />
          Voltar ao Fórum
        </button>

        <div className="empty-state-box">
          <h3 className="empty-state-title">Discussão indisponível</h3>
          <p className="empty-state-desc">{error || "Não foi possível carregar este comentário."}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content">
      {/* Botão Voltar (Figma frame 123:286) */}
      <button
        type="button"
        className="btn-back-pill"
        onClick={handleBack}
        style={{ width: "fit-content" }}
      >
        <ArrowIcon direction="left" />
        Voltar ao Fórum
      </button>

      {/* Cadeia de Ancestrais (Se for resposta a outro comentário) */}
      {data.ancestors && data.ancestors.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "-10px" }}>
          <span style={{ ...TYPO.subtext, color: "var(--color-gray-500)", textTransform: "uppercase" }}>
            Discussão anterior
          </span>
          <div style={{ borderLeft: "3px solid var(--color-gray-100)", paddingLeft: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {data.ancestors.map((anc) => (
              <ReplyCard
                key={anc.id}
                reply={anc}
                onVote={handleVote}
                onEditRequest={setEditingReply}
                onDeleteRequest={setDeletingReply}
                isReadOnly={isReadOnly}
              />
            ))}
          </div>
        </div>
      )}

      {/* Comentário em Destaque */}
      <div className="feed-container">
        <div className="feed-header-bar">
          <span className="feed-count-text">Comentário em visualização</span>
        </div>

        <ReplyCard
          reply={data.reply}
          onVote={handleVote}
          onEditRequest={setEditingReply}
          onDeleteRequest={setDeletingReply}
          isReadOnly={isReadOnly}
          showRepliesButton={false}
        />

        {/* Campo de Resposta Direta a Este Comentário */}
        {!isReadOnly && !data.reply.isDeleted && (
          <div style={{ padding: "20px 24px", borderTop: "var(--border-thick)", backgroundColor: "var(--color-gray-50)" }}>
            <form onSubmit={handlePostChildReply} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="textarea-container">
                <textarea
                  ref={replyTextareaRef}
                  className="textarea-input"
                  style={{ minHeight: "85px" }}
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
                  <button
                    type="button"
                    className="privacy-link"
                    onClick={() => setIsPrivacyOverlayOpen(true)}
                  >
                    Ver termos de privacidade
                  </button>
                </div>

                <button
                  type="submit"
                  className="btn-submit"
                  style={{ padding: "10px 24px" }}
                  disabled={isPosting || !newReplyText.trim()}
                >
                  {isPosting ? "Enviando..." : <>Responder<ArrowIcon direction="right" /></>}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Lista de Respostas Diretas */}
      <section className="feed-container">
        <div className="feed-header-bar">
          <span className="feed-count-text">
            {data.replies.length} {data.replies.length === 1 ? "resposta" : "respostas"}
          </span>
        </div>

        {data.replies.length === 0 ? (
          <div className="empty-state-box">
            <h3 className="empty-state-title">Nenhuma resposta ainda</h3>
            <p className="empty-state-desc">
              Participe da conversa respondendo a este comentário acima!
            </p>
          </div>
        ) : (
          data.replies.map((childReply) => (
            <ReplyCard
              key={childReply.id}
              reply={childReply}
              onVote={handleVote}
              onEditRequest={setEditingReply}
              onDeleteRequest={setDeletingReply}
              isReadOnly={isReadOnly}
            />
          ))
        )}
      </section>

      {/* Modais */}
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

      {isPrivacyOverlayOpen && (
        <PrivacyOverlay onClose={() => setIsPrivacyOverlayOpen(false)} />
      )}
    </main>
  );
}
