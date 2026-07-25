import { useState, FormEvent } from "react";
import { trpcQuery } from "../lib/api";
import { Card, PageHeader } from "../components/Card";
import { StatusGauge } from "../components/StatusGauge";

interface UtilisateurTrouve {
  id: string;
  nom: string;
  telephone: string;
  role: string;
  createdAt: string;
}

interface CommandeGazDetail {
  id: string;
  quantite: number;
  prixTotal: string;
  adresseLivraison: string;
  statut: string;
  modePaiement: "especes_livraison" | "mobile_money" | null;
  encaisse: boolean;
  encaisseAt: string | null;
  livreurNom: string | null;
  livreurTelephone: string | null;
  boutiqueNom: string | null;
  boutiqueTelephone: string | null;
  createdAt: string;
  confirmedAt: string | null;
  livreeAt: string | null;
  raisonNonLivraison: string | null;
  notes: string | null;
}

interface DemandeRamassageDetail {
  id: string;
  adresse: string;
  ville: string;
  typeDechet: string;
  prixPropose: string | null;
  statut: string;
  modePaiement: "especes_livraison" | "mobile_money" | null;
  encaisse: boolean;
  encaisseAt: string | null;
  ramasseurNomSociete: string | null;
  createdAt: string;
  validatedAt: string | null;
  terminatedAt: string | null;
}

interface ResultatRecherche {
  utilisateurs: UtilisateurTrouve[];
  commandesGaz: CommandeGazDetail[];
  demandesRamassage: DemandeRamassageDetail[];
}

const LABELS_ROLE: Record<string, string> = {
  client: "Client",
  boutique: "Boutique",
  livreur: "Livreur",
  ramasseur: "Ramasseur",
  admin: "Admin",
};

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR");
}

