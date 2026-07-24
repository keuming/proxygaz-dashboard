import { useEffect, useState, useCallback } from "react";
import { trpcQuery, trpcMutation } from "../lib/api";
import { Card, PageHeader } from "../components/Card";
import { StatusGauge } from "../components/StatusGauge";

interface Boutique {
  id: string;
  nomBoutique: string;
  ville: string;
  commune: string | null;
  adresse: string | null;
  statutValidation: string;
}

export function Boutiques() {
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);

  const charger = useCallback(() => {
    setChargement(true);
    trpcQuery<Boutique[]>("admin.listBoutiques")
      .then(setBoutiques)
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  async function valider(id: string, approuver: boolean) {
    setActionEnCours(id);
    try {
      await trpcMutation("admin.validerBoutique", { boutiqueId: id, approuver });
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionEnCours(null);
    }
  }

  return (
    <div>
      <PageHeader title="Boutiques" subtitle="Dépôts de gaz partenaires" />

      {erreur && (
        <div className="mb-4 rounded-md bg-valve-400/10 px-4 py-3 text-sm text-valve-600">{erreur}</div>
      )}

      <Card>
        {chargement ? (
          <div className="p-6 text-sm text-ink/50">Chargement...</div>
        ) : boutiques.length === 0 ? (
          <div className="p-6 text-sm text-ink/50">Aucune boutique enregistrée.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink/40">
                <th className="px-4 py-3">Boutique</th>
                <th className="px-4 py-3">Localisation</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {boutiques.map((b) => (
                <tr key={b.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{b.nomBoutique}</td>
                  <td className="px-4 py-3 text-ink/70">
                    {b.commune ? `${b.commune}, ` : ""}
                    {b.ville}
                  </td>
                  <td className="px-4 py-3">
                    <StatusGauge statut={b.statutValidation} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {b.statutValidation === "en_attente" && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => valider(b.id, true)}
                          disabled={actionEnCours === b.id}
                          className="rounded-md bg-gaz-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-gaz-600 disabled:opacity-60"
                        >
                          Valider
                        </button>
                        <button
                          onClick={() => valider(b.id, false)}
                          disabled={actionEnCours === b.id}
                          className="rounded-md bg-valve-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-valve-600 disabled:opacity-60"
                        >
                          Rejeter
                        </button>
                      </div>
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
