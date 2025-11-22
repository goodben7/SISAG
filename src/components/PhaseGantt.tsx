import { useEffect, useState } from "react";
import type { Phase } from "../lib/api";
import { getProjectPhases, createPhase, updatePhase, deletePhase } from "../lib/api";
import { STRINGS } from "../lib/strings";
import PhaseTimeline from "./PhaseTimeline";
import PhaseCard from "./PhaseCard";

function parseDate(d: string | null): number | null {
  if (!d) return null;
  const t = new Date(d).getTime();
  return isNaN(t) ? null : t;
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

function PhaseItem({ phase, onFieldChange, onSave, onDelete }: { phase: Phase; onFieldChange: (id: string, field: keyof Phase, value: any) => void; onSave: (p: Phase) => void; onDelete: (p: Phase) => void; }) {
  return <PhaseCard phase={phase} onFieldChange={onFieldChange} onSave={onSave} onDelete={onDelete} />;
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


  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-700">{STRINGS.phasesGanttTitle}</div>

      <PhaseForm form={newPhase} onChange={setNewPhase} onSubmit={onAddPhase} />

      {phases.length === 0 ? (
        <div className="text-sm text-gray-600">{STRINGS.noPhases}</div>
      ) : (
        <div className="space-y-4">
          {minStart !== null && maxEnd !== null && (
            <PhaseTimeline phases={phases} />
          )}
          {phases.map((p) => (
            <PhaseItem
              key={p.id}
              phase={p}
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