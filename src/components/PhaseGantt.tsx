import { useEffect, useState } from "react";
import type { Phase } from "../lib/api";
import { getProjectPhases, createPhase, updatePhase, deletePhase } from "../lib/api";
import { STRINGS } from "../lib/strings";

function parseDate(d: string | null): number | null {
  if (!d) return null;
  const t = new Date(d).getTime();
  return isNaN(t) ? null : t;
}

const STATUS_COLORS: Record<Phase["status"], string> = {
  planned: "bg-gray-400",
  in_progress: "bg-blue-500",
  completed: "bg-green-500",
  blocked: "bg-red-500"
};

function statusColor(status: Phase["status"]) {
  return STATUS_COLORS[status] ?? "bg-gray-400";
}

const STATUSES: Phase["status"][] = ["planned", "in_progress", "completed", "blocked"];

type NewPhaseForm = {
  name: string;
  status: Phase["status"];
  planned_start: string;
  planned_end: string;
  actual_start: string;
  actual_end: string;
};

function PhaseForm({ form, onChange, onSubmit }: {
  form: NewPhaseForm;
  onChange: (next: NewPhaseForm) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const canSubmit = form.name.trim().length > 0;
  return (
    <form onSubmit={onSubmit} className="bg-white border rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.phaseNameLabel}</label>
          <input
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.statusLabel}</label>
          <select
            value={form.status}
            onChange={(e) => onChange({ ...form, status: e.target.value as Phase["status"] })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STRINGS.phaseStatusLabels[s]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.plannedStartLabel}</label>
          <input
            type="date"
            value={form.planned_start}
            onChange={(e) => onChange({ ...form, planned_start: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.plannedEndLabel}</label>
          <input
            type="date"
            value={form.planned_end}
            onChange={(e) => onChange({ ...form, planned_end: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.actualStartLabel}</label>
          <input
            type="date"
            value={form.actual_start}
            onChange={(e) => onChange({ ...form, actual_start: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.actualEndLabel}</label>
          <input
            type="date"
            value={form.actual_end}
            onChange={(e) => onChange({ ...form, actual_end: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {STRINGS.saveLabel}
        </button>
      </div>
    </form>
  );
}

function PhaseItem({ phase, minStart, total, onFieldChange, onSave, onDelete }: {
  phase: Phase;
  minStart: number | null;
  total: number;
  onFieldChange: (id: string, field: keyof Phase, value: any) => void;
  onSave: (p: Phase) => void;
  onDelete: (p: Phase) => void;
}) {
  const pStart = parseDate(phase.planned_start) ?? parseDate(phase.actual_start) ?? minStart;
  const pEnd = parseDate(phase.planned_end) ?? parseDate(phase.actual_end) ?? pStart;
  const left = minStart !== null && pStart !== null ? Math.max(0, Math.min(100, ((pStart - minStart) / total) * 100)) : 0;
  const width = pEnd !== null && pStart !== null ? Math.max(2, Math.min(100, ((pEnd - pStart) / total) * 100)) : 5;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-sm text-gray-900">{phase.name}</div>
        <span className="text-xs text-gray-600">{STRINGS.phaseStatusLabels[phase.status]}</span>
      </div>

      <div className="relative w-full h-3 bg-gray-200 rounded">
        <div className={`absolute h-3 rounded ${statusColor(phase.status)}`} style={{ left: `${left}%`, width: `${width}%` }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mt-3">
        <input
          className="px-2 py-1 border rounded text-sm"
          value={phase.name}
          onChange={(e) => onFieldChange(phase.id, "name", e.target.value)}
          placeholder={STRINGS.phaseNameLabel}
        />
        <select
          className="px-2 py-1 border rounded text-sm"
          value={phase.status}
          onChange={(e) => onFieldChange(phase.id, "status", e.target.value as Phase["status"])}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STRINGS.phaseStatusLabels[s]}</option>
          ))}
        </select>
        <input
          type="date"
          className="px-2 py-1 border rounded text-sm"
          value={phase.planned_start ?? ""}
          onChange={(e) => onFieldChange(phase.id, "planned_start", e.target.value || null)}
        />
        <input
          type="date"
          className="px-2 py-1 border rounded text-sm"
          value={phase.planned_end ?? ""}
          onChange={(e) => onFieldChange(phase.id, "planned_end", e.target.value || null)}
        />
        <input
          type="date"
          className="px-2 py-1 border rounded text-sm"
          value={phase.actual_start ?? ""}
          onChange={(e) => onFieldChange(phase.id, "actual_start", e.target.value || null)}
        />
        <input
          type="date"
          className="px-2 py-1 border rounded text-sm"
          value={phase.actual_end ?? ""}
          onChange={(e) => onFieldChange(phase.id, "actual_end", e.target.value || null)}
        />
      </div>

      <div className="flex justify-end gap-2 mt-3">
        <button className="px-3 py-1 rounded bg-blue-600 text-white text-sm" onClick={() => onSave(phase)}>
          {STRINGS.saveLabel}
        </button>
        <button className="px-3 py-1 rounded border text-sm" onClick={() => onDelete(phase)}>
          {STRINGS.deleteLabel}
        </button>
      </div>
    </div>
  );
}

export function PhaseGantt({ projectId }: { projectId: string }) {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPhase, setNewPhase] = useState<NewPhaseForm>({
    name: "",
    status: "planned",
    planned_start: "",
    planned_end: "",
    actual_start: "",
    actual_end: ""
  });

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await getProjectPhases(projectId);
      setPhases(data || []);
    } catch (e: any) {
      setError(e?.message || "Erreur de chargement des phases");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProjectPhases(projectId);
        if (mounted) setPhases(data || []);
      } catch (e: any) {
        if (mounted) setError(e?.message || "Erreur de chargement des phases");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [projectId]);

  async function onAddPhase(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!newPhase.name.trim()) {
      setError("Veuillez saisir le nom de la phase.");
      return;
    }
    try {
      await createPhase(projectId, {
        name: newPhase.name,
        status: newPhase.status,
        planned_start: newPhase.planned_start ? newPhase.planned_start : null,
        planned_end: newPhase.planned_end ? newPhase.planned_end : null,
        actual_start: newPhase.actual_start ? newPhase.actual_start : null,
        actual_end: newPhase.actual_end ? newPhase.actual_end : null,
        deliverables: []
      });
      setNewPhase({
        name: "",
        status: "planned",
        planned_start: "",
        planned_end: "",
        actual_start: "",
        actual_end: ""
      });
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'ajout de la phase");
    }
  }

  function onPhaseFieldChange(id: string, field: keyof Phase, value: any) {
    setPhases((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  async function onSavePhase(p: Phase) {
    setError(null);
    try {
      const payload = {
        name: p.name,
        status: p.status,
        planned_start: p.planned_start || null,
        planned_end: p.planned_end || null,
        actual_start: p.actual_start || null,
        actual_end: p.actual_end || null,
        deliverables: p.deliverables ?? []
      };
      await updatePhase(projectId, p.id, payload);
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la mise à jour de la phase");
    }
  }

  async function onDeletePhase(p: Phase) {
    if (!confirm(STRINGS.deletePhaseConfirm || "Supprimer cette phase ?")) return;
    setError(null);
    try {
      await deletePhase(projectId, p.id);
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la suppression de la phase");
    }
  }

  if (loading) {
    return (<div className="text-sm text-gray-600">{STRINGS.loadingLabel}</div>);
  }

  if (error) {
    return (<div className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded">{error}</div>);
  }

  const starts = phases
    .map((p) => parseDate(p.planned_start) ?? parseDate(p.actual_start))
    .filter((v): v is number => v !== null);
  const ends = phases
    .map((p) => parseDate(p.planned_end) ?? parseDate(p.actual_end))
    .filter((v): v is number => v !== null);
  const minStart = starts.length ? Math.min(...starts) : null;
  const maxEnd = ends.length ? Math.max(...ends) : null;
  const total = minStart !== null && maxEnd !== null ? Math.max(maxEnd - minStart, 1) : 1;

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-700">{STRINGS.phasesGanttTitle}</div>

      <PhaseForm form={newPhase} onChange={setNewPhase} onSubmit={onAddPhase} />

      {phases.length === 0 ? (
        <div className="text-sm text-gray-600">{STRINGS.noPhases}</div>
      ) : (
        <div className="space-y-4">
          {phases.map((p) => (
            <PhaseItem
              key={p.id}
              phase={p}
              minStart={minStart}
              total={total}
              onFieldChange={onPhaseFieldChange}
              onSave={onSavePhase}
              onDelete={onDeletePhase}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PhaseGantt;