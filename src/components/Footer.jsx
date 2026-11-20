import React from "react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-links">
        <Link to="/sobre">Sobre</Link>
        <span>•</span>
        <Link to="/privacidade">Privacidade</Link>
      </div>
      <div className="footer-copy">© 2026 Faurum</div>
    </footer>
  );
}
