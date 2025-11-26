import { useEffect, useMemo, useState } from "react";
import type { Phase } from "../lib/api";
import { getProjectPhases, createPhase, updatePhase, deletePhase } from "../lib/api";
import { STRINGS } from "../lib/strings";
import PhaseTimeline from "./PhaseTimeline";
import PhaseCard from "./PhaseCard";
import { Info, CheckCircle } from "lucide-react";

function parseDate(d: string | null): number | null { if (!d) return null; const t = new Date(d).getTime(); return isNaN(t) ? null : t; }

const STATUSES: Phase["status"][] = ["planned", "in_progress", "completed", "blocked"];

type NewPhaseForm = {
  name: string;
  status: Phase["status"];
  planned_start: string;
  planned_end: string;
  actual_start: string;
  actual_end: string;
};

function progressForPhase(p: Phase): number {
  if (p.status === "completed") return 100;
  if (p.status === "planned") return 0;
  const ps = parseDate(p.planned_start) ?? parseDate(p.actual_start);
  const pe = parseDate(p.planned_end) ?? parseDate(p.actual_end);
  if (!ps || !pe || pe <= ps) return p.status === "blocked" ? 0 : 50;
  const now = Date.now();
  const pct = Math.max(0, Math.min(100, ((now - ps) / (pe - ps)) * 100));
  return p.status === "blocked" ? Math.min(pct, 90) : pct;
}

