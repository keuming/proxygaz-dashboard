import { useEffect, useState, useCallback } from "react";
import { trpcQuery } from "../lib/api";
import { Card, PageHeader } from "../components/Card";

interface Transaction {
  id: string;
  type: "gaz" | "ramassage";
  service: string;
  clientNom: string;
  clientTelephone: string;
  partenaireNom: string;
  montant: number;
  modePaiement: "especes_livraison" | "mobile_money" | null;
  encaisseAt: string | null;
}

interface Encaissements {
  transactions: Transaction[];
  totaux: {
    especes: number;
    mobilePay: number;
    global: number;
    nbTransactions: number;
  };
}

const FILTRES_PERIODE = [
  { value: "", label: "Tout" },
  { value: "aujourdhui", label: "Aujourd'hui" },
  { value: "semaine", label: "7 derniers jours" },
  { value: "mois", label: "Ce mois" },
];

const FILTRES_TYPE = [
  { value: "", label: "Tous services" },
  { value: "gaz", label: "Gaz" },
  { value: "ramassage", label: "Ramassage" },
];

function calculerDepuis(periode: string): string | undefined {
  const maintenant = new Date();
  if (periode === "aujourdhui") {
    maintenant.setHours(0, 0, 0, 0);
    return maintenant.toISOString();
  }
  if (periode === "semaine") {
    maintenant.setDate(maintenant.getDate() - 7);
    return maintenant.toISOString();
  }
  if (periode === "mois") {
    maintenant.setDate(1);
    maintenant.setHours(0, 0, 0, 0);
    return maintenant.toISOString();
  }
  return undefined;
}

export function Encaissements() {
  const [donnees, setDonnees] = useState<Encaissements | null>(null);
  const [periode, setPeriode] = useState("");
  const [typeFiltre, setTypeFiltre] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(() => {
    setChargement(true);
    const depuis = calculerDepuis(periode);
    trpcQuery<Encaissements>("admin.encaissementsGlobal", depuis ? { depuis } : {})
      .then(setDonnees)
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }, [periode]);

  useEffect(() => {
    charger();
  }, [charger]);

  const transactionsFiltrees = donnees
    ? donnees.transactions.filter((t) => !typeFiltre || t.type === typeFiltre)
    : [];

  return (
    <div>
      <PageHeader
        title="Encaissements"
        subtitle="Vue globale — toutes boutiques et ramasseurs confondus"
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTRES_PERIODE.map((f) => (
            <button
              key={f.value}
              onClick={() => setPeriode(f.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                periode === f.value ? "bg-steel-500 text-white" : "bg-white text-ink/60 hover:bg-ink/5"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {FILTRES_TYPE.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFiltre(f.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                typeFiltre === f.value ? "bg-panel text-white" : "bg-white text-ink/60 hover:bg-ink/5"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {erreur && (
        <div className="mb-4 rounded-md bg-valve-400/10 px-4 py-3 text-sm text-valve-600">{erreur}</div>
      )}

      {chargement ? (
        <div className="p-6 text-sm text-ink/50">Chargement...</div>
      ) : donnees ? (
        <>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <Card className="p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-ink/40">Total encaissé</div>
              <div className="mt-1 font-data text-2xl font-bold text-ink">
                {donnees.totaux.global.toLocaleString()} <span className="text-xs font-normal">FCFA</span>
              </div>
              <div className="mt-0.5 text-xs text-ink/40">{donnees.totaux.nbTransactions} transaction(s)</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-ink/40">💵 Espèces</div>
              <div className="mt-1 font-data text-2xl font-bold text-steel-600">
                {donnees.totaux.especes.toLocaleString()} <span className="text-xs font-normal">FCFA</span>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-ink/40">📱 MobilePay</div>
              <div className="mt-1 font-data text-2xl font-bold text-[#10B981]">
                {donnees.totaux.mobilePay.toLocaleString()} <span className="text-xs font-normal">FCFA</span>
              </div>
            </Card>
          </div>

          {donnees.totaux.global > 0 && (
            <Card className="mb-4 p-4">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/40">
                Répartition
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink/5">
                <div
                  className="bg-steel-500"
                  style={{ width: `${(donnees.totaux.especes / donnees.totaux.global) * 100}%` }}
                />
                <div
                  className="bg-[#10B981]"
                  style={{ width: `${(donnees.totaux.mobilePay / donnees.totaux.global) * 100}%` }}
                />
              </div>
            </Card>
          )}

          <Card>
            {transactionsFiltrees.length === 0 ? (
              <div className="p-6 text-sm text-ink/50">Aucun encaissement pour ce filtre.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink/40">
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Téléphone</th>
                    <th className="px-4 py-3">Prestataire</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3">Montant</th>
                    <th className="px-4 py-3">Date et heure</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionsFiltrees.map((t) => (
                    <tr key={`${t.type}-${t.id}`} className="border-b border-ink/5 last:border-0">
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            t.type === "gaz"
                              ? "bg-safety-400/10 text-safety-600"
                              : "bg-gaz-400/10 text-gaz-600"
                          }`}
                        >
                          {t.service}
                        </span>
                      </td>
                      <td className="px-4 py-3">{t.clientNom}</td>
                      <td className="px-4 py-3 font-data text-ink/70">{t.clientTelephone}</td>
                      <td className="px-4 py-3 text-ink/70">{t.partenaireNom}</td>
                      <td className="px-4 py-3">
                        {t.modePaiement === "mobile_money" ? (
                          <span className="text-xs font-medium text-[#10B981]">📱 MobilePay</span>
                        ) : (
                          <span className="text-xs font-medium text-steel-600">💵 Espèces</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-data font-medium">{t.montant.toLocaleString()} FCFA</td>
                      <td className="px-4 py-3 font-data text-xs text-ink/50">
                        {t.encaisseAt ? (
                          <>
                            <div>{new Date(t.encaisseAt).toLocaleDateString("fr-FR")}</div>
                            <div className="text-ink/40">
                              {new Date(t.encaisseAt).toLocaleTimeString("fr-FR")}
                            </div>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}
