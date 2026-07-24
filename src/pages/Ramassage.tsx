import { useEffect, useState, useCallback } from "react";
import { trpcQuery } from "../lib/api";
import { Card, PageHeader } from "../components/Card";
import { StatusGauge } from "../components/StatusGauge";

interface DemandeRamassage {
  id: string;
  clientNom: string;
  clientTelephone: string;
  adresse: string;
  ville: string;
  typeDechet: string;
  quantiteEstimee: string | null;
  statut: string;
  createdAt: string;
}

const FILTRES = [
  { value: "", label: "Toutes" },
  { value: "en_attente", label: "En attente" },
  { value: "validee", label: "Validées" },
  { value: "en_cours", label: "En cours" },
  { value: "terminee", label: "Terminées" },
  { value: "annulee", label: "Annulées" },
];

export function Ramassage() {
  const [demandes, setDemandes] = useState<DemandeRamassage[]>([]);
  const [filtre, setFiltre] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(() => {
    setChargement(true);
    trpcQuery<DemandeRamassage[]>("admin.listDemandesRamassage", filtre ? { statut: filtre } : {})
      .then(setDemandes)
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }, [filtre]);

  useEffect(() => {
    charger();
  }, [charger]);

  return (
    <div>
      <PageHeader title="Ramassage" subtitle="Demandes de ramassage de poubelles" />

      <div className="mb-4 flex gap-2">
        {FILTRES.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltre(f.value)}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              filtre === f.value ? "bg-steel-500 text-white" : "bg-white text-ink/60 hover:bg-ink/5"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {erreur && (
        <div className="mb-4 rounded-md bg-valve-400/10 px-4 py-3 text-sm text-valve-600">{erreur}</div>
      )}

      <Card>
        {chargement ? (
          <div className="p-6 text-sm text-ink/50">Chargement...</div>
        ) : demandes.length === 0 ? (
          <div className="p-6 text-sm text-ink/50">Aucune demande pour ce filtre.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink/40">
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Adresse</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Quantité</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {demandes.map((d) => (
                <tr key={d.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{d.clientNom}</div>
                    <div className="font-data text-xs text-ink/50">{d.clientTelephone}</div>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-ink/70">
                    {d.adresse} — {d.ville}
                  </td>
                  <td className="px-4 py-3 text-ink/70">{d.typeDechet}</td>
                  <td className="px-4 py-3 text-ink/70">{d.quantiteEstimee ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusGauge statut={d.statut} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
