import { useMemo, useState } from "react";
import type { Phase } from "../lib/api";
import { STRINGS } from "../lib/strings";
import { CheckCircle, CalendarDays, AlertTriangle, Clock, Check, Trash, Info } from "lucide-react";

type Props = {
  phase: Phase;
  onFieldChange: (id: string, field: keyof Phase, value: any) => void;
  onSave: (p: Phase) => Promise<void> | void;
  onDelete: (p: Phase) => void;
  isSelected?: boolean;
  readOnly?: boolean;
};

function parseDate(d: string | null): number | null { if (!d) return null; const t = new Date(d).getTime(); return isNaN(t) ? null : t; }
function fmt(d: string | null): string { if (!d) return "—"; try { return new Date(d).toLocaleDateString("fr-FR"); } catch { return d || "—"; } }
function daysBetween(a: string | null, b: string | null): number | null { const ta = parseDate(a); const tb = parseDate(b); if (!ta || !tb) return null; const diff = Math.round((tb - ta) / (1000 * 60 * 60 * 24)); return diff; }

function statusMeta(status: Phase["status"]) {
  switch (status) {
    case "completed": return { color: "bg-rdcGreen", text: "text-rdcGreen", icon: <CheckCircle className="w-5 h-5" />, label: STRINGS.phaseStatusLabels.completed, badge: "bg-rdcGreenLight text-rdcGreen border-rdcGreen" };
    case "in_progress": return { color: "bg-rdcBlue", text: "text-rdcBlue", icon: <Clock className="w-5 h-5" />, label: STRINGS.phaseStatusLabels.in_progress, badge: "bg-rdcBlueLight text-rdcBlue border-rdcBlue" };
    case "blocked": return { color: "bg-rdcRed", text: "text-rdcRed", icon: <AlertTriangle className="w-5 h-5" />, label: STRINGS.phaseStatusLabels.blocked, badge: "bg-rdcRedLight text-rdcRed border-rdcRed" };
    default: return { color: "bg-gray-400", text: "text-gray-600", icon: <CalendarDays className="w-5 h-5" />, label: STRINGS.phaseStatusLabels.planned, badge: "bg-gray-100 text-gray-700 border-gray-300" };
  }
}

const STATUSES: readonly Phase["status"][] = ["planned","in_progress","completed","blocked"];

