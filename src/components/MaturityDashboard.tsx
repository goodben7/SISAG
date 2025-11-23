import { useEffect, useMemo, useState } from "react";
import RadialGauge from "./RadialGauge";
import type { Database } from "../lib/database.types";
import { getProjectMaturity, type MaturityResult } from "../lib/api";
import MaturityForm from "./MaturityForm";
import MaturityDimensionPanel from "./MaturityDimensionPanel";
import { STRINGS } from "../lib/strings";

type Project = Database["public"]["Tables"]["projects"]["Row"];

type Props = { projects: Project[] };

type DimensionKey = "financial"|"technical"|"legal"|"operational"|"strategic";

export default function MaturityDashboard({ projects }: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || "");
  const [result, setResult] = useState<MaturityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  type PanelMode = { mode: "dimension" | "recommendations"; dim?: DimensionKey };
  const [panelMode, setPanelMode] = useState<PanelMode | null>(null);

  useEffect(() => {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    getProjectMaturity(selectedProjectId)
      .then(setResult)
      .catch(e => setError(e?.message || "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [selectedProjectId]);

  const dimBars = useMemo((): { key: DimensionKey; label: string; value: number }[] => {
    const dims = result?.dimensions;
    if (!dims) return [];
    return [
      { key: "financial" as const, label: "Financière (30%)", value: dims.financial },
      { key: "technical" as const, label: "Technique (25%)", value: dims.technical },
      { key: "legal" as const, label: "Juridique & Administrative (20%)", value: dims.legal },
      { key: "operational" as const, label: "Opérationnelle (15%)", value: dims.operational },
      { key: "strategic" as const, label: "Stratégique (10%)", value: dims.strategic }
    ];
  }, [result]);



  const DIM_COLORS: Record<"financial"|"technical"|"legal"|"operational"|"strategic", string> = {
    financial: "#0072C6",
    technical: "#008000",
    legal: "#FF9800",
    operational: "#6B7280",
    strategic: "#DC143C"
  };

  const msgClass = result?.recommendation?.status === "ready"
    ? "bg-green-50 text-green-800 border border-green-200"
    : result?.recommendation?.status === "preparing"
      ? "bg-orange-50 text-orange-800 border border-orange-200"
      : "bg-red-50 text-red-800 border border-red-200";

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
                <div
                  key={d.key}
                  className="group cursor-pointer"
                  title={STRINGS.maturityDimensionDescriptions[d.key]}
                  onClick={() => setPanelMode({ mode: "dimension", dim: d.key })}
                  role="button"
                  aria-label={`Voir les détails de la dimension ${d.label}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{d.label}</span>
                    <span className="text-sm font-medium text-gray-900">{Math.round(d.value)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${Math.max(0, Math.min(100, d.value))}%`, backgroundColor: DIM_COLORS[d.key] }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100">Cliquez pour voir les détails et recommandations</div>
                </div>
              ))}
            </div>
          </div>

          <div className={`mt-4 p-3 rounded text-sm ${msgClass}`}>
            <span>{result.recommendation.message}</span>
            <button
              type="button"
              onClick={() => setPanelMode({ mode: "recommendations" })}
              className="ml-3 inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
            >{STRINGS.viewRecommendedActionsLabel}</button>
          </div>

          {panelMode && (
            <MaturityDimensionPanel
              onClose={() => setPanelMode(null)}
              mode={panelMode.mode}
              dimension={panelMode.dim}
              assessment={result.assessment}
              result={result}
            />
          )}

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