import { useEffect, useState, useCallback, FormEvent } from "react";
import { trpcQuery, trpcMutation } from "../lib/api";
import { Card, PageHeader } from "../components/Card";
import { StatusGauge } from "../components/StatusGauge";
import { Modal, FormField, inputClass } from "../components/Modal";

interface Boutique {
  id: string;
  nomBoutique: string;
  ville: string;
  commune: string | null;
  adresse: string | null;
  statutValidation: string;
}

const CHAMPS_INITIAUX = {
  nom: "",
  telephone: "",
  motDePasse: "",
  nomBoutique: "",
  ville: "Abidjan",
  commune: "",
  adresse: "",
};

export function Boutiques() {
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [champs, setChamps] = useState(CHAMPS_INITIAUX);
  const [creationEnCours, setCreationEnCours] = useState(false);

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

  async function creerBoutique(e: FormEvent) {
    e.preventDefault();
    setCreationEnCours(true);
    setErreur(null);
    try {
      await trpcMutation("admin.creerBoutique", {
        ...champs,
        commune: champs.commune || undefined,
        adresse: champs.adresse || undefined,
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
          <FormField label="Mot de passe">
            <input
              type="password"
              className={inputClass}
              value={champs.motDePasse}
              onChange={(e) => setChamps({ ...champs, motDePasse: e.target.value })}
              required
              minLength={6}
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
            <FormField label="Ville">
              <input
                className={inputClass}
                value={champs.ville}
                onChange={(e) => setChamps({ ...champs, ville: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Commune">
              <input
                className={inputClass}
                value={champs.commune}
                onChange={(e) => setChamps({ ...champs, commune: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Adresse">
            <input
              className={inputClass}
              value={champs.adresse}
              onChange={(e) => setChamps({ ...champs, adresse: e.target.value })}
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
    </div>
  );
}