export default function PhaseCard({ phase, onFieldChange, onSave, onDelete, isSelected, readOnly }: Props) {
  const meta = statusMeta(phase.status);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const progress = useMemo(() => {
    if (phase.status === "completed") return 100;
    if (phase.status === "planned") return 0;
    const ps = parseDate(phase.planned_start) ?? parseDate(phase.actual_start);
    const pe = parseDate(phase.planned_end) ?? parseDate(phase.actual_end);
    if (!ps || !pe || pe <= ps) return phase.status === "blocked" ? 0 : 50;
    const now = Date.now();
    const pct = Math.max(0, Math.min(100, ((now - ps) / (pe - ps)) * 100));
    return phase.status === "blocked" ? Math.min(pct, 90) : pct;
  }, [phase]);

  const isEndDelayed = useMemo(() => {
    if (phase.actual_end && phase.planned_end) {
      return new Date(phase.actual_end) > new Date(phase.planned_end);
    }
    return false;
  }, [phase.actual_end, phase.planned_end]);

  const delayDays = useMemo(() => {
    if (!phase.actual_end || !phase.planned_end) return null;
    const d = daysBetween(phase.planned_end, phase.actual_end);
    return d && d > 0 ? d : null;
  }, [phase.actual_end, phase.planned_end]);

  async function handleSave() {
    try { setSaving(true); await onSave(phase); setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1800); } finally { setSaving(false); }
  }

  return (
    <div id={`phase-${phase.id}`} className={`bg-white rounded-xl shadow-sm border p-4 transition-shadow ${isSelected ? "ring-2 ring-rdcBlue shadow-soft" : "hover:shadow-soft"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded text-white ${meta.color}`}>{meta.icon}</div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">{phase.name}</div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`inline-flex items-center px-2 py-0.5 rounded border ${meta.badge}`} title={STRINGS.statusLabel}>{meta.label}</span>
              <span className="text-gray-500 flex items-center gap-1" title="Guide des statuts"><Info className="w-3.5 h-3.5" />Statut</span>
            </div>
          </div>
        </div>
        {isEndDelayed && (
          <div className="text-xs font-medium text-rdcRed inline-flex items-center gap-1" title="Phase en retard">
            <AlertTriangle className="w-4 h-4" />{delayDays ? `En retard de ${delayDays} jour(s)` : "En retard"}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded-full h-2" aria-label={`${STRINGS.phaseNameLabel}: ${progress.toFixed(0)}%`} role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div className={`h-2 rounded-full ${meta.color} transition-all duration-700`} style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-1 text-xs text-gray-700"><span className="font-display font-extrabold text-rdcTextPrimary text-sm">{progress.toFixed(0)}%</span> — {STRINGS.phaseNameLabel}</div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-[11px] text-gray-600 font-medium flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{STRINGS.plannedStartLabel} — {STRINGS.plannedEndLabel}</div>
          <div className="text-xs text-gray-600">{fmt(phase.planned_start)} → {fmt(phase.planned_end)}</div>
        </div>
        <div className="space-y-1">
          <div className={`text-[11px] font-medium flex items-center gap-1 ${isEndDelayed ? "text-rdcRed" : "text-rdcGreen"}`}>
            {isEndDelayed ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}{STRINGS.actualStartLabel} — {STRINGS.actualEndLabel}
          </div>
          <div className={`text-xs ${isEndDelayed ? "text-rdcRed" : "text-rdcGreen"}`}>{fmt(phase.actual_start)} → {fmt(phase.actual_end)}</div>
        </div>
      </div>

      {!readOnly && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mt-3" aria-label="Édition de la phase">
          <input className="px-2 py-1 border rounded text-sm" value={phase.name} onChange={(e) => onFieldChange(phase.id, "name", e.target.value)} placeholder={STRINGS.phaseNameLabel} />
          <select className="px-2 py-1 border rounded text-sm" value={phase.status} onChange={(e) => onFieldChange(phase.id, "status", e.target.value as Phase["status"]) } title="Changer le statut">
            {STATUSES.map(s => (
              <option key={s} value={s}>{STRINGS.phaseStatusLabels[s]}</option>
            ))}
          </select>
          <input type="date" className="px-2 py-1 border rounded text-sm" value={phase.planned_start ?? ""} onChange={(e) => onFieldChange(phase.id, "planned_start", e.target.value || null)} title={STRINGS.plannedStartLabel} />
          <input type="date" className="px-2 py-1 border rounded text-sm" value={phase.planned_end ?? ""} onChange={(e) => onFieldChange(phase.id, "planned_end", e.target.value || null)} title={STRINGS.plannedEndLabel} />
          <input type="date" className="px-2 py-1 border rounded text-sm" value={phase.actual_start ?? ""} onChange={(e) => onFieldChange(phase.id, "actual_start", e.target.value || null)} title={STRINGS.actualStartLabel} />
          <input type="date" className={`px-2 py-1 border rounded text-sm ${isEndDelayed ? "border-rdcRed" : ""}`} value={phase.actual_end ?? ""} onChange={(e) => onFieldChange(phase.id, "actual_end", e.target.value || null)} title={STRINGS.actualEndLabel} />
        </div>
      )}

      {!readOnly && (
        <div className="flex justify-end gap-2 mt-3">
          <button className="px-3 py-1.5 rounded bg-rdcBlue text-white text-sm hover:bg-rdcBlueDark inline-flex items-center gap-1 disabled:opacity-50" onClick={handleSave} disabled={saving} title={STRINGS.saveLabel}>
            <Check className="w-4 h-4" />{saving ? STRINGS.savingLabel : STRINGS.saveLabel}
          </button>
          <button className="px-3 py-1.5 rounded bg-rdcRed text-white text-sm hover:bg-rdcRedDark inline-flex items-center gap-1" onClick={() => onDelete(phase)} title={STRINGS.deleteLabel}>
            <Trash className="w-4 h-4" />{STRINGS.deleteLabel}
          </button>
        </div>
      )}

      {savedFlash && !readOnly && (
        <div className="mt-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded inline-flex items-center gap-1"><CheckCircle className="w-4 h-4" />Phase mise à jour avec succès !</div>
      )}
    </div>
  );
}
