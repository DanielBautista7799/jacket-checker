import { lazy, Suspense } from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ProfileProvider } from "./context/ProfileContext";
import { RecommendationLearningProvider } from "./context/RecommendationLearningContext";
import { WardrobeProvider } from "./context/WardrobeContext";
import { WeatherProvider } from "./context/WeatherContext";

import AppHeader from "./components/AppHeader";
import ProtectedRoute from "./components/ProtectedRoute";

const GuestPage = lazy(() =>
  import("./pages/GuestPage")
);

const AuthPage = lazy(() =>
  import("./pages/AuthPage")
);

const ProfilePage = lazy(() =>
  import("./pages/ProfilePage")
);

const PersonalizedPage = lazy(() =>
  import("./pages/PersonalizedPage")
);

const WardrobePage = lazy(() =>
  import("./pages/WardrobePage")
);

const HistoryPage = lazy(() =>
  import("./pages/HistoryPage")
);

function PageFallback() {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-8 text-center text-slate-300">
      Loading page...
    </div>
  );
}

function AppShell() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />

        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="absolute bottom-1/3 left-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-5xl">
        <AppHeader />

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur-xl sm:p-6 lg:p-8">
          <Suspense
            fallback={<PageFallback />}
          >
            <Routes>
              <Route
                path="/"
                element={<GuestPage />}
              />

              <Route
                path="/auth"
                element={<AuthPage />}
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/wardrobe"
                element={
                  <ProtectedRoute>
                    <WardrobePage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/closet"
                element={
                  <Navigate
                    to="/wardrobe"
                    replace
                  />
                }
              />

              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <HistoryPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <PersonalizedPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="*"
                element={
                  <Navigate
                    to="/"
                    replace
                  />
                }
              />
            </Routes>
          </Suspense>
        </div>
      </div>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WeatherProvider>
          <ProfileProvider>
            <WardrobeProvider>
              <RecommendationLearningProvider>
                <AppShell />
              </RecommendationLearningProvider>
            </WardrobeProvider>
          </ProfileProvider>
        </WeatherProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;