import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Snackbar } from "./components/Snackbar";
import { OnboardingModal } from "./components/OnboardingModal";
import { ForumPage } from "./pages/ForumPage";
import { ThreadPage } from "./pages/ThreadPage";
import { AboutPage } from "./pages/AboutPage";
import { PrivacyPage } from "./pages/PrivacyPage";

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-viewport">
          <div className="app-container">
            <Header />

            <Routes>
              <Route path="/" element={<ForumPage />} />
              <Route path="/r/:id" element={<ThreadPage />} />
              <Route path="/sobre" element={<AboutPage />} />
              <Route path="/privacidade" element={<PrivacyPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <Footer />
            <Snackbar />
            <OnboardingModal />
          </div>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
