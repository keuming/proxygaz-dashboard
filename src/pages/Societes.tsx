import { useEffect, useState, useCallback, FormEvent } from "react";
import { trpcQuery, trpcMutation } from "../lib/api";
import { Card, PageHeader } from "../components/Card";
import { StatusGauge } from "../components/StatusGauge";
import { Modal, FormField, inputClass } from "../components/Modal";
import { AddressPicker } from "../components/AddressPicker";

interface Societe {
  id: string;
  nomSociete: string;
  pays: string;
  ville: string | null;
  commune: string | null;
  quartier: string | null;
  latitude: number | null;
  longitude: number | null;
  statutValidation: string;
  credits: number;
  gerantNom: string;
  gerantTelephone: string;
  nombreLivreurs: number;
  nombreBoutiques: number;
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
  nomSociete: "",
  pays: "Côte d'Ivoire",
  ville: "Abidjan",
  commune: "",
  quartier: "",
  latitude: "",
  longitude: "",
};

const CHAMPS_EDITION_INITIAUX = {
  nomSociete: "",
  pays: "",
  ville: "",
  commune: "",
  quartier: "",
  latitude: "",
  longitude: "",
};

const STATUTS: { value: string; label: string }[] = [
  { value: "en_attente", label: "En attente" },
  { value: "valide", label: "Validée" },
  { value: "rejete", label: "Rejetée" },
  { value: "suspendu", label: "Suspendue (désactivée)" },
];

