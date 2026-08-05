import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { InstallPrompt } from "./InstallPrompt";

const NAV_ITEMS = [
  { to: "/", label: "Vue d'ensemble", icon: "◎" },
  { to: "/commandes-gaz", label: "Commandes gaz", icon: "▮" },
  { to: "/ramassage", label: "Ramassage", icon: "◆" },
  { to: "/encaissements", label: "Encaissements", icon: "$" },
  { to: "/credits", label: "Crédits", icon: "◈" },
  { to: "/support", label: "Support client", icon: "☎" },
  { to: "/boutiques", label: "Boutiques", icon: "▭" },
  { to: "/livreurs", label: "Livreurs", icon: "▲" },
  { to: "/ramasseurs", label: "Ramasseurs", icon: "●" },
];

function ContenuMenu({
  onNaviguer,
  onFermer,
  afficherBoutonFermer,
}: {
  onNaviguer: () => void;
  onFermer?: () => void;
  afficherBoutonFermer?: boolean;
}) {
  const { user, deconnexion } = useAuth();

  return (
    <>
      <div
        className="flex items-center justify-between border-b border-white/10 px-6 py-6"
        style={{ paddingTop: "calc(1.5rem + env(safe-area-inset-top))" }}
      >
        <div>
          <div className="font-display text-2xl font-bold tracking-tight text-white">
            PROXI<span className="text-safety-400">GAZ</span>
          </div>
          <div className="mt-0.5 font-data text-[11px] uppercase tracking-widest text-white/40">
            Console de dispatch
          </div>
        </div>
        {afficherBoutonFermer && (
          <button onClick={onFermer} className="text-white/60 hover:text-white">
            ✕
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onNaviguer}
            className={({ isActive }) =>
              `mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-panel2 text-white"
                  : "text-white/60 hover:bg-panel2/60 hover:text-white/90"
              }`
            }
          >
            <span className="font-data text-steel-400">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div
        className="border-t border-white/10 px-6 py-4"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <div className="font-data text-xs text-white/50">{user?.nom}</div>
        <button onClick={deconnexion} className="mt-2 text-xs text-safety-400 hover:text-safety-300">
          Se déconnecter
        </button>
      </div>
    </>
  );
}

export function Layout() {
  const [tiroirOuvert, setTiroirOuvert] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-surface">
      {/* Menu latéral statique — uniquement sur desktop, jamais monté sur mobile */}
      <aside className="hidden w-64 shrink-0 flex-col bg-panel text-white/90 sm:flex">
        <ContenuMenu onNaviguer={() => {}} />
      </aside>

      {/* Tiroir mobile — retiré du DOM quand fermé (pas de transform sur un élément fixed,
          qui pouvait provoquer un débordement horizontal résiduel sur certains navigateurs) */}
      {tiroirOuvert && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 sm:hidden"
            onClick={() => setTiroirOuvert(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-panel text-white/90 sm:hidden">
            <ContenuMenu
              onNaviguer={() => setTiroirOuvert(false)}
              onFermer={() => setTiroirOuvert(false)}
              afficherBoutonFermer
            />
          </aside>
        </>
      )}

      {/* Colonne principale : en-tête mobile fixe + zone de contenu qui défile seule */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className="flex shrink-0 items-center gap-3 bg-panel px-4 py-3 sm:hidden"
          style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
        >
          <button onClick={() => setTiroirOuvert(true)} className="text-xl text-white">
            ☰
          </button>
          <div className="font-display text-base font-bold text-white">
            PROXI<span className="text-safety-400">GAZ</span>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      <InstallPrompt />
    </div>
  );
}
