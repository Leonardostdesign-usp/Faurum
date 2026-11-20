import React from "react";
import { Link, useLocation } from "react-router-dom";

export function Header() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isForumActive = currentPath === "/" || currentPath.startsWith("/r/");
  const isAboutActive = currentPath === "/sobre";
  const isPrivacyActive = currentPath === "/privacidade";

  return (
    <header className="sticky-header">
      <div className="header-inner">
        <Link to="/" className="brand-mark" title="Faurum - Início">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </Link>

        <nav className="nav-links">
          <Link to="/" className={`nav-link ${isForumActive ? "active" : ""}`}>
            Fórum
          </Link>
          <Link to="/sobre" className={`nav-link ${isAboutActive ? "active" : ""}`}>
            Sobre
          </Link>
          <Link to="/privacidade" className={`nav-link ${isPrivacyActive ? "active" : ""}`}>
            Privacidade
          </Link>
        </nav>
      </div>
    </header>
  );
}
