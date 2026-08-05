import { useEffect, useState, useCallback, FormEvent } from "react";
import { trpcQuery, trpcMutation } from "../lib/api";
import { Card, PageHeader } from "../components/Card";
import { StatusGauge } from "../components/StatusGauge";
import { Modal, FormField, inputClass } from "../components/Modal";
import { AddressPicker } from "../components/AddressPicker";

interface Ramasseur {
  id: string;
  nom: string;
  telephone: string;
  type: string;
  nomSociete: string | null;
  zonesCouvertes: string[];
  vehicule: string | null;
  pays: string;
  ville: string | null;
  commune: string | null;
  quartier: string | null;
  latitude: number | null;
  longitude: number | null;
  credits: number;
  statutValidation: string;
  nombreRamassages: number;
  createdAt: string;
}

const CHAMPS_INITIAUX = {
  nom: "",
  telephone: "",
  codePin: "",
  pays: "Côte d'Ivoire",
  ville: "Abidjan",
  commune: "",
  quartier: "",
  latitude: "",
  longitude: "",
  type: "particulier" as "particulier" | "societe",
  nomSociete: "",
  zonesCouvertes: "",
  vehicule: "",
};

const CHAMPS_EDITION_INITIAUX = {
  type: "particulier" as "particulier" | "societe",
  nomSociete: "",
  zonesCouvertes: "",
  vehicule: "",
  pays: "",
  ville: "",
  commune: "",
  quartier: "",
  latitude: "",
  longitude: "",
};

const STATUTS: { value: string; label: string }[] = [
  { value: "en_attente", label: "En attente" },
  { value: "valide", label: "Validé" },
  { value: "rejete", label: "Rejeté" },
  { value: "suspendu", label: "Suspendu (désactivé)" },
];

function LigneDetail({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="flex justify-between border-b border-ink/5 py-2 text-sm last:border-0">
      <span className="text-ink/50">{label}</span>
      <span className="text-right font-medium text-ink">{valeur || "—"}</span>
    </div>
  );
}

