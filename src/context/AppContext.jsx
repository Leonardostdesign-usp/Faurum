import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [appState, setAppState] = useState({
    phase: "loading", // 'loading' | 'before' | 'topic1' | 'topic2' | 'closed'
    activeTopicId: null,
    activeTopic: null,
    nextTransitionAt: null,
    serverTime: null,
  });

  const [user, setUser] = useState(null); // { id, nick, course } | null
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingSuccessCallback, setOnboardingSuccessCallback] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState(null);

  // Busca o estado global no servidor
  const refreshState = useCallback(async () => {
    try {
      const res = await fetch("/api/state");
      if (!res.ok) return;

      const data = await res.json();
      setAppState({
        phase: data.phase,
        activeTopicId: data.activeTopicId,
        activeTopic: data.activeTopic,
        nextTransitionAt: data.nextTransitionAt,
        serverTime: data.serverTime,
      });

      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {
      // Falha silenciosa de rede em estado offline
    }
  }, []);

  // Evento ao carregar e ao voltar o foco para a aba (sem polling)
  useEffect(() => {
    refreshState();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshState();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshState]);

  // Exibição da Snackbar com auto-dismiss
  const showSnackbar = useCallback((message) => {
    setSnackbarMessage(message);
    setTimeout(() => {
      setSnackbarMessage((current) => (current === message ? null : current));
    }, 3500);
  }, []);

  // Abre o modal de primeiro acesso. Aceita callback a ser disparado após cadastro bem-sucedido.
  const requireUser = useCallback((onSuccess) => {
    if (user) {
      if (onSuccess) onSuccess(user);
      return true;
    }
    setOnboardingSuccessCallback(() => onSuccess);
    setIsOnboardingOpen(true);
    return false;
  }, [user]);

  const handleOnboardingSuccess = useCallback((newUser) => {
    setUser(newUser);
    setIsOnboardingOpen(false);
    refreshState();
    showSnackbar("Login realizado.");

    if (onboardingSuccessCallback) {
      const callback = onboardingSuccessCallback;
      setOnboardingSuccessCallback(null);
      // Adia o callback até depois da renderização com `user` já preenchido.
      // Isso evita que um focus() no textarea reabra o modal via requireUser.
      setTimeout(() => callback(newUser), 0);
    }
  }, [onboardingSuccessCallback, refreshState, showSnackbar]);

  return (
    <AppContext.Provider
      value={{
        appState,
        user,
        setUser,
        refreshState,
        showSnackbar,
        snackbarMessage,
        isOnboardingOpen,
        setIsOnboardingOpen,
        requireUser,
        handleOnboardingSuccess,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp deve ser utilizado dentro de um AppProvider.");
  }
  return context;
}
