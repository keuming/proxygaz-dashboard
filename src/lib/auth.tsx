import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { trpcMutation, setToken, clearToken } from "./api";

interface AdminUser {
  id: string;
  nom: string;
  role: string;
}

interface AuthContextValue {
  user: AdminUser | null;
  connexion: (telephone: string, motDePasse: string) => Promise<void>;
  deconnexion: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "proxigaz_admin_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connexion = useCallback(async (telephone: string, motDePasse: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await trpcMutation<{ token: string; user: AdminUser }>(
        "auth.connexion",
        { telephone, motDePasse }
      );
      if (data.user.role !== "admin") {
        throw new Error("Ce compte n'a pas les droits d'administration");
      }
      setToken(data.token);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
      setUser(data.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de la connexion");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const deconnexion = useCallback(() => {
    clearToken();
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, connexion, deconnexion, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
