import { useEffect, useState, useCallback, FormEvent } from "react";
import { trpcQuery, trpcMutation } from "../lib/api";
import { Card, PageHeader } from "../components/Card";
import { StatusGauge } from "../components/StatusGauge";
import { Modal, FormField, inputClass } from "../components/Modal";

interface Livreur {
  id: string;
  nom: string;
  telephone: string;
  vehicule: string | null;
  zonesCouvertes: string[];
  statutValidation: string;
  nombreLivraisons: number;
}

const CHAMPS_INITIAUX = {
  nom: "",
  telephone: "",
  motDePasse: "",
  ville: "Abidjan",
  vehicule: "",
  zonesCouvertes: "",
};

export function Livreurs() {
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [champs, setChamps] = useState(CHAMPS_INITIAUX);
  const [creationEnCours, setCreationEnCours] = useState(false);

  const charger = useCallback(() => {
    setChargement(true);
    trpcQuery<Livreur[]>("admin.listLivreurs")
      .then(setLivreurs)
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  async function valider(id: string, approuver: boolean) {
    setActionEnCours(id);
    try {
      await trpcMutation("admin.validerLivreur", { livreurId: id, approuver });
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionEnCours(null);
    }
  }

  async function creerLivreur(e: FormEvent) {
    e.preventDefault();
    setCreationEnCours(true);
    setErreur(null);
    try {
      await trpcMutation("admin.creerLivreur", {
        nom: champs.nom,
        telephone: champs.telephone,
        motDePasse: champs.motDePasse,
        ville: champs.ville,
        vehicule: champs.vehicule || undefined,
        zonesCouvertes: champs.zonesCouvertes.split(",").map((z) => z.trim()).filter(Boolean),
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
        <PageHeader title="Livreurs" subtitle="Livreurs de bouteilles de gaz" />
        <button
          onClick={() => setModalOuvert(true)}
          className="rounded-md bg-steel-500 px-4 py-2 text-sm font-medium text-white hover:bg-steel-600"
        >
          + Ajouter un livreur
        </button>
      </div>

      {erreur && (
        <div className="mb-4 rounded-md bg-valve-400/10 px-4 py-3 text-sm text-valve-600">{erreur}</div>
      )}

      <Card>
        {chargement ? (
          <div className="p-6 text-sm text-ink/50">Chargement...</div>
        ) : livreurs.length === 0 ? (
          <div className="p-6 text-sm text-ink/50">Aucun livreur enregistré.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink/40">
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Véhicule</th>
                <th className="px-4 py-3">Zones</th>
                <th className="px-4 py-3">Livraisons</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {livreurs.map((l) => (
                <tr key={l.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{l.nom}</div>
                    <div className="font-data text-xs text-ink/50">{l.telephone}</div>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{l.vehicule ?? "—"}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-ink/70">
                    {l.zonesCouvertes.join(", ")}
                  </td>
                  <td className="px-4 py-3 font-data">{l.nombreLivraisons}</td>
                  <td className="px-4 py-3">
                    <StatusGauge statut={l.statutValidation} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {l.statutValidation === "en_attente" && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => valider(l.id, true)}
                          disabled={actionEnCours === l.id}
                          className="rounded-md bg-gaz-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-gaz-600 disabled:opacity-60"
                        >
                          Valider
                        </button>
                        <button
                          onClick={() => valider(l.id, false)}
                          disabled={actionEnCours === l.id}
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

      <Modal open={modalOuvert} onClose={() => setModalOuvert(false)} title="Nouveau livreur">
        <form onSubmit={creerLivreur}>
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
          <FormField label="Ville">
            <input
              className={inputClass}
              value={champs.ville}
              onChange={(e) => setChamps({ ...champs, ville: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Véhicule">
            <input
              className={inputClass}
              placeholder="moto, tricycle..."
              value={champs.vehicule}
              onChange={(e) => setChamps({ ...champs, vehicule: e.target.value })}
            />
          </FormField>
          <FormField label="Zones couvertes (séparées par des virgules)">
            <input
              className={inputClass}
              placeholder="Cocody, Marcory, Yopougon"
              value={champs.zonesCouvertes}
              onChange={(e) => setChamps({ ...champs, zonesCouvertes: e.target.value })}
              required
            />
          </FormField>

          <button
            type="submit"
            disabled={creationEnCours}
            className="mt-2 w-full rounded-md bg-steel-500 py-2.5 text-sm font-medium text-white hover:bg-steel-600 disabled:opacity-60"
          >
            {creationEnCours ? "Création..." : "Créer le livreur (validé d'office)"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