export function Support() {
  const [telephone, setTelephone] = useState("");
  const [resultat, setResultat] = useState<ResultatRecherche | null>(null);
  const [recherche, setRecherche] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [aRecherche, setARecherche] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!telephone.trim()) return;
    setRecherche(true);
    setErreur(null);
    setARecherche(true);
    try {
      const r = await trpcQuery<ResultatRecherche>("admin.rechercheParTelephone", { telephone });
      setResultat(r);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur lors de la recherche");
    } finally {
      setRecherche(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Support client"
        subtitle="Recherchez un numéro de téléphone pour retrouver l'historique complet en cas de litige"
      />

      <form onSubmit={onSubmit} className="mb-6 flex gap-2">
        <input
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          placeholder="Numéro de téléphone (ou une partie)"
          className="flex-1 rounded-md border border-ink/15 px-4 py-2.5 text-sm focus:border-steel-500"
        />
        <button
          type="submit"
          disabled={recherche}
          className="rounded-md bg-steel-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-steel-600 disabled:opacity-60"
        >
          {recherche ? "Recherche..." : "Rechercher"}
        </button>
      </form>

      {erreur && (
        <div className="mb-4 rounded-md bg-valve-400/10 px-4 py-3 text-sm text-valve-600">{erreur}</div>
      )}

      {aRecherche && resultat && resultat.utilisateurs.length === 0 && (
        <p className="text-sm text-ink/40">Aucun compte ne correspond à ce numéro.</p>
      )}

      {resultat && resultat.utilisateurs.length > 0 && (
        <>
          <div className="mb-6 space-y-2">
            {resultat.utilisateurs.map((u) => (
              <Card key={u.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-medium text-ink">{u.nom}</div>
                  <div className="font-data text-xs text-ink/50">{u.telephone}</div>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-steel-400/10 px-2.5 py-1 text-xs font-medium text-steel-600">
                    {LABELS_ROLE[u.role] ?? u.role}
                  </span>
                  <div className="mt-1 text-xs text-ink/40">
                    Inscrit le {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {resultat.commandesGaz.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-ink/50">
                Commandes de gaz ({resultat.commandesGaz.length})
              </h2>
              <div className="space-y-3">
                {resultat.commandesGaz.map((c) => (
                  <Card key={c.id} className="p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <div className="font-data text-xs text-ink/40">#{c.id.slice(0, 8)}</div>
                        <div className="text-sm text-ink/70">{c.adresseLivraison}</div>
                      </div>
                      <StatusGauge statut={c.statut} />
                    </div>

                    <div className="mb-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                      <div>
                        <div className="text-ink/40">Montant</div>
                        <div className="font-data font-medium text-ink">
                          {Number(c.prixTotal).toLocaleString()} FCFA
                        </div>
                      </div>
                      <div>
                        <div className="text-ink/40">Paiement</div>
                        <div className="font-medium text-ink">
                          {c.modePaiement === "mobile_money"
                            ? "MobilePay"
                            : c.modePaiement === "especes_livraison"
                            ? "Espèces"
                            : "—"}{" "}
                          {c.encaisse ? "✅" : "⏳"}
                        </div>
                      </div>
                      <div>
                        <div className="text-ink/40">Boutique</div>
                        <div className="font-medium text-ink">{c.boutiqueNom ?? "—"}</div>
                        <div className="font-data text-ink/50">{c.boutiqueTelephone ?? ""}</div>
                      </div>
                      <div>
                        <div className="text-ink/40">Livreur</div>
                        <div className="font-medium text-ink">{c.livreurNom ?? "—"}</div>
                        <div className="font-data text-ink/50">{c.livreurTelephone ?? ""}</div>
                      </div>
                    </div>

                    {c.raisonNonLivraison && (
                      <div className="mb-2 rounded bg-valve-400/10 px-2 py-1.5 text-xs text-valve-600">
                        Motif non-livraison : {c.raisonNonLivraison}
                      </div>
                    )}
                    {c.notes && (
                      <div className="mb-2 rounded bg-ink/5 px-2 py-1.5 text-xs text-ink/60">
                        Notes : {c.notes}
                      </div>
                    )}

                    <div className="mt-2 border-t border-ink/5 pt-2 text-xs text-ink/40">
                      <div>Créée : {formatDate(c.createdAt)}</div>
                      {c.confirmedAt && <div>Confirmée : {formatDate(c.confirmedAt)}</div>}
                      {c.livreeAt && <div>Livrée : {formatDate(c.livreeAt)}</div>}
                      {c.encaisseAt && <div>Encaissée : {formatDate(c.encaisseAt)}</div>}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {resultat.demandesRamassage.length > 0 && (
            <div>
              <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-ink/50">
                Demandes de ramassage ({resultat.demandesRamassage.length})
              </h2>
              <div className="space-y-3">
                {resultat.demandesRamassage.map((d) => (
                  <Card key={d.id} className="p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <div className="font-data text-xs text-ink/40">#{d.id.slice(0, 8)}</div>
                        <div className="text-sm text-ink/70">
                          {d.adresse} — {d.ville}
                        </div>
                      </div>
                      <StatusGauge statut={d.statut} />
                    </div>

                    <div className="mb-3 grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <div className="text-ink/40">Montant</div>
                        <div className="font-data font-medium text-ink">
                          {d.prixPropose ? Number(d.prixPropose).toLocaleString() : 0} FCFA
                        </div>
                      </div>
                      <div>
                        <div className="text-ink/40">Paiement</div>
                        <div className="font-medium text-ink">
                          {d.modePaiement === "mobile_money"
                            ? "MobilePay"
                            : d.modePaiement === "especes_livraison"
                            ? "Espèces"
                            : "—"}{" "}
                          {d.encaisse ? "✅" : "⏳"}
                        </div>
                      </div>
                      <div>
                        <div className="text-ink/40">Ramasseur</div>
                        <div className="font-medium text-ink">{d.ramasseurNomSociete ?? "—"}</div>
                      </div>
                    </div>

                    <div className="mt-2 border-t border-ink/5 pt-2 text-xs text-ink/40">
                      <div>Créée : {formatDate(d.createdAt)}</div>
                      {d.validatedAt && <div>Validée : {formatDate(d.validatedAt)}</div>}
                      {d.terminatedAt && <div>Terminée : {formatDate(d.terminatedAt)}</div>}
                      {d.encaisseAt && <div>Encaissée : {formatDate(d.encaisseAt)}</div>}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {resultat.commandesGaz.length === 0 && resultat.demandesRamassage.length === 0 && (
            <p className="text-sm text-ink/40">Aucune commande ni demande associée à ce compte.</p>
          )}
        </>
      )}
    </div>
  );
}
