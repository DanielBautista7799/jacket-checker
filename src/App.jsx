import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ProfileProvider } from "./context/ProfileContext";
import { AnalyticsProvider } from "./context/AnalyticsContext";
import { NetworkStatusProvider } from "./context/NetworkStatusContext";
import { RecommendationLearningProvider } from "./context/RecommendationLearningContext";
import { StyleTrendProvider } from "./context/StyleTrendContext";
import { WardrobeProvider } from "./context/WardrobeContext";
import { WeatherProvider } from "./context/WeatherContext";

import AppHeader from "./components/AppHeader";
import OfflineBanner from "./components/OfflineBanner";
import ProtectedRoute from "./components/ProtectedRoute";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import AppErrorBoundary from "./components/ui/AppErrorBoundary";
import LoadingState from "./components/ui/LoadingState";
import RouteAnnouncer from "./components/ui/RouteAnnouncer";

const GuestPage = lazy(() => import("./pages/GuestPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PersonalizedPage = lazy(() => import("./pages/PersonalizedPage"));
const WardrobePage = lazy(() => import("./pages/WardrobePage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const DeveloperScoringPage = lazy(() => import("./pages/DeveloperScoringPage"));
const DeveloperTrendsPage = lazy(() => import("./pages/DeveloperTrendsPage"));
const DeveloperAnalyticsPage = lazy(() => import("./pages/DeveloperAnalyticsPage"));

const developerScoringEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_SCORING === "true";
const developerTrendsEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_TRENDS === "true";
const developerAnalyticsEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_ANALYTICS === "true";

function PageFallback() {
  return <LoadingState label="Loading page" rows={4} />;
}

function ProtectedPage({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function SafeRoute({ children }) {
  return <RouteErrorBoundary>{children}</RouteErrorBoundary>;
}

function AppShell() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <OfflineBanner />
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <RouteAnnouncer />

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-1/3 left-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <AppHeader />
        <main
          id="main-content"
          tabIndex={-1}
          className="page-enter rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur-xl focus:outline-none sm:rounded-[2rem] sm:p-6 lg:p-8"
        >
          <AppErrorBoundary>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<SafeRoute><GuestPage /></SafeRoute>} />
                <Route path="/auth" element={<SafeRoute><AuthPage /></SafeRoute>} />
                <Route path="/profile" element={<ProtectedPage><SafeRoute><ProfilePage /></SafeRoute></ProtectedPage>} />
                <Route path="/wardrobe" element={<ProtectedPage><SafeRoute><WardrobePage /></SafeRoute></ProtectedPage>} />
                <Route path="/closet" element={<Navigate to="/wardrobe" replace />} />
                <Route path="/history" element={<ProtectedPage><SafeRoute><HistoryPage /></SafeRoute></ProtectedPage>} />
                <Route path="/app" element={<ProtectedPage><SafeRoute><PersonalizedPage /></SafeRoute></ProtectedPage>} />
                <Route
                  path="/dev/scoring"
                  element={developerScoringEnabled ? <ProtectedPage><SafeRoute><DeveloperScoringPage /></SafeRoute></ProtectedPage> : <Navigate to="/" replace />}
                />
                <Route
                  path="/dev/trends"
                  element={developerTrendsEnabled ? <ProtectedPage><SafeRoute><DeveloperTrendsPage /></SafeRoute></ProtectedPage> : <Navigate to="/" replace />}
                />
                <Route
                  path="/dev/analytics"
                  element={developerAnalyticsEnabled ? <ProtectedPage><SafeRoute><DeveloperAnalyticsPage /></SafeRoute></ProtectedPage> : <Navigate to="/" replace />}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AppErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <NetworkStatusProvider>
        <AuthProvider>
          <ProfileProvider>
            <AnalyticsProvider>
              <WeatherProvider>
                <StyleTrendProvider>
                  <WardrobeProvider>
                    <RecommendationLearningProvider>
                      <AppShell />
                    </RecommendationLearningProvider>
                  </WardrobeProvider>
                </StyleTrendProvider>
              </WeatherProvider>
            </AnalyticsProvider>
          </ProfileProvider>
        </AuthProvider>
      </NetworkStatusProvider>
    </BrowserRouter>
  );
}