export function Ramasseurs() {
  const [ramasseurs, setRamasseurs] = useState<Ramasseur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [champs, setChamps] = useState(CHAMPS_INITIAUX);
  const [adresseAffichage, setAdresseAffichage] = useState("");
  const [creationEnCours, setCreationEnCours] = useState(false);

  const [detailsOuverts, setDetailsOuverts] = useState<Ramasseur | null>(null);
  const [editionOuverte, setEditionOuverte] = useState<Ramasseur | null>(null);
  const [champsEdition, setChampsEdition] = useState(CHAMPS_EDITION_INITIAUX);
  const [adresseEdition, setAdresseEdition] = useState("");
  const [editionEnCours, setEditionEnCours] = useState(false);

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

  async function changerStatut(id: string, statut: string) {
    setActionEnCours(id);
    try {
      await trpcMutation("admin.changerStatutRamasseur", { ramasseurId: id, statut });
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionEnCours(null);
    }
  }

  async function creerRamasseur(e: FormEvent) {
    e.preventDefault();
    setCreationEnCours(true);
    setErreur(null);
    try {
      await trpcMutation("admin.creerRamasseur", {
        nom: champs.nom,
        telephone: champs.telephone,
        codePin: champs.codePin,
        pays: champs.pays,
        ville: champs.ville,
        commune: champs.commune || undefined,
        quartier: champs.quartier || undefined,
        latitude: champs.latitude ? Number(champs.latitude) : undefined,
        longitude: champs.longitude ? Number(champs.longitude) : undefined,
        type: champs.type,
        nomSociete: champs.nomSociete || undefined,
        zonesCouvertes: champs.zonesCouvertes.split(",").map((z) => z.trim()).filter(Boolean),
        vehicule: champs.vehicule || undefined,
      });
      setModalOuvert(false);
      setChamps(CHAMPS_INITIAUX);
      setAdresseAffichage("");
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur lors de la création");
    } finally {
      setCreationEnCours(false);
    }
  }

  function ouvrirEdition(r: Ramasseur) {
    setChampsEdition({
      type: r.type as "particulier" | "societe",
      nomSociete: r.nomSociete ?? "",
      zonesCouvertes: r.zonesCouvertes.join(", "),
      vehicule: r.vehicule ?? "",
      pays: r.pays,
      ville: r.ville ?? "",
      commune: r.commune ?? "",
      quartier: r.quartier ?? "",
      latitude: r.latitude != null ? String(r.latitude) : "",
      longitude: r.longitude != null ? String(r.longitude) : "",
    });
    setAdresseEdition(r.quartier ?? r.ville ?? "");
    setEditionOuverte(r);
  }

  async function enregistrerEdition(e: FormEvent) {
    e.preventDefault();
    if (!editionOuverte) return;
    setEditionEnCours(true);
    setErreur(null);
    try {
      await trpcMutation("admin.modifierRamasseur", {
        ramasseurId: editionOuverte.id,
        type: champsEdition.type,
        nomSociete: champsEdition.nomSociete || undefined,
        zonesCouvertes: champsEdition.zonesCouvertes
          .split(",")
          .map((z) => z.trim())
          .filter(Boolean),
        vehicule: champsEdition.vehicule || undefined,
        pays: champsEdition.pays,
        ville: champsEdition.ville,
        commune: champsEdition.commune || undefined,
        quartier: champsEdition.quartier || undefined,
        latitude: champsEdition.latitude ? Number(champsEdition.latitude) : undefined,
        longitude: champsEdition.longitude ? Number(champsEdition.longitude) : undefined,
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
        <PageHeader title="Ramasseurs" subtitle="Particuliers et sociétés de ramassage" />
        <button
          onClick={() => setModalOuvert(true)}
          className="rounded-md bg-steel-500 px-4 py-2 text-sm font-medium text-white hover:bg-steel-600"
        >
          + Ajouter un ramasseur
        </button>
      </div>

      {erreur && (
        <div className="mb-4 rounded-md bg-valve-400/10 px-4 py-3 text-sm text-valve-600">{erreur}</div>
      )}

      <Card>
        {chargement ? (
          <div className="p-6 text-sm text-ink/50">Chargement...</div>
        ) : ramasseurs.length === 0 ? (
          <div className="p-6 text-sm text-ink/50">Aucun ramasseur enregistré.</div>
        ) : (
          <div className="overflow-x-auto">
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDetailsOuverts(r)}
                          className="rounded-md border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-ink/5"
                        >
                          Détails
                        </button>
                        <button
                          onClick={() => ouvrirEdition(r)}
                          className="rounded-md border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-ink/5"
                        >
                          Modifier
                        </button>
                        <select
                          value={r.statutValidation}
                          disabled={actionEnCours === r.id}
                          onChange={(e) => changerStatut(r.id, e.target.value)}
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

      {/* Création */}
      <Modal open={modalOuvert} onClose={() => setModalOuvert(false)} title="Nouveau ramasseur">
        <form onSubmit={creerRamasseur}>
          <FormField label="Nom">
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
          <FormField label="Position (avec carte)">
            <AddressPicker
              valeur={adresseAffichage}
              onChange={(a) => {
                setAdresseAffichage(a.adresse);
                setChamps({
                  ...champs,
                  latitude: a.latitude ? String(a.latitude) : "",
                  longitude: a.longitude ? String(a.longitude) : "",
                });
              }}
            />
          </FormField>
          <FormField label="Type">
            <select
              className={inputClass}
              value={champs.type}
              onChange={(e) => setChamps({ ...champs, type: e.target.value as "particulier" | "societe" })}
            >
              <option value="particulier">Particulier</option>
              <option value="societe">Société</option>
            </select>
          </FormField>
          {champs.type === "societe" && (
            <FormField label="Nom de la société">
              <input
                className={inputClass}
                value={champs.nomSociete}
                onChange={(e) => setChamps({ ...champs, nomSociete: e.target.value })}
              />
            </FormField>
          )}
          <FormField label="Zones couvertes (séparées par des virgules)">
            <input
              className={inputClass}
              placeholder="Cocody, Marcory, Yopougon"
              value={champs.zonesCouvertes}
              onChange={(e) => setChamps({ ...champs, zonesCouvertes: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Véhicule">
            <input
              className={inputClass}
              placeholder="camion, tricycle..."
              value={champs.vehicule}
              onChange={(e) => setChamps({ ...champs, vehicule: e.target.value })}
            />
          </FormField>

          <button
            type="submit"
            disabled={creationEnCours}
            className="mt-2 w-full rounded-md bg-steel-500 py-2.5 text-sm font-medium text-white hover:bg-steel-600 disabled:opacity-60"
          >
            {creationEnCours ? "Création..." : "Créer le ramasseur (validé d'office)"}
          </button>
        </form>
      </Modal>

      {/* Détails (lecture seule) */}
      <Modal
        open={detailsOuverts !== null}
        onClose={() => setDetailsOuverts(null)}
        title={detailsOuverts?.nomSociete || detailsOuverts?.nom || "Détails"}
      >
        {detailsOuverts && (
          <div>
            <LigneDetail label="Nom du responsable" valeur={detailsOuverts.nom} />
            <LigneDetail label="Téléphone" valeur={detailsOuverts.telephone} />
            <LigneDetail
              label="Type"
              valeur={detailsOuverts.type === "societe" ? "Société" : "Particulier"}
            />
            {detailsOuverts.nomSociete && (
              <LigneDetail label="Nom de la société" valeur={detailsOuverts.nomSociete} />
            )}
            <LigneDetail label="Véhicule" valeur={detailsOuverts.vehicule ?? ""} />
            <LigneDetail label="Zones couvertes" valeur={detailsOuverts.zonesCouvertes.join(", ")} />
            <LigneDetail label="Pays" valeur={detailsOuverts.pays} />
            <LigneDetail label="Ville" valeur={detailsOuverts.ville ?? ""} />
            <LigneDetail label="Commune" valeur={detailsOuverts.commune ?? ""} />
            <LigneDetail label="Quartier" valeur={detailsOuverts.quartier ?? ""} />
            <LigneDetail
              label="Position GPS"
              valeur={
                detailsOuverts.latitude != null
                  ? `${detailsOuverts.latitude}, ${detailsOuverts.longitude}`
                  : ""
              }
            />
            <LigneDetail label="Ramassages effectués" valeur={String(detailsOuverts.nombreRamassages)} />
            <LigneDetail label="Solde de crédits" valeur={`${detailsOuverts.credits} crédit(s)`} />
            <LigneDetail
              label="Inscrit le"
              valeur={new Date(detailsOuverts.createdAt).toLocaleDateString("fr-FR")}
            />
          </div>
        )}
      </Modal>

      {/* Édition */}
      <Modal
        open={editionOuverte !== null}
        onClose={() => setEditionOuverte(null)}
        title={`Modifier — ${editionOuverte?.nomSociete || editionOuverte?.nom || ""}`}
      >
        <form onSubmit={enregistrerEdition}>
          <FormField label="Type">
            <select
              className={inputClass}
              value={champsEdition.type}
              onChange={(e) =>
                setChampsEdition({ ...champsEdition, type: e.target.value as "particulier" | "societe" })
              }
            >
              <option value="particulier">Particulier</option>
              <option value="societe">Société</option>
            </select>
          </FormField>
          {champsEdition.type === "societe" && (
            <FormField label="Nom de la société">
              <input
                className={inputClass}
                value={champsEdition.nomSociete}
                onChange={(e) => setChampsEdition({ ...champsEdition, nomSociete: e.target.value })}
              />
            </FormField>
          )}
          <FormField label="Zones couvertes (séparées par des virgules)">
            <input
              className={inputClass}
              value={champsEdition.zonesCouvertes}
              onChange={(e) => setChampsEdition({ ...champsEdition, zonesCouvertes: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Véhicule">
            <input
              className={inputClass}
              value={champsEdition.vehicule}
              onChange={(e) => setChampsEdition({ ...champsEdition, vehicule: e.target.value })}
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
          <FormField label="Position (avec carte)">
            <AddressPicker
              valeur={adresseEdition}
              onChange={(a) => {
                setAdresseEdition(a.adresse);
                setChampsEdition({
                  ...champsEdition,
                  latitude: a.latitude ? String(a.latitude) : "",
                  longitude: a.longitude ? String(a.longitude) : "",
                });
              }}
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
