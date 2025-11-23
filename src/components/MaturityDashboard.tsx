import { useEffect, useMemo, useState } from "react";
import RadialGauge from "./RadialGauge";
import type { Database } from "../lib/database.types";
import { getProjectMaturity, type MaturityResult } from "../lib/api";
import MaturityForm from "./MaturityForm";

type Project = Database["public"]["Tables"]["projects"]["Row"];

type Props = { projects: Project[] };

export default function MaturityDashboard({ projects }: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || "");
  const [result, setResult] = useState<MaturityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    getProjectMaturity(selectedProjectId)
      .then(setResult)
      .catch(e => setError(e?.message || "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [selectedProjectId]);

  const dimBars = useMemo(() => {
    const dims = result?.dimensions;
    if (!dims) return [] as { key: keyof typeof dims; label: string; value: number }[];
    return [
      { key: "financial", label: "Financière (30%)", value: dims.financial },
      { key: "technical", label: "Technique (25%)", value: dims.technical },
      { key: "legal", label: "Juridique \u0026 Administrative (20%)", value: dims.legal },
      { key: "operational", label: "Opérationnelle (15%)", value: dims.operational },
      { key: "strategic", label: "Stratégique (10%)", value: dims.strategic }
    ];
  }, [result]);

  const colorFor = (v: number) => {
    if (v >= 70) return "#008000"; // Vert
    if (v >= 40) return "#FF9800"; // Orange
    return "#DC143C"; // Rouge
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Évaluation de maturité</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Projet</label>
          <select
            className="border rounded px-3 py-2 text-sm"
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-600">Chargement...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {result && (
        <>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <RadialGauge value={result.score} label="Score global" />
            <div className="flex-1 grid grid-cols-1 gap-3">
              {dimBars.map(d => (
                <div key={d.key} className="">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{d.label}</span>
                    <span className="text-sm font-medium text-gray-900">{Math.round(d.value)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${Math.max(0, Math.min(100, d.value))}%`, backgroundColor: colorFor(d.value) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 rounded bg-gray-50 text-sm">
            {result.recommendation.status === "ready" && <span>✅ Projet prêt pour exécution. Passer à la phase suivante.</span>}
            {result.recommendation.status === "preparing" && <span>⚠️ Projet en cours de préparation. Voir les blocages ci-dessous.</span>}
            {result.recommendation.status === "not_ready" && <span>❌ Projet non prêt. Actions urgentes requises.</span>}
          </div>

          <MaturityForm
            projectId={selectedProjectId}
            initial={result.assessment}
            onSaved={setResult}
          />
        </>
      )}

      {!result && !loading && (
        <div className="text-sm text-gray-600">Sélectionnez un projet pour voir son évaluation de maturité.</div>
      )}
    </div>
  );
}