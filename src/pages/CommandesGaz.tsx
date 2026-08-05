import { useEffect, useState, useCallback } from "react";
import { trpcQuery, trpcMutation } from "../lib/api";
import { Card, PageHeader } from "../components/Card";
import { StatusGauge } from "../components/StatusGauge";

interface CommandeGaz {
  id: string;
  clientNom: string;
  clientTelephone: string;
  quantite: number;
  prixTotal: string;
  adresseLivraison: string;
  statut: string;
  createdAt: string;
}

const FILTRES = [
  { value: "", label: "Toutes" },
  { value: "en_attente", label: "En attente" },
  { value: "confirmee", label: "Confirmées" },
  { value: "en_livraison", label: "En livraison" },
  { value: "livree", label: "Livrées" },
  { value: "annulee", label: "Annulées" },
];

export function CommandesGaz() {
  const [commandes, setCommandes] = useState<CommandeGaz[]>([]);
  const [filtre, setFiltre] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);

  const charger = useCallback(() => {
    setChargement(true);
    trpcQuery<CommandeGaz[]>("admin.listCommandesGaz", filtre ? { statut: filtre } : {})
      .then(setCommandes)
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }, [filtre]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function marquerLivree(id: string) {
    setActionEnCours(id);
    try {
      await trpcMutation("gaz.marquerLivree", { commandeId: id });
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionEnCours(null);
    }
  }

  return (
    <div>
      <PageHeader title="Commandes gaz" subtitle="Suivi des commandes de bouteilles de gaz" />

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
        ) : commandes.length === 0 ? (
          <div className="p-6 text-sm text-ink/50">Aucune commande pour ce filtre.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink/40">
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Adresse</th>
                <th className="px-4 py-3">Qté</th>
                <th className="px-4 py-3">Prix</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {commandes.map((c) => (
                <tr key={c.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.clientNom}</div>
                    <div className="font-data text-xs text-ink/50">{c.clientTelephone}</div>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-ink/70">{c.adresseLivraison}</td>
                  <td className="px-4 py-3 font-data">{c.quantite}</td>
                  <td className="px-4 py-3 font-data">{Number(c.prixTotal).toLocaleString()} FCFA</td>
                  <td className="px-4 py-3">
                    <StatusGauge statut={c.statut} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.statut === "en_livraison" && (
                      <button
                        onClick={() => marquerLivree(c.id)}
                        disabled={actionEnCours === c.id}
                        className="rounded-md bg-gaz-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-gaz-600 disabled:opacity-60"
                      >
                        {actionEnCours === c.id ? "..." : "Marquer livrée"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </Card>
    </div>
  );
}
