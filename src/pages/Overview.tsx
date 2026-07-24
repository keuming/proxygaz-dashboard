import { useEffect, useState } from "react";
import { trpcQuery } from "../lib/api";
import { Card, PageHeader } from "../components/Card";

interface Stats {
  commandesGaz: { enAttente: number; confirmees: number; livrees: number };
  ramassage: { enAttente: number; enCours: number };
  validationsEnAttente: { boutiques: number; ramasseurs: number };
}

/** Jauge segmentée façon manomètre — élément signature du dashboard. */
function PressureBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink/5">
        {segments.map((s) => (
          <div
            key={s.label}
            className={s.color}
            style={{ width: `${(s.value / total) * 100}%` }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <span className={`h-2 w-2 rounded-full ${s.color}`} />
            <span className="text-ink/60">{s.label}</span>
            <span className="font-data font-medium text-ink">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    trpcQuery<Stats>("admin.stats")
      .then(setStats)
      .catch((e) => setErreur(e.message));
  }, []);

  if (erreur) {
    return <div className="rounded-md bg-valve-400/10 px-4 py-3 text-valve-600">{erreur}</div>;
  }

  if (!stats) {
    return <div className="text-ink/50">Chargement...</div>;
  }

  const totalValidations = stats.validationsEnAttente.boutiques + stats.validationsEnAttente.ramasseurs;

  return (
    <div>
      <PageHeader title="Vue d'ensemble" subtitle="État en temps réel des opérations ProxiGaz" />

      <Card className="mb-6 p-6">
        <div className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-ink/50">
          Pression des commandes gaz
        </div>
        <PressureBar
          segments={[
            { label: "En attente", value: stats.commandesGaz.enAttente, color: "bg-safety-500" },
            { label: "Confirmées", value: stats.commandesGaz.confirmees, color: "bg-steel-500" },
            { label: "Livrées", value: stats.commandesGaz.livrees, color: "bg-gaz-500" },
          ]}
        />
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-ink/50">
            Ramassage en cours
          </div>
          <div className="flex gap-8">
            <div>
              <div className="font-data text-3xl font-medium text-safety-500">
                {stats.ramassage.enAttente}
              </div>
              <div className="mt-1 text-sm text-ink/60">En attente d'un ramasseur</div>
            </div>
            <div>
              <div className="font-data text-3xl font-medium text-steel-500">
                {stats.ramassage.enCours}
              </div>
              <div className="mt-1 text-sm text-ink/60">Ramassages en cours</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-ink/50">
            Validations en attente
          </div>
          {totalValidations === 0 ? (
            <div className="text-sm text-ink/50">Rien à valider pour le moment.</div>
          ) : (
            <div className="flex gap-8">
              <div>
                <div className="font-data text-3xl font-medium text-safety-500">
                  {stats.validationsEnAttente.boutiques}
                </div>
                <div className="mt-1 text-sm text-ink/60">Boutiques</div>
              </div>
              <div>
                <div className="font-data text-3xl font-medium text-safety-500">
                  {stats.validationsEnAttente.ramasseurs}
                </div>
                <div className="mt-1 text-sm text-ink/60">Ramasseurs</div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
