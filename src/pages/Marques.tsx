import { useEffect, useState, useCallback, FormEvent } from "react";
import { trpcQuery, trpcMutation } from "../lib/api";
import { Card, PageHeader } from "../components/Card";
import { Modal, FormField, inputClass } from "../components/Modal";

interface Marque {
  id: string;
  nom: string;
  taille: string;
  prixRecharge: string;
  prixConsigne: string | null;
  actif: boolean;
}

const CHAMPS_INITIAUX = {
  nom: "",
  taille: "",
  prixRecharge: "",
  prixConsigne: "",
};

const CHAMPS_EDITION_INITIAUX = {
  nom: "",
  taille: "",
  prixRecharge: "",
  prixConsigne: "",
};

export function Marques() {
  const [marques, setMarques] = useState<Marque[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);

  const [modalOuvert, setModalOuvert] = useState(false);
  const [champs, setChamps] = useState(CHAMPS_INITIAUX);
  const [creationEnCours, setCreationEnCours] = useState(false);

  const [editionOuverte, setEditionOuverte] = useState<Marque | null>(null);
  const [champsEdition, setChampsEdition] = useState(CHAMPS_EDITION_INITIAUX);
  const [editionEnCours, setEditionEnCours] = useState(false);

  const charger = useCallback(() => {
    setChargement(true);
    trpcQuery<Marque[]>("admin.listMarquesGaz")
      .then(setMarques)
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  async function creerMarque(e: FormEvent) {
    e.preventDefault();
    setCreationEnCours(true);
    setErreur(null);
    try {
      await trpcMutation("admin.creerMarqueGaz", {
        nom: champs.nom,
        taille: champs.taille,
        prixRecharge: Number(champs.prixRecharge),
        prixConsigne: champs.prixConsigne ? Number(champs.prixConsigne) : undefined,
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

  function ouvrirEdition(m: Marque) {
    setChampsEdition({
      nom: m.nom,
      taille: m.taille,
      prixRecharge: m.prixRecharge,
      prixConsigne: m.prixConsigne ?? "",
    });
    setEditionOuverte(m);
  }

  async function enregistrerEdition(e: FormEvent) {
    e.preventDefault();
    if (!editionOuverte) return;
    setEditionEnCours(true);
    setErreur(null);
    try {
      await trpcMutation("admin.modifierMarqueGaz", {
        marqueId: editionOuverte.id,
        nom: champsEdition.nom,
        taille: champsEdition.taille,
        prixRecharge: Number(champsEdition.prixRecharge),
        prixConsigne: champsEdition.prixConsigne ? Number(champsEdition.prixConsigne) : undefined,
      });
      setEditionOuverte(null);
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur lors de la modification");
    } finally {
      setEditionEnCours(false);
    }
  }

  async function basculerActif(m: Marque) {
    setActionEnCours(m.id);
    try {
      await trpcMutation("admin.modifierMarqueGaz", { marqueId: m.id, actif: !m.actif });
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setActionEnCours(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <PageHeader
          title="Marques de gaz"
          subtitle="Référentiel central des types de bouteilles et de leur prix homologué"
        />
        <button
          onClick={() => setModalOuvert(true)}
          className="rounded-md bg-steel-500 px-4 py-2 text-sm font-medium text-white hover:bg-steel-600"
        >
          + Ajouter une marque
        </button>
      </div>

      <p className="mb-4 text-xs text-ink/40">
        Ce référentiel est la seule source du type de bouteille et du prix affichés sur le
        site vitrine. Les boutiques ne peuvent jamais créer ni modifier une marque ou son
        prix — elles gèrent uniquement leur quantité en stock (onglet Approvisionnement).
      </p>

      {erreur && (
        <div className="mb-4 rounded-md bg-valve-400/10 px-4 py-3 text-sm text-valve-600">{erreur}</div>
      )}

      <Card>
        {chargement ? (
          <div className="p-6 text-sm text-ink/50">Chargement...</div>
        ) : marques.length === 0 ? (
          <div className="p-6 text-sm text-ink/50">Aucune marque enregistrée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink/40">
                  <th className="px-4 py-3">Marque</th>
                  <th className="px-4 py-3">Taille</th>
                  <th className="px-4 py-3">Prix recharge</th>
                  <th className="px-4 py-3">Prix consigne</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {marques.map((m) => (
                  <tr key={m.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-3 font-medium">{m.nom}</td>
                    <td className="px-4 py-3 text-ink/70">{m.taille}</td>
                    <td className="px-4 py-3 font-data">
                      {Number(m.prixRecharge).toLocaleString()} FCFA
                    </td>
                    <td className="px-4 py-3 font-data text-ink/70">
                      {m.prixConsigne ? `${Number(m.prixConsigne).toLocaleString()} FCFA` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          m.actif ? "bg-gaz-400/10 text-gaz-600" : "bg-ink/5 text-ink/50"
                        }`}
                      >
                        {m.actif ? "Active" : "Désactivée"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => ouvrirEdition(m)}
                          className="rounded-md border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-ink/5"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => basculerActif(m)}
                          disabled={actionEnCours === m.id}
                          className="rounded-md border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-ink/5 disabled:opacity-60"
                        >
                          {m.actif ? "Désactiver" : "Réactiver"}
                        </button>
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
      <Modal open={modalOuvert} onClose={() => setModalOuvert(false)} title="Nouvelle marque">
        <form onSubmit={creerMarque}>
          <FormField label="Nom de la marque">
            <input
              className={inputClass}
              placeholder="Total, Oryx, SIR..."
              value={champs.nom}
              onChange={(e) => setChamps({ ...champs, nom: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Taille">
            <input
              className={inputClass}
              placeholder="6kg, 12,5kg..."
              value={champs.taille}
              onChange={(e) => setChamps({ ...champs, taille: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Prix de recharge homologué (FCFA)">
            <input
              type="number"
              step="any"
              className={inputClass}
              value={champs.prixRecharge}
              onChange={(e) => setChamps({ ...champs, prixRecharge: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Prix de consigne (FCFA) — si première bouteille sans échange">
            <input
              type="number"
              step="any"
              className={inputClass}
              value={champs.prixConsigne}
              onChange={(e) => setChamps({ ...champs, prixConsigne: e.target.value })}
            />
          </FormField>
          <button
            type="submit"
            disabled={creationEnCours}
            className="mt-2 w-full rounded-md bg-steel-500 py-2.5 text-sm font-medium text-white hover:bg-steel-600 disabled:opacity-60"
          >
            {creationEnCours ? "Création..." : "Créer la marque"}
          </button>
        </form>
      </Modal>

      {/* Édition */}
      <Modal
        open={editionOuverte !== null}
        onClose={() => setEditionOuverte(null)}
        title={`Modifier — ${editionOuverte?.nom ?? ""}`}
      >
        <form onSubmit={enregistrerEdition}>
          <FormField label="Nom de la marque">
            <input
              className={inputClass}
              value={champsEdition.nom}
              onChange={(e) => setChampsEdition({ ...champsEdition, nom: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Taille">
            <input
              className={inputClass}
              value={champsEdition.taille}
              onChange={(e) => setChampsEdition({ ...champsEdition, taille: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Prix de recharge homologué (FCFA)">
            <input
              type="number"
              step="any"
              className={inputClass}
              value={champsEdition.prixRecharge}
              onChange={(e) => setChampsEdition({ ...champsEdition, prixRecharge: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Prix de consigne (FCFA)">
            <input
              type="number"
              step="any"
              className={inputClass}
              value={champsEdition.prixConsigne}
              onChange={(e) => setChampsEdition({ ...champsEdition, prixConsigne: e.target.value })}
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
