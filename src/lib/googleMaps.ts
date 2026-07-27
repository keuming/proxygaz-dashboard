let chargementPromise: Promise<void> | null = null;

/**
 * Charge le script Google Maps JS (avec la bibliothèque Places) une seule fois,
 * même si plusieurs composants l'appellent en parallèle.
 */
export function chargerGoogleMaps(): Promise<void> {
  if (chargementPromise) return chargementPromise;

  const cle = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  chargementPromise = new Promise((resolve, reject) => {
    if (!cle) {
      reject(new Error("VITE_GOOGLE_MAPS_API_KEY manquante"));
      return;
    }

    if ((window as any).google?.maps?.places) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${cle}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Échec du chargement de Google Maps"));
    document.head.appendChild(script);
  });

  return chargementPromise;
}
