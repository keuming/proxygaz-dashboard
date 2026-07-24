import { useEffect, useState, useCallback } from "react";
import { trpcQuery, trpcMutation } from "../lib/api";
import { Card, PageHeader } from "../components/Card";
import { StatusGauge } from "../components/StatusGauge";

interface Ramasseur {
  id: string;
  nom: string;
  telephone: string;
  type: string;
  nomSociete: string | null;
  zonesCouvertes: string[];
  statutValidation: string;
  nombreRamassages: number;
}

export function Ramasseurs() {
  const [ramasseurs, setRamasseurs] = useState<Ramasseur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);

  const charger = useCallback(() => {
    setChargement(true);
    trpcQuery<Ramasseur[]>("admin.listRamasseurs")
      .then(setRamasseurs)
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  async function valider(id: string, approuver: boolean) {
    setActionEnCours(id);
    try {
      await trpcMutation("admin.validerRamasseur", { ramasseurId: id, approuver });
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionEnCours(null);
    }
  }

  return (
    <div>
      <PageHeader title="Ramasseurs" subtitle="Particuliers et sociétés de ramassage" />

      {erreur && (
        <div className="mb-4 rounded-md bg-valve-400/10 px-4 py-3 text-sm text-valve-600">{erreur}</div>
      )}

      <Card>
        {chargement ? (
          <div className="p-6 text-sm text-ink/50">Chargement...</div>
        ) : ramasseurs.length === 0 ? (
          <div className="p-6 text-sm text-ink/50">Aucun ramasseur enregistré.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink/40">
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Zones</th>
                <th className="px-4 py-3">Ramassages</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {ramasseurs.map((r) => (
                <tr key={r.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.nomSociete || r.nom}</div>
                    <div className="font-data text-xs text-ink/50">{r.telephone}</div>
                  </td>
                  <td className="px-4 py-3 text-ink/70">
                    {r.type === "societe" ? "Société" : "Particulier"}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-ink/70">
                    {r.zonesCouvertes.join(", ")}
                  </td>
                  <td className="px-4 py-3 font-data">{r.nombreRamassages}</td>
                  <td className="px-4 py-3">
                    <StatusGauge statut={r.statutValidation} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.statutValidation === "en_attente" && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => valider(r.id, true)}
                          disabled={actionEnCours === r.id}
                          className="rounded-md bg-gaz-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-gaz-600 disabled:opacity-60"
                        >
                          Valider
                        </button>
                        <button
                          onClick={() => valider(r.id, false)}
                          disabled={actionEnCours === r.id}
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
