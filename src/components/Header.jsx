import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import faurumLogo from "../assets/faurum_logo_horizontal.svg";

export function Header() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuContainerRef = useRef(null);

  const isForumActive = currentPath === "/" || currentPath.startsWith("/r/");
  const isAboutActive = currentPath === "/sobre";
  const isPrivacyActive = currentPath === "/privacidade";

  useEffect(() => {
    setIsMenuOpen(false);
  }, [currentPath]);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handlePointerDown(event) {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header className="sticky-header">
      <div className="header-inner">
        <Link to="/" className="brand-logo" aria-label="Faurum - Início">
          <img src={faurumLogo} alt="Faurum" className="brand-logo-img" />
        </Link>

        <div className="menu-container" ref={menuContainerRef}>
          <button
            type="button"
            className="menu-toggle"
            aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isMenuOpen}
            aria-controls="header-nav"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>

          {isMenuOpen && (
            <nav id="header-nav" className="nav-menu">
              <Link
                to="/"
                className={`nav-link ${isForumActive ? "active" : ""}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Fórum
              </Link>
              <Link
                to="/sobre"
                className={`nav-link ${isAboutActive ? "active" : ""}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Sobre
              </Link>
              <Link
                to="/privacidade"
                className={`nav-link ${isPrivacyActive ? "active" : ""}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Privacidade
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
