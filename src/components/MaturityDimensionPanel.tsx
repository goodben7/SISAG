import { X, CheckCircle, XCircle, DollarSign, Wrench, FileText, Users, Target, Lightbulb } from "lucide-react";
import { useMemo } from "react";
import { STRINGS } from "../lib/strings";
import type { MaturityAssessment, MaturityResult } from "../lib/api";

type DimensionKey = "financial" | "technical" | "legal" | "operational" | "strategic";

type Props = {
  onClose: () => void;
  mode: "dimension" | "recommendations";
  dimension?: DimensionKey;
  assessment: MaturityAssessment;
  result: MaturityResult;
};

const DIM_ICONS: Record<DimensionKey, any> = {
  financial: DollarSign,
  technical: Wrench,
  legal: FileText,
  operational: Users,
  strategic: Target
};

const DIM_COLORS: Record<DimensionKey, string> = {
  financial: "#0072C6",
  technical: "#008000",
  legal: "#FF9800",
  operational: "#6B7280",
  strategic: "#DC143C"
};

const LABELS: { key: keyof MaturityAssessment; label: string; dim: DimensionKey; weight: number }[] = [
  { key: "budget_available", label: "Budget disponible", dim: "financial", weight: 10 },
  { key: "disbursement_planned", label: "Décaissement prévu", dim: "financial", weight: 10 },
  { key: "funding_source_confirmed", label: "Source de financement confirmée", dim: "financial", weight: 5 },
  { key: "contracts_signed", label: "Contrats de financement signés", dim: "financial", weight: 5 },
  { key: "feasibility_study", label: "Étude de faisabilité disponible", dim: "technical", weight: 10 },
  { key: "technical_plans_validated", label: "Plans techniques validés", dim: "technical", weight: 10 },
  { key: "documentation_complete", label: "Documentation complète", dim: "technical", weight: 5 },
  { key: "governance_defined", label: "Gouvernance définie", dim: "legal", weight: 5 },
  { key: "steering_committee_formed", label: "Comité de pilotage formé", dim: "legal", weight: 5 },
  { key: "tenders_launched_awarded", label: "Appels d\u2019offres lancés / attribués", dim: "legal", weight: 10 },
  { key: "project_team_available", label: "Équipe projet disponible", dim: "operational", weight: 5 },
  { key: "logistics_ready", label: "Logistique prête", dim: "operational", weight: 5 },
  { key: "risks_identified", label: "Risques identifiés", dim: "operational", weight: 5 }
];

function suggestionFor(key: keyof MaturityAssessment): string {
  switch (key) {
    case "budget_available": return "Assurer la mise à disposition du budget par le ministère des finances.";
    case "disbursement_planned": return "Programmer les décaissements et établir un calendrier approuvé.";
    case "funding_source_confirmed": return "Finaliser la lettre de confirmation des bailleurs.";
    case "contracts_signed": return "Signer les contrats de financement en attente.";
    case "feasibility_study": return "Téléverser ou finaliser l\u2019étude de faisabilité.";
    case "technical_plans_validated": return "Valider les plans techniques avec l\u2019unité d\u2019ingénierie.";
    case "documentation_complete": return "Compléter la documentation technique et administrative.";
    case "governance_defined": return "Définir la structure de gouvernance du projet.";
    case "steering_committee_formed": return "Constituer le comité de pilotage et valider les termes de référence.";
    case "tenders_launched_awarded": return "Lancer/attribuer les appels d\u2019offres via le module Marchés Publics.";
    case "project_team_available": return "Nommer l\u2019équipe projet et clarifier les responsabilités.";
    case "logistics_ready": return "Planifier la logistique et contractualiser les prestataires locaux.";
    case "risks_identified": return "Identifier et consigner les risques clés avec plans d\u2019atténuation.";
    default: return "Action recommandée.";
  }
}

export default function MaturityDimensionPanel({ onClose, mode, dimension, assessment, result }: Props) {
  const items = useMemo(() => LABELS.filter(l => (mode === "dimension" ? l.dim === dimension : true)), [mode, dimension]);
  const missing = items.filter(l => !Boolean(assessment[l.key]));

  const top3 = useMemo(() => missing.sort((a, b) => b.weight - a.weight).slice(0, 3), [missing]);

  const headerColor = DIM_COLORS[(dimension || "financial") as DimensionKey];
  const HeaderIcon = DIM_ICONS[(dimension || "financial") as DimensionKey];

  const dimDesc = dimension ? STRINGS.maturityDimensionDescriptions[dimension] : STRINGS.viewRecommendedActionsLabel;
  const gridCols = mode === "recommendations" ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-5xl max-h-[80vh] rounded-lg shadow-lg flex flex-col">
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: headerColor }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded" style={{ backgroundColor: `${headerColor}22` }}>
              <HeaderIcon className="w-5 h-5" style={{ color: headerColor }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {mode === "dimension" ? `Détails — ${dimension?.toUpperCase()}` : STRINGS.viewRecommendedActionsLabel}
              </h2>
              <p className="text-sm text-gray-600">{dimDesc}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-600 hover:text-gray-900" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          {mode === "recommendations" && (
            <div className="mb-4 p-3 rounded bg-orange-50 text-sm text-orange-800 border border-orange-200">
              <div className="flex items-center gap-2"><Lightbulb className="w-4 h-4" /><span>{result.recommendation.message}</span></div>
            </div>
          )}

          {mode === "recommendations" && top3.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{STRINGS.maturityTop3BlockingTitle}</h3>
              <ul className="space-y-2">
                {top3.map(t => (
                  <li key={t.key as string} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                    <span className="text-sm text-gray-800">{t.label}</span>
                    <span className="text-xs text-gray-600">+{t.weight} pts potentiels</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={`grid ${gridCols} gap-4`}>
            {items.map(({ key, label, dim }) => {
              const ok = Boolean(assessment[key]);
              return (
                <div key={key as string} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {ok ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{label}</div>
                        <div className="text-xs text-gray-500">{STRINGS.maturityDimensionDescriptions[dim]}</div>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: `${DIM_COLORS[dim]}22`, color: DIM_COLORS[dim] }}>{dim.charAt(0).toUpperCase() + dim.slice(1)}</span>
                  </div>

                  {!ok && (
                    <div className="mt-2 text-sm text-gray-700">
                      <span className="font-medium">Suggestion:</span> {suggestionFor(key)}
                    </div>
                  )}

                  {ok && (
                    <div className="mt-2">
                      <button className="text-blue-600 text-sm hover:underline" type="button" aria-label={STRINGS.viewDocumentLabel}>{STRINGS.viewDocumentLabel}</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>


        </div>
      </div>
    </div>
  );
}