export function Societes() {
  const [societes, setSocietes] = useState<Societe[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [champs, setChamps] = useState(CHAMPS_INITIAUX);
  const [adresseAffichage, setAdresseAffichage] = useState("");
  const [creationEnCours, setCreationEnCours] = useState(false);

  const [detailsOuverts, setDetailsOuverts] = useState<Societe | null>(null);
  const [editionOuverte, setEditionOuverte] = useState<Societe | null>(null);
  const [champsEdition, setChampsEdition] = useState(CHAMPS_EDITION_INITIAUX);
  const [adresseEdition, setAdresseEdition] = useState("");
  const [editionEnCours, setEditionEnCours] = useState(false);

  const charger = useCallback(() => {
    setChargement(true);
    trpcQuery<Societe[]>("admin.listSocietesLivraison")
      .then(setSocietes)
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  async function changerStatut(id: string, statut: string) {
    setActionEnCours(id);
    try {
      await trpcMutation("admin.changerStatutSocieteLivraison", { societeId: id, statut });
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionEnCours(null);
    }
  }

  async function creerSociete(e: FormEvent) {
    e.preventDefault();
    setCreationEnCours(true);
    setErreur(null);
    try {
      await trpcMutation("admin.creerSocieteLivraison", {
        nom: champs.nom,
        telephone: champs.telephone,
        codePin: champs.codePin,
        nomSociete: champs.nomSociete,
        pays: champs.pays,
        ville: champs.ville,
        commune: champs.commune || undefined,
        quartier: champs.quartier || undefined,
        latitude: champs.latitude ? Number(champs.latitude) : undefined,
        longitude: champs.longitude ? Number(champs.longitude) : undefined,
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

  function ouvrirEdition(s: Societe) {
    setChampsEdition({
      nomSociete: s.nomSociete,
      pays: s.pays,
      ville: s.ville ?? "",
      commune: s.commune ?? "",
      quartier: s.quartier ?? "",
      latitude: s.latitude != null ? String(s.latitude) : "",
      longitude: s.longitude != null ? String(s.longitude) : "",
    });
    setAdresseEdition(s.quartier ?? s.ville ?? "");
    setEditionOuverte(s);
  }

  async function enregistrerEdition(e: FormEvent) {
    e.preventDefault();
    if (!editionOuverte) return;
    setEditionEnCours(true);
    setErreur(null);
    try {
      await trpcMutation("admin.modifierSocieteLivraison", {
        societeId: editionOuverte.id,
        nomSociete: champsEdition.nomSociete,
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
        <PageHeader title="Sociétés de livraison" subtitle="Entreprises regroupant plusieurs livreurs et boutiques" />
        <button
          onClick={() => setModalOuvert(true)}
          className="rounded-md bg-steel-500 px-4 py-2 text-sm font-medium text-white hover:bg-steel-600"
        >
          + Ajouter une société
        </button>
      </div>

      {erreur && (
        <div className="mb-4 rounded-md bg-valve-400/10 px-4 py-3 text-sm text-valve-600">{erreur}</div>
      )}

      <Card>
        {chargement ? (
          <div className="p-6 text-sm text-ink/50">Chargement...</div>
        ) : societes.length === 0 ? (
          <div className="p-6 text-sm text-ink/50">Aucune société enregistrée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink/40">
                  <th className="px-4 py-3">Société</th>
                  <th className="px-4 py-3">Localisation</th>
                  <th className="px-4 py-3">Livreurs</th>
                  <th className="px-4 py-3">Boutiques</th>
                  <th className="px-4 py-3">Pot commun</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {societes.map((s) => (
                  <tr key={s.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.nomSociete}</div>
                      <div className="font-data text-xs text-ink/50">
                        {s.gerantNom} · {s.gerantTelephone}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink/70">
                      {s.quartier ? `${s.quartier}, ` : ""}
                      {s.commune ? `${s.commune}, ` : ""}
                      {s.ville ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-data">{s.nombreLivreurs}</td>
                    <td className="px-4 py-3 font-data">{s.nombreBoutiques}</td>
                    <td className="px-4 py-3 font-data">
                      {s.credits} crédit{s.credits !== 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-3">
                      <StatusGauge statut={s.statutValidation} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDetailsOuverts(s)}
                          className="rounded-md border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-ink/5"
                        >
                          Détails
                        </button>
                        <button
                          onClick={() => ouvrirEdition(s)}
                          className="rounded-md border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-ink/5"
                        >
                          Modifier
                        </button>
                        <select
                          value={s.statutValidation}
                          disabled={actionEnCours === s.id}
                          onChange={(e) => changerStatut(s.id, e.target.value)}
                          className="rounded-md border border-ink/15 px-2 py-1.5 text-xs disabled:opacity-60"
                        >
                          {STATUTS.map((st) => (
                            <option key={st.value} value={st.value}>
                              {st.label}
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
      <Modal open={modalOuvert} onClose={() => setModalOuvert(false)} title="Nouvelle société de livraison">
        <form onSubmit={creerSociete}>
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
          <FormField label="Nom de la société">
            <input
              className={inputClass}
              value={champs.nomSociete}
              onChange={(e) => setChamps({ ...champs, nomSociete: e.target.value })}
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

          <button
            type="submit"
            disabled={creationEnCours}
            className="mt-2 w-full rounded-md bg-steel-500 py-2.5 text-sm font-medium text-white hover:bg-steel-600 disabled:opacity-60"
          >
            {creationEnCours ? "Création..." : "Créer la société (validée d'office)"}
          </button>
        </form>
      </Modal>

      {/* Détails (lecture seule) */}
      <Modal
        open={detailsOuverts !== null}
        onClose={() => setDetailsOuverts(null)}
        title={detailsOuverts?.nomSociete || "Détails"}
      >
        {detailsOuverts && (
          <div>
            <LigneDetail label="Nom de la société" valeur={detailsOuverts.nomSociete} />
            <LigneDetail label="Gérant" valeur={detailsOuverts.gerantNom} />
            <LigneDetail label="Téléphone" valeur={detailsOuverts.gerantTelephone} />
            <LigneDetail label="Pays" valeur={detailsOuverts.pays} />
            <LigneDetail label="Ville" valeur={detailsOuverts.ville ?? ""} />
            <LigneDetail label="Commune" valeur={detailsOuverts.commune ?? ""} />
            <LigneDetail label="Quartier" valeur={detailsOuverts.quartier ?? ""} />
            <LigneDetail label="Livreurs rattachés" valeur={String(detailsOuverts.nombreLivreurs)} />
            <LigneDetail label="Boutiques rattachées" valeur={String(detailsOuverts.nombreBoutiques)} />
            <LigneDetail label="Pot de crédit commun" valeur={`${detailsOuverts.credits} crédit(s)`} />
            <LigneDetail
              label="Inscrite le"
              valeur={new Date(detailsOuverts.createdAt).toLocaleDateString("fr-FR")}
            />
          </div>
        )}
      </Modal>

      {/* Édition */}
      <Modal
        open={editionOuverte !== null}
        onClose={() => setEditionOuverte(null)}
        title={`Modifier — ${editionOuverte?.nomSociete ?? ""}`}
      >
        <form onSubmit={enregistrerEdition}>
          <FormField label="Nom de la société">
            <input
              className={inputClass}
              value={champsEdition.nomSociete}
              onChange={(e) => setChampsEdition({ ...champsEdition, nomSociete: e.target.value })}
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
