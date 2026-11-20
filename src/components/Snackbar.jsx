import React from "react";
import { useApp } from "../context/AppContext";

export function Snackbar() {
  const { snackbarMessage } = useApp();

  if (!snackbarMessage) return null;

  return (
    <div className="snackbar-container" role="status" aria-live="polite">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      <span>{snackbarMessage}</span>
    </div>
  );
}
