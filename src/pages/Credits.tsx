import { useEffect, useState, useCallback } from "react";
import { trpcQuery, trpcMutation } from "../lib/api";
import { Card, PageHeader } from "../components/Card";

interface DemandeCredit {
  id: string;
  profil: "livreur" | "ramasseur";
  nomDemandeur: string;
  telephoneDemandeur: string;
  quantiteCredits: number;
  montantPaye: string;
  referencePaiement: string | null;
  statut: "en_attente" | "validee" | "rejetee";
  createdAt: string;
  traiteeAt: string | null;
}

const FILTRES = [
  { value: "en_attente", label: "En attente" },
  { value: "validee", label: "Validées" },
  { value: "rejetee", label: "Rejetées" },
  { value: "", label: "Toutes" },
];

export function Credits() {
  const [demandes, setDemandes] = useState<DemandeCredit[]>([]);
  const [filtre, setFiltre] = useState("en_attente");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);

  const charger = useCallback(() => {
    setChargement(true);
    trpcQuery<DemandeCredit[]>("admin.listDemandesCredit", filtre ? { statut: filtre } : {})
      .then(setDemandes)
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }, [filtre]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function valider(id: string) {
    setActionEnCours(id);
    setErreur(null);
    try {
      await trpcMutation("admin.validerDemandeCredit", { demandeId: id });
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionEnCours(null);
    }
  }

  async function rejeter(id: string) {
    setActionEnCours(id);
    setErreur(null);
    try {
      await trpcMutation("admin.rejeterDemandeCredit", { demandeId: id });
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionEnCours(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Crédits"
        subtitle="Mise à disposition des crédits achetés par les livreurs et ramasseurs (1 crédit = 100 FCFA)"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTRES.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltre(f.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
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
                <th className="px-4 py-3">Demandeur</th>
                <th className="px-4 py-3">Profil</th>
                <th className="px-4 py-3">Quantité</th>
                <th className="px-4 py-3">Montant payé</th>
                <th className="px-4 py-3">Référence paiement</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {demandes.map((d) => (
                <tr key={d.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{d.nomDemandeur}</div>
                    <div className="font-data text-xs text-ink/50">{d.telephoneDemandeur}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        d.profil === "livreur"
                          ? "bg-steel-400/10 text-steel-600"
                          : "bg-gaz-400/10 text-gaz-600"
                      }`}
                    >
                      {d.profil === "livreur" ? "Livreur" : "Ramasseur"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-data font-semibold">{d.quantiteCredits} crédit(s)</td>
                  <td className="px-4 py-3 font-data font-medium">
                    {Number(d.montantPaye).toLocaleString()} FCFA
                  </td>
                  <td className="px-4 py-3 text-xs text-ink/60">{d.referencePaiement ?? "—"}</td>
                  <td className="px-4 py-3 font-data text-xs text-ink/50">
                    {new Date(d.createdAt).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {d.statut === "en_attente" ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => valider(d.id)}
                          disabled={actionEnCours === d.id}
                          className="rounded-md bg-gaz-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-gaz-600 disabled:opacity-60"
                        >
                          Mettre à disposition
                        </button>
                        <button
                          onClick={() => rejeter(d.id)}
                          disabled={actionEnCours === d.id}
                          className="rounded-md bg-valve-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-valve-600 disabled:opacity-60"
                        >
                          Rejeter
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          d.statut === "validee"
                            ? "bg-gaz-400/10 text-gaz-600"
                            : "bg-valve-400/10 text-valve-600"
                        }`}
                      >
                        {d.statut === "validee" ? "Validée" : "Rejetée"}
                      </span>
                    )}
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
