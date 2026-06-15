import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppHeader from "./components/AppHeader";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestPage from "./pages/GuestPage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import PersonalizedPage from "./pages/PersonalizedPage";
import ClosetPage from "./pages/ClosetPage";

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
          <Routes>
            <Route path="/" element={<GuestPage />} />
            <Route path="/auth" element={<AuthPage />} />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/closet"
              element={
                <ProtectedRoute>
                  <ClosetPage />
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
          </Routes>
        </div>
      </div>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;