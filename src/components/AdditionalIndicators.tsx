import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart3, MapPin, Target, DollarSign } from "lucide-react";
import type { Database } from "../lib/database.types";
import { getPlanningAlerts, getProjectPhases, getProjectAlignment } from "../lib/api";
import type { PlanningAlert, Phase, AlignmentResult } from "../lib/api";
import { STRINGS } from "../lib/strings";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type Alert = Database["public"]["Tables"]["alerts"]["Row"];

type Props = {
  projects: Project[];
  alerts: Alert[];
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-CD", {
    style: "currency",
    currency: "CDF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export default function AdditionalIndicators({ projects, alerts }: Props) {
  const [planningAlerts, setPlanningAlerts] = useState<PlanningAlert[]>([]);
  const [phasesLoading, setPhasesLoading] = useState(false);
  const [alignmentLoading, setAlignmentLoading] = useState(false);

  const [phaseStats, setPhaseStats] = useState<{ total: number; delayed: number; rate: number }>({ total: 0, delayed: 0, rate: 0 });
  const [alignmentStats, setAlignmentStats] = useState<{ count: number; avgScore: number; alignedPercent: number }>({ count: 0, avgScore: 0, alignedPercent: 0 });

  // Charger les alertes de planification
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getPlanningAlerts();
        if (mounted) setPlanningAlerts(res || []);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  // Calcul des stats des phases (retards par phase) sur un sous-ensemble pour limiter la charge
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!projects || projects.length === 0) { setPhaseStats({ total: 0, delayed: 0, rate: 0 }); return; }
      setPhasesLoading(true);
      try {
        const sample = projects.slice(0, 10);
        const phasesLists: Phase[][] = await Promise.all(sample.map(p => getProjectPhases(p.id)));
        const allPhases = phasesLists.flat();
        const total = allPhases.length;
        let delayed = 0;
        for (const ph of allPhases) {
          const isBlocked = ph.status === "blocked";
          const hasDelay = ph.actual_end && ph.planned_end && new Date(ph.actual_end) > new Date(ph.planned_end);
          if (isBlocked || hasDelay) delayed++;
        }
        const rate = total > 0 ? (delayed / total) * 100 : 0;
        if (mounted) setPhaseStats({ total, delayed, rate });
      } catch {
        if (mounted) setPhaseStats({ total: 0, delayed: 0, rate: 0 });
      } finally {
        if (mounted) setPhasesLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [projects]);

  // Calcul des stats d\u0027alignement PAG sur un sous-ensemble
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!projects || projects.length === 0) { setAlignmentStats({ count: 0, avgScore: 0, alignedPercent: 0 }); return; }
      setAlignmentLoading(true);
      try {
        const sample = projects.slice(0, 10);
        const alignments: AlignmentResult[] = await Promise.all(sample.map(p => getProjectAlignment(p.id)));
        const count = alignments.length;
        const totalScore = alignments.reduce((sum, a) => sum + (a?.score || 0), 0);
        const avgScore = count > 0 ? totalScore / count : 0;
        const aligned = alignments.filter(a => (a?.score || 0) >= 70).length;
        const alignedPercent = count > 0 ? (aligned / count) * 100 : 0;
        if (mounted) setAlignmentStats({ count, avgScore, alignedPercent });
      } catch {
        if (mounted) setAlignmentStats({ count: 0, avgScore: 0, alignedPercent: 0 });
      } finally {
        if (mounted) setAlignmentLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [projects]);

  // Variance budg\u00e9taire
  const totalBudget = useMemo(() => projects.reduce((sum, p) => sum + Number(p.budget || 0), 0), [projects]);
  const totalSpent = useMemo(() => projects.reduce((sum, p) => sum + Number(p.spent || 0), 0), [projects]);
  const variance = totalSpent - totalBudget; // > 0 = d\u00e9passement
  const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;

  // Distribution s\u00e9v\u00e9rit\u00e9 des alertes (globales + planification)
  const severityLevels: PlanningAlert["severity"][] = ["low", "medium", "high", "critical"];
  const alertSeverityCounts = useMemo(() => {
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const a of alerts) counts[a.severity] = (counts[a.severity] || 0) + 1;
    return counts;
  }, [alerts]);
  const planningSeverityCounts = useMemo(() => {
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const a of planningAlerts) counts[a.severity] = (counts[a.severity] || 0) + 1;
    return counts;
  }, [planningAlerts]);

  // Top secteurs / provinces
  const topSectors = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of projects) map[p.sector] = (map[p.sector] || 0) + 1;
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [projects]);
  const topProvinces = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of projects) map[p.province] = (map[p.province] || 0) + 1;
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [projects]);

  // Projets à risque (alertes high/critical)
  const atRiskCount = useMemo(() => {
    const risky = new Set(["high", "critical"]);
    const fromAlerts = new Set(alerts.filter(a => risky.has(a.severity)).map(a => a.project_id));
    const fromPlanning = new Set(planningAlerts.filter(a => risky.has(a.severity)).map(a => a.project_id));
    const atRiskIds = new Set<string>([...Array.from(fromAlerts), ...Array.from(fromPlanning)]);
    return projects.filter(p => atRiskIds.has(p.id)).length;
  }, [alerts, planningAlerts, projects]);
  const riskRate = useMemo(() => {
    return projects.length > 0 ? (atRiskCount / projects.length) * 100 : 0;
  }, [atRiskCount, projects.length]);

  // Tendance mensuelle des alertes (6 derniers mois)
  const months = useMemo(() => {
    const now = new Date();
    const arr: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("fr-FR", { month: "short" });
      arr.push({ key, label });
    }
    return arr;
  }, []);
  const monthlyCounts = useMemo(() => {
    const map: Record<string, number> = {};
    months.forEach(m => { map[m.key] = 0; });
    const allDates = [
      ...alerts.map(a => a.created_at),
      ...planningAlerts.map(a => a.created_at)
    ];
    for (const ts of allDates) {
      const d = new Date(ts);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in map) map[key]++;
    }
    return months.map(m => map[m.key]);
  }, [alerts, planningAlerts, months]);
  const monthlyMax = useMemo(() => {
    return monthlyCounts.length > 0 ? Math.max(...monthlyCounts) : 0;
  }, [monthlyCounts]);

  // Top secteurs par consommation (dépenses)
  const topSectorsBySpent = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of projects) map[p.sector] = (map[p.sector] || 0) + Number(p.spent || 0);
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [projects]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">{STRINGS.additionalIndicatorsTitle}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Alignement PAG */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{STRINGS.alignmentTitle}</p>
              <p className="text-xs text-gray-500">Échantillon de {alignmentStats.count} projet(s)</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Score moyen</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${Math.min(100, alignmentStats.avgScore)}%` }} />
              </div>
              <p className="text-sm font-semibold text-gray-900 mt-1">{alignmentLoading ? "Calcul..." : `${alignmentStats.avgScore.toFixed(1)}%`}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">{STRINGS.alignedProjectsLabel}</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-green-600 transition-all" style={{ width: `${Math.min(100, alignmentStats.alignedPercent)}%` }} />
              </div>
              <p className="text-sm font-semibold text-gray-900 mt-1">{alignmentLoading ? "Calcul..." : `${alignmentStats.alignedPercent.toFixed(1)}%`}</p>
            </div>
          </div>
        </div>

        {/* Distribution des alertes par s\u00e9v\u00e9rit\u00e9 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Alertes par sévérité</p>
              <p className="text-xs text-gray-500">Globales vs Planification</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Globales</p>
              {severityLevels.map((s) => (
                <div key={`g-${s}`} className="flex items-center gap-2 mb-1">
                  <span className={`inline-block w-3 h-3 rounded ${s === "critical" ? "bg-red-600" : s === "high" ? "bg-orange-500" : s === "medium" ? "bg-yellow-400" : "bg-blue-500"}`}></span>
                  <span className="text-gray-700">{STRINGS.alertSeverityLabels[s]}</span>
                  <span className="ml-auto font-semibold">{alertSeverityCounts[s]}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Planification</p>
              {severityLevels.map((s) => (
                <div key={`p-${s}`} className="flex items-center gap-2 mb-1">
                  <span className={`inline-block w-3 h-3 rounded ${s === "critical" ? "bg-red-600" : s === "high" ? "bg-orange-500" : s === "medium" ? "bg-yellow-400" : "bg-blue-500"}`}></span>
                  <span className="text-gray-700">{STRINGS.alertSeverityLabels[s]}</span>
                  <span className="ml-auto font-semibold">{planningSeverityCounts[s]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Taux de retard par phases */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Taux de retard des phases</p>
              <p className="text-xs text-gray-500">sur {phaseStats.total} phase(s)</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div className={`h-2 rounded-full transition-all ${phaseStats.rate > 30 ? "bg-red-600" : phaseStats.rate > 15 ? "bg-yellow-500" : "bg-green-600"}`} style={{ width: `${Math.min(100, phaseStats.rate)}%` }} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{phasesLoading ? "Calcul..." : `${phaseStats.rate.toFixed(1)}%`}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Variance budg\u00e9taire */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{STRINGS.varianceTitle}</p>
              <p className="text-xs text-gray-500">Budget vs Dépensé</p>
            </div>
          </div>
          <p className={`text-sm ${variance > 0 ? "text-red-700" : "text-green-700"}`}>
            {variance > 0 ? "Dépassement: " : STRINGS.underUtilizationLabel}
            <span className="font-semibold">{formatCurrency(Math.abs(variance))}</span>
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className={`h-2 rounded-full transition-all ${variancePercent > 0 ? (variancePercent > 10 ? "bg-red-600" : "bg-yellow-500") : "bg-green-600"}`} style={{ width: `${Math.min(100, Math.abs(variancePercent))}%` }} />
          </div>
          <p className="text-sm text-gray-600 mt-1">{variancePercent.toFixed(1)}%</p>
        </div>

        {/* Top secteurs */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Top secteurs</p>
              <p className="text-xs text-gray-500">3 principaux</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {topSectors.length === 0 ? (
              <p className="text-gray-600">Aucun projet</p>
            ) : (
              topSectors.map(([name, count]) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">{name}</span>
                  <span className="ml-auto font-semibold">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top provinces */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Top provinces</p>
              <p className="text-xs text-gray-500">3 principales</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {topProvinces.length === 0 ? (
              <p className="text-gray-600">Aucun projet</p>
            ) : (
              topProvinces.map(([name, count]) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">{name}</span>
                  <span className="ml-auto font-semibold">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Projets à risque */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{STRINGS.atRiskTitle}</p>
              <p className="text-xs text-gray-500">{atRiskCount} sur {projects.length}</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div className={`h-2 rounded-full transition-all ${riskRate > 30 ? "bg-red-600" : riskRate > 15 ? "bg-yellow-500" : "bg-green-600"}`} style={{ width: `${Math.min(100, riskRate)}%` }} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{riskRate.toFixed(1)}%</p>
        </div>

        {/* Tendance des alertes (6 derniers mois) */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{STRINGS.trendTitle}</p>
              <p className="text-xs text-gray-500">6 derniers mois</p>
            </div>
          </div>
          <div className="flex items-end gap-2 h-32">
            {months.map((m, idx) => {
              const count = monthlyCounts[idx];
              const height = monthlyMax > 0 ? (count / monthlyMax) * 100 : 0;
              return (
                <div key={m.key} className="flex flex-col items-center justify-end w-10">
                  <div className="w-6 bg-blue-600 rounded-sm" style={{ height: `${height}%` }}></div>
                  <span className="mt-1 text-xs text-gray-600">{m.label}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">Max: {monthlyMax}</p>
        </div>

        {/* Secteurs les plus dépensiers */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{STRINGS.topSpendersTitle}</p>
              <p className="text-xs text-gray-500">3 principaux</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {topSectorsBySpent.length === 0 ? (
              <p className="text-gray-600">Aucun projet</p>
            ) : (
              topSectorsBySpent.map(([name, amount]) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">{name}</span>
                  <span className="ml-auto font-semibold">{formatCurrency(amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
            