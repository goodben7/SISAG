import { useMemo } from "react";
import type { Phase } from "../lib/api";
import { STRINGS } from "../lib/strings";
import { CheckCircle, CalendarDays, AlertTriangle, Clock } from "lucide-react";

type Props = {
  phase: Phase;
  onFieldChange: (id: string, field: keyof Phase, value: any) => void;
  onSave: (p: Phase) => void;
  onDelete: (p: Phase) => void;
};

function parseDate(d: string | null): number | null { if (!d) return null; const t = new Date(d).getTime(); return isNaN(t) ? null : t; }

function statusMeta(status: Phase["status"]) {
  switch (status) {
    case "completed": return { bg: "bg-rdcGreen", icon: <CheckCircle className="w-5 h-5" />, label: STRINGS.phaseStatusLabels.completed };
    case "in_progress": return { bg: "bg-rdcBlue", icon: <Clock className="w-5 h-5" />, label: STRINGS.phaseStatusLabels.in_progress };
    case "blocked": return { bg: "bg-rdcRed", icon: <AlertTriangle className="w-5 h-5" />, label: STRINGS.phaseStatusLabels.blocked };
    default: return { bg: "bg-gray-400", icon: <CalendarDays className="w-5 h-5" />, label: STRINGS.phaseStatusLabels.planned };
  }
}

export default function PhaseCard({ phase, onFieldChange, onSave, onDelete }: Props) {
  const meta = statusMeta(phase.status);

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

  const delayed = useMemo(() => {
    if (phase.actual_end && phase.planned_end) {
      return new Date(phase.actual_end) > new Date(phase.planned_end);
    }
    return false;
  }, [phase.actual_end, phase.planned_end]);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded text-white ${meta.bg}`}>{meta.icon}</div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">{phase.name}</div>
            <div className="text-xs text-gray-600">{STRINGS.statusLabel}: {meta.label}</div>
          </div>
        </div>
        <div className="text-xs text-gray-600">
          {delayed && <span className="text-rdcRed">⚠️ {STRINGS.plannedEndLabel} u003e {STRINGS.actualEndLabel}</span>}
        </div>
      </div>

      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className={`h-2 rounded-full transition-all`} style={{ width: `${progress}%`, backgroundColor: meta.bg.replace("bg-", "").includes("rdc") ? undefined : undefined }}>
            {/* Tailwind color classes already applied via meta.bg */}
          </div>
        </div>
        <div className="mt-1 text-xs text-gray-700">{STRINGS.phaseNameLabel}: {progress.toFixed(0)}%</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mt-3">
        <input className="px-2 py-1 border rounded text-sm" value={phase.name} onChange={(e) => onFieldChange(phase.id, "name", e.target.value)} placeholder={STRINGS.phaseNameLabel} />
        <select className="px-2 py-1 border rounded text-sm" value={phase.status} onChange={(e) => onFieldChange(phase.id, "status", e.target.value as Phase["status"]) }>
          {(["planned","in_progress","completed","blocked"] as Phase["status"][]).map(s => (
            <option key={s} value={s}>{STRINGS.phaseStatusLabels[s]}</option>
          ))}
        </select>
        <input type="date" className="px-2 py-1 border rounded text-sm" value={phase.planned_start ?? ""} onChange={(e) => onFieldChange(phase.id, "planned_start", e.target.value || null)} />
        <input type="date" className="px-2 py-1 border rounded text-sm" value={phase.planned_end ?? ""} onChange={(e) => onFieldChange(phase.id, "planned_end", e.target.value || null)} />
        <input type="date" className="px-2 py-1 border rounded text-sm" value={phase.actual_start ?? ""} onChange={(e) => onFieldChange(phase.id, "actual_start", e.target.value || null)} />
        <input type="date" className="px-2 py-1 border rounded text-sm" value={phase.actual_end ?? ""} onChange={(e) => onFieldChange(phase.id, "actual_end", e.target.value || null)} />
      </div>

      <div className="flex justify-end gap-2 mt-3">
        <button className="px-3 py-1 rounded bg-rdcBlue text-white text-sm hover:bg-rdcBlueDark" onClick={() => onSave(phase)}>{STRINGS.saveLabel}</button>
        <button className="px-3 py-1 rounded border text-sm hover:bg-gray-50" onClick={() => onDelete(phase)}>{STRINGS.deleteLabel}</button>
      </div>
    </div>
  );
}