function PhaseForm({ form, onChange, onSubmit }: { form: NewPhaseForm; onChange: (next: NewPhaseForm) => void; onSubmit: (e: React.FormEvent) => void; }) {
  const canSubmit = form.name.trim().length > 0;
  return (
    <form onSubmit={onSubmit} className="bg-white border rounded-xl p-4 space-y-3 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.phaseNameLabel}</label>
          <input value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.statusLabel}</label>
          <select value={form.status} onChange={(e) => onChange({ ...form, status: e.target.value as Phase["status"] })} className="w-full px-3 py-2 border rounded-lg">
            {STATUSES.map((s) => (<option key={s} value={s}>{STRINGS.phaseStatusLabels[s]}</option>))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.plannedStartLabel}</label>
          <input type="date" value={form.planned_start} onChange={(e) => onChange({ ...form, planned_start: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.plannedEndLabel}</label>
          <input type="date" value={form.planned_end} onChange={(e) => onChange({ ...form, planned_end: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.actualStartLabel}</label>
          <input type="date" value={form.actual_start} onChange={(e) => onChange({ ...form, actual_start: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.actualEndLabel}</label>
          <input type="date" value={form.actual_end} onChange={(e) => onChange({ ...form, actual_end: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={!canSubmit} className="px-4 py-2 rounded-lg bg-rdcBlue text-white hover:bg-rdcBlueDark disabled:opacity-50 inline-flex items-center gap-1">
          {STRINGS.saveLabel}
        </button>
      </div>
    </form>
  );
}

function PhaseItem({ phase, onFieldChange, onSave, onDelete, isSelected, readOnly }: { phase: Phase; onFieldChange: (id: string, field: keyof Phase, value: any) => void; onSave: (p: Phase) => Promise<void> | void; onDelete: (p: Phase) => void; isSelected?: boolean; readOnly?: boolean; }) {
  return <PhaseCard phase={phase} onFieldChange={onFieldChange} onSave={onSave} onDelete={onDelete} isSelected={isSelected} readOnly={readOnly} />;
}

export function PhaseGantt({ projectId, readOnly }: { projectId: string; readOnly?: boolean }) {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newPhase, setNewPhase] = useState<NewPhaseForm>({ name: "", status: "planned", planned_start: "", planned_end: "", actual_start: "", actual_end: "" });

  async function refresh() {
    setLoading(true); setError(null);
    try { const data = await getProjectPhases(projectId); setPhases(data || []); }
    catch (e: any) { setError(e?.message || "Erreur de chargement des phases"); }
    finally { setLoading(false); }
  }

  useEffect(() => { let mounted = true; (async () => { try { const data = await getProjectPhases(projectId); if (mounted) setPhases(data || []); } catch (e: any) { if (mounted) setError(e?.message || "Erreur de chargement des phases"); } finally { if (mounted) setLoading(false); } })(); return () => { mounted = false; }; }, [projectId]);

  async function onAddPhase(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (!newPhase.name.trim()) { setError("Veuillez saisir le nom de la phase."); return; }
    try {
      await createPhase(projectId, { name: newPhase.name, status: newPhase.status, planned_start: newPhase.planned_start ? newPhase.planned_start : null, planned_end: newPhase.planned_end ? newPhase.planned_end : null, actual_start: newPhase.actual_start ? newPhase.actual_start : null, actual_end: newPhase.actual_end ? newPhase.actual_end : null, deliverables: [] });
      setNewPhase({ name: "", status: "planned", planned_start: "", planned_end: "", actual_start: "", actual_end: "" });
      setFlash("Phase ajoutée avec succès"); setTimeout(() => setFlash(null), 2000);
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'ajout de la phase");
    }
  }

  function onPhaseFieldChange(id: string, field: keyof Phase, value: any) { setPhases((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))); }

  async function onSavePhase(p: Phase) {
    setError(null);
    try {
      const payload = { name: p.name, status: p.status, planned_start: p.planned_start || null, planned_end: p.planned_end || null, actual_start: p.actual_start || null, actual_end: p.actual_end || null, deliverables: p.deliverables ?? [] };
      await updatePhase(projectId, p.id, payload);
      setFlash("Phase mise à jour avec succès"); setTimeout(() => setFlash(null), 2000);
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
      setFlash("Phase supprimée"); setTimeout(() => setFlash(null), 2000);
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la suppression de la phase");
    }
  }

  const overall = useMemo(() => {
    if (!phases.length) return 0;
    const sum = phases.reduce((acc, p) => acc + progressForPhase(p), 0);
    return Math.round(sum / phases.length);
  }, [phases]);

  const counts = useMemo(() => {
    const c = { planned: 0, in_progress: 0, completed: 0, blocked: 0, delayed: 0 } as Record<string, number>;
    phases.forEach(p => { c[p.status]++; if (p.actual_end && p.planned_end && new Date(p.actual_end) > new Date(p.planned_end)) c.delayed++; });
    return c;
  }, [phases]);

  if (loading) return (<div className="text-sm text-gray-600">{STRINGS.loadingLabel}</div>);
  if (error) return (<div className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded">{error}</div>);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900">{STRINGS.phasesGanttTitle}</div>
            <div className="text-xs text-gray-600 flex items-center gap-1" title="Résumé du projet"><Info className="w-4 h-4" />Planifiées: {counts.planned} · En cours: {counts.in_progress} · Terminées: {counts.completed} · Bloquées: {counts.blocked} · En retard: {counts.delayed}</div>
          </div>
          <div className="text-sm font-display font-extrabold text-rdcTextPrimary">{overall}% terminé</div>
        </div>
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={overall} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-2 rounded-full bg-rdcBlue transition-all duration-700" style={{ width: `${overall}%` }} />
        </div>
      </div>

      {flash && !readOnly && (<div className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded inline-flex items-center gap-1"><CheckCircle className="w-4 h-4" />{flash}</div>)}

      {!readOnly && (<PhaseForm form={newPhase} onChange={setNewPhase} onSubmit={onAddPhase} />)}

      {phases.length === 0 ? (
        <div className="text-sm text-gray-600">{STRINGS.noPhases}</div>
      ) : (
        <div className="space-y-4">
          <PhaseTimeline phases={phases} selectedId={selectedId} onSelect={(id) => setSelectedId(id)} />
          {phases.map((p) => (
            <PhaseItem key={p.id} phase={p} onFieldChange={onPhaseFieldChange} onSave={onSavePhase} onDelete={onDeletePhase} isSelected={selectedId === p.id} readOnly={readOnly} />
          ))}
        </div>
      )}
    </div>
  );
}

export default PhaseGantt;
