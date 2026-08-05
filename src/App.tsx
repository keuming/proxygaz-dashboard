import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Overview } from "./pages/Overview";
import { CommandesGaz } from "./pages/CommandesGaz";
import { Ramassage } from "./pages/Ramassage";
import { Encaissements } from "./pages/Encaissements";
import { Credits } from "./pages/Credits";
import { Support } from "./pages/Support";
import { Boutiques } from "./pages/Boutiques";
import { Livreurs } from "./pages/Livreurs";
import { Ramasseurs } from "./pages/Ramasseurs";
import { Societes } from "./pages/Societes";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Overview />} />
        <Route path="commandes-gaz" element={<CommandesGaz />} />
        <Route path="ramassage" element={<Ramassage />} />
        <Route path="encaissements" element={<Encaissements />} />
        <Route path="credits" element={<Credits />} />
        <Route path="support" element={<Support />} />
        <Route path="boutiques" element={<Boutiques />} />
        <Route path="livreurs" element={<Livreurs />} />
        <Route path="ramasseurs" element={<Ramasseurs />} />
        <Route path="societes" element={<Societes />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
