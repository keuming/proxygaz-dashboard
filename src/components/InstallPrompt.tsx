import { useEffect, useState } from "react";

const CLE_MASQUE = "proxigaz_manager_install_masque";

function dejaInstallee(): boolean {
  const standaloneWeb = window.matchMedia("(display-mode: standalone)").matches;
  const standaloneIOS = (window.navigator as any).standalone === true; // Safari iOS
  return standaloneWeb || standaloneIOS;
}

function estIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function estMobile(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * Bannière d'installation PWA — 100% instructions manuelles (même choix que sur la
 * vitrine : la tentative de déclenchement programmatique sur Android s'est montrée
 * incohérente selon les appareils, les instructions manuelles fonctionnent toujours).
 */
export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [modeIOS, setModeIOS] = useState(false);

  useEffect(() => {
    if (dejaInstallee()) return;
    if (localStorage.getItem(CLE_MASQUE)) return;
    if (!estMobile()) return;

    setModeIOS(estIOS());
    setVisible(true);
  }, []);

  function fermer() {
    setVisible(false);
    localStorage.setItem(CLE_MASQUE, "1");
  }

  if (!visible) return null;

  return (
    <div
      className="fixed left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-slide-up rounded-lg bg-panel2 px-4 py-3 text-white shadow-xl"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mb-2 text-sm font-medium">Comment installer ProxiGaz Manager</div>

      {modeIOS ? (
        <>
          <div className="flex items-start gap-2 text-xs text-white/70">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold">
              1
            </span>
            <span className="min-w-0 flex-1 leading-relaxed">
              Appuyez sur l'icône{" "}
              <svg
                viewBox="0 0 24 24"
                className="inline-block h-3.5 w-3.5 align-[-3px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0-12l-4 4m4-4l4 4" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12v6a2 2 0 002 2h10a2 2 0 002-2v-6"
                />
              </svg>{" "}
              Partager de Safari
            </span>
          </div>
          <div className="mt-1.5 flex items-start gap-2 text-xs text-white/70">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold">
              2
            </span>
            <span className="min-w-0 flex-1 leading-relaxed">
              Choisissez <span className="font-semibold text-white">Sur l'écran d'accueil</span>
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start gap-2 text-xs text-white/70">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold">
              1
            </span>
            <span className="min-w-0 flex-1 leading-relaxed">
              Appuyez sur le menu <span className="font-semibold text-white">⋮</span> en haut à
              droite de Chrome
            </span>
          </div>
          <div className="mt-1.5 flex items-start gap-2 text-xs text-white/70">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold">
              2
            </span>
            <span className="min-w-0 flex-1 leading-relaxed">
              Choisissez{" "}
              <span className="font-semibold text-white">
                "Installer l'application" ou "Ajouter à l'écran d'accueil"
              </span>
            </span>
          </div>
        </>
      )}

      <button
        onClick={fermer}
        className="mt-3 w-full rounded-md bg-white/10 py-2 text-xs font-medium text-white hover:bg-white/20"
      >
        J'ai compris
      </button>
    </div>
  );
}
