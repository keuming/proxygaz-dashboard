import { useEffect, useState, useCallback, FormEvent } from "react";
import { trpcQuery, trpcMutation } from "../lib/api";
import { Card, PageHeader } from "../components/Card";
import { StatusGauge } from "../components/StatusGauge";
import { Modal, FormField, inputClass } from "../components/Modal";
import { AddressPicker } from "../components/AddressPicker";

interface Boutique {
  id: string;
  nomBoutique: string;
  pays: string;
  ville: string;
  commune: string | null;
  quartier: string | null;
  adresse: string | null;
  latitude: number | null;
  longitude: number | null;
  rayonLivraisonKm: number | null;
  statutValidation: string;
  gerantNom: string;
  gerantTelephone: string;
  createdAt: string;
  societeLivraisonId: string | null;
  nomSociete: string | null;
}

// Regroupe une liste rattachable à une société (nomSociete nul = indépendant) par société,
// triées par ordre alphabétique, avec les indépendants toujours en dernier.
function grouperParSociete<T extends { nomSociete: string | null }>(items: T[]) {
  const groupes = new Map<string, T[]>();
  for (const item of items) {
    const cle = item.nomSociete ?? "__independants__";
    if (!groupes.has(cle)) groupes.set(cle, []);
    groupes.get(cle)!.push(item);
  }
  const entrees = Array.from(groupes.entries());
  entrees.sort((a, b) => {
    if (a[0] === "__independants__") return 1;
    if (b[0] === "__independants__") return -1;
    return a[0].localeCompare(b[0]);
  });
  return entrees.map(([cle, items]) => ({
    label: cle === "__independants__" ? "Indépendantes" : cle,
    items,
  }));
}

function LigneDetail({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="flex justify-between border-b border-ink/5 py-2 text-sm last:border-0">
      <span className="text-ink/50">{label}</span>
      <span className="text-right font-medium text-ink">{valeur || "—"}</span>
    </div>
  );
}

interface StockLigne {
  marqueGazId: string;
  marqueNom: string;
  marqueTaille: string;
  quantiteDisponible: number;
  seuilAlerte: number;
}

const CHAMPS_INITIAUX = {
  nom: "",
  telephone: "",
  codePin: "",
  nomBoutique: "",
  pays: "Côte d'Ivoire",
  ville: "Abidjan",
  commune: "",
  quartier: "",
  adresse: "",
  latitude: "",
  longitude: "",
  societeLivraisonId: "",
};

const CHAMPS_EDITION_INITIAUX = {
  nomBoutique: "",
  pays: "",
  ville: "",
  commune: "",
  quartier: "",
  adresse: "",
  latitude: "",
  longitude: "",
  rayonLivraisonKm: "",
  societeLivraisonId: "",
};

const STATUTS: { value: string; label: string }[] = [
  { value: "en_attente", label: "En attente" },
  { value: "valide", label: "Validée" },
  { value: "rejete", label: "Rejetée" },
  { value: "suspendu", label: "Suspendue (désactivée)" },
];

