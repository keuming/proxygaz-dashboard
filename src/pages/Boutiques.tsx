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
}

function LigneDetail({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="flex justify-between border-b border-ink/5 py-2 text-sm last:border-0">
      <span className="text-ink/50">{label}</span>
      <span className="text-right font-medium text-ink">{valeur || "—"}</span>
    </div>
  );
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
};

const STATUTS: { value: string; label: string }[] = [
  { value: "en_attente", label: "En attente" },
  { value: "valide", label: "Validée" },
  { value: "rejete", label: "Rejetée" },
  { value: "suspendu", label: "Suspendue (désactivée)" },
];

export function Boutiques() {
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
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
      });
      setEditionOuverte(null);
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur lors de la modification");
    } finally {
      setEditionEnCours(false);
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
            <tbody>
              {boutiques.map((b) => (
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
          <button
            type="submit"
            disabled={creationEnCours}
            className="mt-2 w-full rounded-md bg-steel-500 py-2.5 text-sm font-medium text-white hover:bg-steel-600 disabled:opacity-60"
          >
            {creationEnCours ? "Création..." : "Créer la boutique (validée d'office)"}
          </button>
        </form>
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
