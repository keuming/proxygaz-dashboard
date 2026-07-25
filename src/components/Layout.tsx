import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";

const NAV_ITEMS = [
  { to: "/", label: "Vue d'ensemble", icon: "◎" },
  { to: "/commandes-gaz", label: "Commandes gaz", icon: "▮" },
  { to: "/ramassage", label: "Ramassage", icon: "◆" },
  { to: "/encaissements", label: "Encaissements", icon: "$" },
  { to: "/support", label: "Support client", icon: "☎" },
  { to: "/boutiques", label: "Boutiques", icon: "▭" },
  { to: "/livreurs", label: "Livreurs", icon: "▲" },
  { to: "/ramasseurs", label: "Ramasseurs", icon: "●" },
];

export function Layout() {
  const { user, deconnexion } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-shrink-0 flex-col bg-panel text-white/90">
        <div className="border-b border-white/10 px-6 py-6">
          <div className="font-display text-2xl font-bold tracking-tight text-white">
            PROXI<span className="text-safety-400">GAZ</span>
          </div>
          <div className="mt-0.5 font-data text-[11px] uppercase tracking-widest text-white/40">
            Console de dispatch
          </div>
        </div>

        <nav className="flex-1 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
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

        <div className="border-t border-white/10 px-6 py-4">
          <div className="font-data text-xs text-white/50">{user?.nom}</div>
          <button
            onClick={deconnexion}
            className="mt-2 text-xs text-safety-400 hover:text-safety-300"
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