export function Boutiques() {
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [societes, setSocietes] = useState<{ id: string; nomSociete: string }[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [champs, setChamps] = useState(CHAMPS_INITIAUX);
  const [creationEnCours, setCreationEnCours] = useState(false);

  const [editionOuverte, setEditionOuverte] = useState<Boutique | null>(null);
  const [detailsOuverts, setDetailsOuverts] = useState<Boutique | null>(null);
  const [champsEdition, setChampsEdition] = useState(CHAMPS_EDITION_INITIAUX);
  const [editionEnCours, setEditionEnCours] = useState(false);

  const [stockOuvert, setStockOuvert] = useState<Boutique | null>(null);
  const [stockItems, setStockItems] = useState<StockLigne[]>([]);
  const [stockChargement, setStockChargement] = useState(false);
  const [stockErreur, setStockErreur] = useState<string | null>(null);

  const charger = useCallback(() => {
    setChargement(true);
    trpcQuery<Boutique[]>("admin.listBoutiques")
      .then(setBoutiques)
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => {
    charger();
    trpcQuery<{ id: string; nomSociete: string; statutValidation: string }[]>("admin.listSocietesLivraison")
      .then((rows) => setSocietes(rows.filter((s) => s.statutValidation === "valide")))
      .catch(() => {});
  }, [charger]);

  async function changerStatut(id: string, statut: string) {
    setActionEnCours(id);
    try {
      await trpcMutation("admin.changerStatutBoutique", { boutiqueId: id, statut });
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionEnCours(null);
    }
  }

  async function creerBoutique(e: FormEvent) {
    e.preventDefault();
    setCreationEnCours(true);
    setErreur(null);
    try {
      await trpcMutation("admin.creerBoutique", {
        ...champs,
        commune: champs.commune || undefined,
        quartier: champs.quartier || undefined,
        adresse: champs.adresse || undefined,
        latitude: champs.latitude ? Number(champs.latitude) : undefined,
        longitude: champs.longitude ? Number(champs.longitude) : undefined,
        societeLivraisonId: champs.societeLivraisonId || undefined,
      });
      setModalOuvert(false);
      setChamps(CHAMPS_INITIAUX);
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur lors de la création");
    } finally {
      setCreationEnCours(false);
    }
  }

  function ouvrirEdition(b: Boutique) {
    setChampsEdition({
      nomBoutique: b.nomBoutique,
      pays: b.pays,
      ville: b.ville,
      commune: b.commune ?? "",
      quartier: b.quartier ?? "",
      adresse: b.adresse ?? "",
      latitude: b.latitude != null ? String(b.latitude) : "",
      longitude: b.longitude != null ? String(b.longitude) : "",
      rayonLivraisonKm: b.rayonLivraisonKm != null ? String(b.rayonLivraisonKm) : "",
      societeLivraisonId: b.societeLivraisonId ?? "",
    });
    setEditionOuverte(b);
  }

  async function enregistrerEdition(e: FormEvent) {
    e.preventDefault();
    if (!editionOuverte) return;
    setEditionEnCours(true);
    setErreur(null);
    try {
      await trpcMutation("admin.modifierBoutique", {
        boutiqueId: editionOuverte.id,
        nomBoutique: champsEdition.nomBoutique,
        pays: champsEdition.pays,
        ville: champsEdition.ville,
        commune: champsEdition.commune || undefined,
        quartier: champsEdition.quartier || undefined,
        adresse: champsEdition.adresse || undefined,
        latitude: champsEdition.latitude ? Number(champsEdition.latitude) : undefined,
        longitude: champsEdition.longitude ? Number(champsEdition.longitude) : undefined,
        rayonLivraisonKm: champsEdition.rayonLivraisonKm
          ? Number(champsEdition.rayonLivraisonKm)
          : undefined,
        // "" = détacher explicitement (→ null), une société sélectionnée = rattacher
        societeLivraisonId: champsEdition.societeLivraisonId || null,
      });
      setEditionOuverte(null);
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur lors de la modification");
    } finally {
      setEditionEnCours(false);
    }
  }

  function ouvrirStock(b: Boutique) {
    setStockOuvert(b);
    setStockChargement(true);
    setStockErreur(null);
    trpcQuery<StockLigne[]>("admin.stockDUneBoutique", { boutiqueId: b.id })
      .then(setStockItems)
      .catch((e) => setStockErreur(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setStockChargement(false));
  }

  async function majLigneStock(marqueGazId: string, quantiteDisponible: number, seuilAlerte?: number) {
    if (!stockOuvert) return;
    try {
      await trpcMutation("admin.majStock", {
        boutiqueId: stockOuvert.id,
        marqueGazId,
        quantiteDisponible,
        seuilAlerte,
      });
      setStockItems((items) =>
        items.map((it) =>
          it.marqueGazId === marqueGazId
            ? { ...it, quantiteDisponible, seuilAlerte: seuilAlerte ?? it.seuilAlerte }
            : it
        )
      );
    } catch (e) {
      setStockErreur(e instanceof Error ? e.message : "Erreur lors de la mise à jour du stock");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <PageHeader title="Boutiques" subtitle="Dépôts de gaz partenaires" />
        <button
          onClick={() => setModalOuvert(true)}
          className="rounded-md bg-steel-500 px-4 py-2 text-sm font-medium text-white hover:bg-steel-600"
        >
          + Ajouter une boutique
        </button>
      </div>

      {erreur && (
        <div className="mb-4 rounded-md bg-valve-400/10 px-4 py-3 text-sm text-valve-600">{erreur}</div>
      )}

      <Card>
        {chargement ? (
          <div className="p-6 text-sm text-ink/50">Chargement...</div>
        ) : boutiques.length === 0 ? (
          <div className="p-6 text-sm text-ink/50">Aucune boutique enregistrée.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink/40">
                <th className="px-4 py-3">Boutique</th>
                <th className="px-4 py-3">Localisation</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            {grouperParSociete(boutiques).map((groupe) => (
              <tbody key={groupe.label}>
                <tr className="bg-ink/[0.03]">
                  <td colSpan={4} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink/50">
                    {groupe.label} · {groupe.items.length} boutique{groupe.items.length !== 1 ? "s" : ""}
                  </td>
                </tr>
                {groupe.items.map((b) => (
                  <tr key={b.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{b.nomBoutique}</div>
                      <div className="font-data text-xs text-ink/50">
                        {b.gerantNom} · {b.gerantTelephone}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink/70">
                      {b.quartier ? `${b.quartier}, ` : ""}
                      {b.commune ? `${b.commune}, ` : ""}
                      {b.ville}
                    </td>
                    <td className="px-4 py-3">
                      <StatusGauge statut={b.statutValidation} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => ouvrirStock(b)}
                          className="rounded-md border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-ink/5"
                        >
                          Stock
                        </button>
                        <button
                          onClick={() => setDetailsOuverts(b)}
                          className="rounded-md border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-ink/5"
                        >
                          Détails
                        </button>
                        <button
                          onClick={() => ouvrirEdition(b)}
                          className="rounded-md border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-ink/5"
                        >
                          Modifier
                        </button>
                        <select
                          value={b.statutValidation}
                          disabled={actionEnCours === b.id}
                          onChange={(e) => changerStatut(b.id, e.target.value)}
                          className="rounded-md border border-ink/15 px-2 py-1.5 text-xs disabled:opacity-60"
                        >
                          {STATUTS.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
          </div>
        )}
      </Card>

      <Modal open={modalOuvert} onClose={() => setModalOuvert(false)} title="Nouvelle boutique">
        <form onSubmit={creerBoutique}>
          <FormField label="Nom du gérant">
            <input
              className={inputClass}
              value={champs.nom}
              onChange={(e) => setChamps({ ...champs, nom: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Téléphone (identifiant de connexion)">
            <input
              className={inputClass}
              value={champs.telephone}
              onChange={(e) => setChamps({ ...champs, telephone: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Code PIN (4 chiffres) — servira à la connexion">
            <input
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              className={`${inputClass} text-center tracking-[0.5em]`}
              value={champs.codePin}
              onChange={(e) =>
                setChamps({ ...champs, codePin: e.target.value.replace(/\D/g, "").slice(0, 4) })
              }
              required
            />
          </FormField>
          <FormField label="Nom de la boutique">
            <input
              className={inputClass}
              value={champs.nomBoutique}
              onChange={(e) => setChamps({ ...champs, nomBoutique: e.target.value })}
              required
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Pays">
              <input
                className={inputClass}
                value={champs.pays}
                onChange={(e) => setChamps({ ...champs, pays: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Ville">
              <input
                className={inputClass}
                value={champs.ville}
                onChange={(e) => setChamps({ ...champs, ville: e.target.value })}
                required
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Commune">
              <input
                className={inputClass}
                value={champs.commune}
                onChange={(e) => setChamps({ ...champs, commune: e.target.value })}
              />
            </FormField>
            <FormField label="Quartier">
              <input
                className={inputClass}
                placeholder="Angré, Riviera..."
                value={champs.quartier}
                onChange={(e) => setChamps({ ...champs, quartier: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Adresse précise (avec carte)">
            <AddressPicker
              valeur={champs.adresse}
              onChange={(a) =>
                setChamps({
                  ...champs,
                  adresse: a.adresse,
                  latitude: a.latitude ? String(a.latitude) : "",
                  longitude: a.longitude ? String(a.longitude) : "",
                })
              }
            />
          </FormField>
          <FormField label="Société de livraison (optionnel)">
            <select
              className={inputClass}
              value={champs.societeLivraisonId}
              onChange={(e) => setChamps({ ...champs, societeLivraisonId: e.target.value })}
            >
              <option value="">— Aucune (boutique indépendante) —</option>
              {societes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nomSociete}
                </option>
              ))}
            </select>
          </FormField>
          <button
            type="submit"
            disabled={creationEnCours}
            className="mt-2 w-full rounded-md bg-steel-500 py-2.5 text-sm font-medium text-white hover:bg-steel-600 disabled:opacity-60"
          >
            {creationEnCours ? "Création..." : "Créer la boutique (validée d'office)"}
          </button>
        </form>
      </Modal>

      {/* Stock */}
      <Modal
        open={stockOuvert !== null}
        onClose={() => setStockOuvert(null)}
        title={`Stock — ${stockOuvert?.nomBoutique ?? ""}`}
      >
        {stockErreur && (
          <div className="mb-4 rounded-md bg-valve-400/10 px-4 py-3 text-sm text-valve-600">{stockErreur}</div>
        )}
        {stockChargement ? (
          <div className="py-6 text-sm text-ink/50">Chargement...</div>
        ) : (
          <div className="space-y-3">
            {stockItems.map((s) => (
              <div key={s.marqueGazId} className="flex items-center justify-between border-b border-ink/5 py-2">
                <div>
                  <div className="text-sm font-medium text-ink">
                    {s.marqueNom} — {s.marqueTaille}
                  </div>
                  <div className="text-xs text-ink/40">Seuil d'alerte : {s.seuilAlerte}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <label className="block text-[10px] uppercase text-ink/40">Quantité</label>
                    <input
                      type="number"
                      min={0}
                      defaultValue={s.quantiteDisponible}
                      onBlur={(e) => majLigneStock(s.marqueGazId, Number(e.target.value), s.seuilAlerte)}
                      className="w-20 rounded-md border border-ink/15 px-2 py-1.5 text-right text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-ink/40">Seuil</label>
                    <input
                      type="number"
                      min={0}
                      defaultValue={s.seuilAlerte}
                      onBlur={(e) =>
                        majLigneStock(s.marqueGazId, s.quantiteDisponible, Number(e.target.value))
                      }
                      className="w-16 rounded-md border border-ink/15 px-2 py-1.5 text-right text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
            {stockItems.length === 0 && (
              <p className="text-sm text-ink/40">Aucune marque active dans le référentiel.</p>
            )}
            <p className="pt-2 text-xs text-ink/40">
              Ces quantités s'ajoutent à celles des autres boutiques pour former le total
              affiché sur le site vitrine, par marque.
            </p>
          </div>
        )}
      </Modal>

      {/* Détails (lecture seule) */}
      <Modal
        open={detailsOuverts !== null}
        onClose={() => setDetailsOuverts(null)}
        title={detailsOuverts?.nomBoutique ?? "Détails"}
      >
        {detailsOuverts && (
          <div>
            <LigneDetail label="Gérant" valeur={detailsOuverts.gerantNom} />
            <LigneDetail label="Téléphone" valeur={detailsOuverts.gerantTelephone} />
            <LigneDetail label="Société de livraison" valeur={detailsOuverts.nomSociete ?? "Indépendante"} />
            <LigneDetail label="Pays" valeur={detailsOuverts.pays} />
            <LigneDetail label="Ville" valeur={detailsOuverts.ville} />
            <LigneDetail label="Commune" valeur={detailsOuverts.commune ?? ""} />
            <LigneDetail label="Quartier" valeur={detailsOuverts.quartier ?? ""} />
            <LigneDetail label="Adresse" valeur={detailsOuverts.adresse ?? ""} />
            <LigneDetail
              label="Position GPS"
              valeur={
                detailsOuverts.latitude != null
                  ? `${detailsOuverts.latitude}, ${detailsOuverts.longitude}`
                  : ""
              }
            />
            <LigneDetail
              label="Rayon de livraison"
              valeur={detailsOuverts.rayonLivraisonKm != null ? `${detailsOuverts.rayonLivraisonKm} km` : ""}
            />
            <LigneDetail
              label="Inscrite le"
              valeur={new Date(detailsOuverts.createdAt).toLocaleDateString("fr-FR")}
            />
          </div>
        )}
      </Modal>

      <Modal
        open={editionOuverte !== null}
        onClose={() => setEditionOuverte(null)}
        title={`Modifier — ${editionOuverte?.nomBoutique ?? ""}`}
      >
        <form onSubmit={enregistrerEdition}>
          <FormField label="Nom de la boutique">
            <input
              className={inputClass}
              value={champsEdition.nomBoutique}
              onChange={(e) => setChampsEdition({ ...champsEdition, nomBoutique: e.target.value })}
              required
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Pays">
              <input
                className={inputClass}
                value={champsEdition.pays}
                onChange={(e) => setChampsEdition({ ...champsEdition, pays: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Ville">
              <input
                className={inputClass}
                value={champsEdition.ville}
                onChange={(e) => setChampsEdition({ ...champsEdition, ville: e.target.value })}
                required
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Commune">
              <input
                className={inputClass}
                value={champsEdition.commune}
                onChange={(e) => setChampsEdition({ ...champsEdition, commune: e.target.value })}
              />
            </FormField>
            <FormField label="Quartier">
              <input
                className={inputClass}
                value={champsEdition.quartier}
                onChange={(e) => setChampsEdition({ ...champsEdition, quartier: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Adresse précise (avec carte)">
            <AddressPicker
              valeur={champsEdition.adresse}
              onChange={(a) =>
                setChampsEdition({
                  ...champsEdition,
                  adresse: a.adresse,
                  latitude: a.latitude ? String(a.latitude) : "",
                  longitude: a.longitude ? String(a.longitude) : "",
                })
              }
            />
          </FormField>
          <FormField label="Rayon de livraison (km)">
            <input
              type="number"
              step="any"
              className={inputClass}
              value={champsEdition.rayonLivraisonKm}
              onChange={(e) =>
                setChampsEdition({ ...champsEdition, rayonLivraisonKm: e.target.value })
              }
            />
          </FormField>
          <FormField label="Société de livraison (optionnel)">
            <select
              className={inputClass}
              value={champsEdition.societeLivraisonId}
              onChange={(e) => setChampsEdition({ ...champsEdition, societeLivraisonId: e.target.value })}
            >
              <option value="">— Aucune (boutique indépendante) —</option>
              {societes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nomSociete}
                </option>
              ))}
            </select>
          </FormField>
          <button
            type="submit"
            disabled={editionEnCours}
            className="mt-2 w-full rounded-md bg-steel-500 py-2.5 text-sm font-medium text-white hover:bg-steel-600 disabled:opacity-60"
          >
            {editionEnCours ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
