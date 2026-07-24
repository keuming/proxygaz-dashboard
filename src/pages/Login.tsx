import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function Login() {
  const { connexion, loading, error } = useAuth();
  const navigate = useNavigate();
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await connexion(telephone, motDePasse);
      navigate("/");
    } catch {
      // l'erreur est déjà exposée via le contexte
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-panel">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-display text-3xl font-bold tracking-tight text-white">
            PROXI<span className="text-safety-400">GAZ</span>
          </div>
          <div className="mt-1 font-data text-xs uppercase tracking-widest text-white/40">
            Console de dispatch
          </div>
        </div>

        <form onSubmit={onSubmit} className="rounded-lg bg-white p-8 shadow-xl">
          <label className="mb-1 block text-sm font-medium text-ink/70">Téléphone</label>
          <input
            type="text"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="0700000000"
            className="mb-4 w-full rounded-md border border-ink/15 px-3 py-2 text-sm focus:border-steel-500"
            required
          />

          <label className="mb-1 block text-sm font-medium text-ink/70">Mot de passe</label>
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className="mb-6 w-full rounded-md border border-ink/15 px-3 py-2 text-sm focus:border-steel-500"
            required
          />

          {error && (
            <div className="mb-4 rounded-md bg-valve-400/10 px-3 py-2 text-sm text-valve-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-steel-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-steel-600 disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
