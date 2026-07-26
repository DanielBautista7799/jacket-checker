import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
} from "react-router";

import AppHeader from "./components/AppHeader";
import DeveloperRoute from "./components/DeveloperRoute";
import NativeAuthHandler from "./components/NativeAuthHandler";
import OfflineBanner from "./components/OfflineBanner";
import ProtectedRoute from "./components/ProtectedRoute";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import ThemeToggle from "./components/ThemeToggle";
import AppErrorBoundary from "./components/ui/AppErrorBoundary";
import LoadingState from "./components/ui/LoadingState";
import RouteAnnouncer from "./components/ui/RouteAnnouncer";
import { AnalyticsProvider } from "./context/AnalyticsContext";
import { AuthProvider } from "./context/AuthContext";
import { DeveloperAccessProvider } from "./context/DeveloperAccessContext";
import { NetworkStatusProvider } from "./context/NetworkStatusContext";
import { ProfileProvider } from "./context/ProfileContext";
import { RecommendationLearningProvider } from "./context/RecommendationLearningContext";
import { StyleTrendProvider } from "./context/StyleTrendContext";
import { ThemeProvider } from "./context/ThemeContext";
import { WardrobeProvider } from "./context/WardrobeContext";
import { WeatherProvider } from "./context/WeatherContext";
import useAuth from "./hooks/useAuth";
import ResetPasswordPage from "./pages/ResetPasswordPage";

const GuestPage = lazy(() => import("./pages/GuestPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PersonalizedPage = lazy(() => import("./pages/PersonalizedPage"));
const WardrobePage = lazy(() => import("./pages/WardrobePage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const DeveloperAccessPage = lazy(() =>
  import("./pages/DeveloperAccessPage"),
);
const DeveloperScoringPage = lazy(() =>
  import("./pages/DeveloperScoringPage"),
);
const DeveloperTrendsPage = lazy(() =>
  import("./pages/DeveloperTrendsPage"),
);
const DeveloperAnalyticsPage = lazy(() =>
  import("./pages/DeveloperAnalyticsPage"),
);

function PageFallback() {
  return <LoadingState label="Loading page" rows={4} />;
}

function ProtectedPage({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function DeveloperPage({ children }) {
  return <DeveloperRoute>{children}</DeveloperRoute>;
}

function SafeRoute({ children }) {
  return <RouteErrorBoundary>{children}</RouteErrorBoundary>;
}

function LegalFooter() {
  return (
    <footer className="page-container pb-8 pt-4 text-center text-xs text-slate-500">
      <div className="mx-auto flex max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-full border border-slate-400/10 bg-white/[0.025] px-4 py-3">
        <span>Jacket Checker</span>
        <Link
          to="/privacy"
          className="font-bold text-slate-300 transition hover:text-white"
        >
          Privacy
        </Link>
        <Link
          to="/support"
          className="font-bold text-slate-300 transition hover:text-white"
        >
          Support
        </Link>
      </div>
    </footer>
  );
}

function AppShell() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen overflow-x-hidden text-[var(--storm-text)]">
      <OfflineBanner />

      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <RouteAnnouncer />

      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="storm-atmosphere-blue absolute -left-24 -top-40 h-[32rem] w-[32rem] rounded-full blur-3xl" />
        <div className="storm-atmosphere-violet absolute -right-32 top-24 h-[30rem] w-[30rem] rounded-full blur-3xl" />
        <div className="storm-atmosphere-grid absolute inset-0" />
      </div>

      <AppHeader />

      <ThemeToggle withMobileNav={Boolean(user)} />

      <main
        id="main-content"
        tabIndex={-1}
        className={`page-container page-content focus:outline-none ${
          user ? "account-page-container max-lg:pb-28" : ""
        }`}
      >
        <AppErrorBoundary>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route
                path="/"
                element={
                  <SafeRoute>
                    <GuestPage />
                  </SafeRoute>
                }
              />

              <Route
                path="/auth"
                element={
                  <SafeRoute>
                    <AuthPage />
                  </SafeRoute>
                }
              />

              <Route
                path="/auth/reset-password"
                element={
                  <SafeRoute>
                    <ResetPasswordPage />
                  </SafeRoute>
                }
              />

              <Route
                path="/privacy"
                element={
                  <SafeRoute>
                    <PrivacyPage />
                  </SafeRoute>
                }
              />

              <Route
                path="/support"
                element={
                  <SafeRoute>
                    <SupportPage />
                  </SafeRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedPage>
                    <SafeRoute>
                      <ProfilePage />
                    </SafeRoute>
                  </ProtectedPage>
                }
              />

              <Route
                path="/wardrobe"
                element={
                  <ProtectedPage>
                    <SafeRoute>
                      <WardrobePage />
                    </SafeRoute>
                  </ProtectedPage>
                }
              />

              <Route path="/closet" element={<Navigate to="/wardrobe" replace />} />

              <Route
                path="/history"
                element={
                  <ProtectedPage>
                    <SafeRoute>
                      <HistoryPage />
                    </SafeRoute>
                  </ProtectedPage>
                }
              />

              <Route
                path="/app"
                element={
                  <ProtectedPage>
                    <SafeRoute>
                      <PersonalizedPage />
                    </SafeRoute>
                  </ProtectedPage>
                }
              />

              <Route path="/dev" element={<Navigate to="/dev/access" replace />} />

              <Route
                path="/dev/access"
                element={
                  <DeveloperPage>
                    <SafeRoute>
                      <DeveloperAccessPage />
                    </SafeRoute>
                  </DeveloperPage>
                }
              />

              <Route
                path="/dev/scoring"
                element={
                  <DeveloperPage>
                    <SafeRoute>
                      <DeveloperScoringPage />
                    </SafeRoute>
                  </DeveloperPage>
                }
              />

              <Route
                path="/dev/trends"
                element={
                  <DeveloperPage>
                    <SafeRoute>
                      <DeveloperTrendsPage />
                    </SafeRoute>
                  </DeveloperPage>
                }
              />

              <Route
                path="/dev/analytics"
                element={
                  <DeveloperPage>
                    <SafeRoute>
                      <DeveloperAnalyticsPage />
                    </SafeRoute>
                  </DeveloperPage>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppErrorBoundary>
      </main>

      <LegalFooter />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <NetworkStatusProvider>
          <AuthProvider>
            <NativeAuthHandler />

            <DeveloperAccessProvider>
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
            </DeveloperAccessProvider>
          </AuthProvider>
        </NetworkStatusProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
