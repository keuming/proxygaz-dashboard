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
  statutValidation: string;
  nombreRamassages: number;
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

export function Ramasseurs() {
  const [ramasseurs, setRamasseurs] = useState<Ramasseur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [champs, setChamps] = useState(CHAMPS_INITIAUX);
  const [adresseAffichage, setAdresseAffichage] = useState("");
  const [creationEnCours, setCreationEnCours] = useState(false);

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
    </div>
  );
}
