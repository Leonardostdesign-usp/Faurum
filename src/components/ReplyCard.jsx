import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export function ReplyCard({
  reply,
  onVote,
  onEditRequest,
  onDeleteRequest,
  isReadOnly = false,
  showRepliesButton = true,
}) {
  const navigate = useNavigate();
  const { requireUser } = useApp();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(!reply.isCollapsed);

  // Iniciais do autor para o avatar
  const authorInitials = (reply.author?.nick || "??")
    .replace(/^@/, "")
    .slice(0, 2)
    .toUpperCase();

  const courseLabel = {
    arquitetura: "Arquitetura",
    design: "Design",
    outro: "Outro",
  }[reply.author?.course] || "Outro";

  function handleVoteClick(val) {
    if (isReadOnly || reply.isDeleted) return;

    requireUser(() => {
      const nextVote = reply.userVote === val ? 0 : val;
      if (onVote) {
        onVote(reply.id, nextVote);
      }
    });
  }

  function handleRepliesClick() {
    navigate(`/r/${reply.id}`);
  }

  // Estado colapsado (accordion) quando pontuação é menor que -3
  if (reply.isCollapsed && !isAccordionOpen) {
    return (
      <div
        className="collapsed-card"
        onClick={() => setIsAccordionOpen(true)}
        role="button"
        tabIndex={0}
        title="Clique para visualizar o comentário"
      >
        <div className="collapsed-info">
          <span className="author-nick">@{reply.author?.nick}</span>
          <span className={`course-tag ${reply.author?.course || "outro"}`}>
            {courseLabel}
          </span>
          <span>{reply.relativeTime}</span>
        </div>
        <div className="collapsed-expand-btn">
          <span>Ver comentário recolhido</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <article className="feed-card" data-reply-id={reply.id}>
      <div className="feed-card-header">
        <div className="author-info">
          <div className="author-avatar">{authorInitials}</div>
          <div className="author-meta">
            <span className="author-nick">@{reply.author?.nick}</span>
            <span className="author-time">{reply.relativeTime}</span>
          </div>
        </div>

        <div className="header-actions">
          <span className={`course-tag ${reply.author?.course || "outro"}`}>
            {courseLabel}
          </span>

          {reply.isOwner && !isReadOnly && !reply.isDeleted && (
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="btn-options"
                aria-label="Opções da publicação"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>

              {isMenuOpen && (
                <>
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 30 }}
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="options-dropdown">
                    <button
                      type="button"
                      className="options-item"
                      onClick={() => {
                        setIsMenuOpen(false);
                        if (onEditRequest) onEditRequest(reply);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      className="options-item delete"
                      onClick={() => {
                        setIsMenuOpen(false);
                        if (onDeleteRequest) onDeleteRequest(reply);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      <span>Remover publicação</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {reply.isCollapsed && (
            <button
              type="button"
              className="btn-options"
              title="Recolher comentário"
              onClick={() => setIsAccordionOpen(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className={`feed-card-body ${reply.isDeleted ? "deleted" : ""}`}>
        {reply.body}
        {reply.isEdited && <span className="edited-badge">(editado)</span>}
      </div>

      {!isReadOnly && (
        <div className="feed-card-actions">
          <div className="vote-controls">
            <button
              type="button"
              className={`btn-vote ${reply.userVote === 1 ? "active-up" : ""}`}
              onClick={() => handleVoteClick(1)}
              disabled={reply.isDeleted}
              aria-label="Votar positivamente"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-8 8h5v8h6v-8h5z" />
              </svg>
              <span>{reply.upvotes}</span>
            </button>

            <button
              type="button"
              className={`btn-vote ${reply.userVote === -1 ? "active-down" : ""}`}
              onClick={() => handleVoteClick(-1)}
              disabled={reply.isDeleted}
              aria-label="Votar negativamente"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 20l8-8h-5V4H9v8H4z" />
              </svg>
              <span>{reply.downvotes}</span>
            </button>
          </div>

          {showRepliesButton && (
            <button
              type="button"
              className="btn-replies-count"
              onClick={handleRepliesClick}
              aria-label={`Ver ${reply.repliesCount} respostas`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>
                {reply.repliesCount} {reply.repliesCount === 1 ? "resposta" : "respostas"}
              </span>
            </button>
          )}
        </div>
      )}
    </article>
  );
}
