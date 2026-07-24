interface StatusConfig {
  label: string;
  color: string;
  dot: string;
}

const STATUTS: Record<string, StatusConfig> = {
  en_attente: { label: "En attente", color: "text-safety-600 bg-safety-400/10", dot: "bg-safety-500" },
  confirmee: { label: "Confirmée", color: "text-steel-600 bg-steel-400/10", dot: "bg-steel-500" },
  en_livraison: { label: "En livraison", color: "text-steel-600 bg-steel-400/10", dot: "bg-steel-500" },
  livree: { label: "Livrée", color: "text-gaz-600 bg-gaz-400/10", dot: "bg-gaz-500" },
  annulee: { label: "Annulée", color: "text-valve-600 bg-valve-400/10", dot: "bg-valve-500" },
  validee: { label: "Validée", color: "text-steel-600 bg-steel-400/10", dot: "bg-steel-500" },
  en_cours: { label: "En cours", color: "text-steel-600 bg-steel-400/10", dot: "bg-steel-500" },
  terminee: { label: "Terminée", color: "text-gaz-600 bg-gaz-400/10", dot: "bg-gaz-500" },
  valide: { label: "Validé", color: "text-gaz-600 bg-gaz-400/10", dot: "bg-gaz-500" },
  rejete: { label: "Rejeté", color: "text-valve-600 bg-valve-400/10", dot: "bg-valve-500" },
  suspendu: { label: "Suspendu", color: "text-valve-600 bg-valve-400/10", dot: "bg-valve-500" },
};

export function StatusGauge({ statut }: { statut: string }) {
  const config = STATUTS[statut] ?? { label: statut, color: "text-ink bg-ink/5", dot: "bg-ink" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
