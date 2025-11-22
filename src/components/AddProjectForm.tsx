import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';
import { X, Save } from 'lucide-react';
import { STRINGS } from '../lib/strings';
import { createProject, getObjectives, linkProjectObjective, createPhase, createObjective } from '../lib/api';

type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

type Props = {
  onClose: () => void;
  onCreated: () => void;
  isModal?: boolean;
};

const PROVINCES = [
  'Kinshasa', 'Kongo Central', 'Kwango', 'Kwilu', 'Mai-Ndombe',
  'Kasaï', 'Kasaï-Central', 'Kasaï-Oriental', 'Lomami', 'Sankuru',
  'Maniema', 'Sud-Kivu', 'Nord-Kivu', 'Ituri', 'Haut-Uélé', 'Tshopo',
  'Bas-Uélé', 'Nord-Ubangi', 'Mongala', 'Sud-Ubangi', 'Équateur',
  'Tshuapa', 'Tanganyika', 'Haut-Lomami', 'Lualaba', 'Haut-Katanga'
];

const SECTORS = [
  'Infrastructure', 'Éducation', 'Santé', 'Agriculture',
  'Eau et assainissement', 'Énergie', 'Transport', 'Autre'
];

const STATUSES = ['planned','in_progress','completed','delayed','cancelled'] as const;

export function AddProjectForm({ onClose, onCreated, isModal = true }: Props) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    sector: SECTORS[0],
    province: PROVINCES[0],
    city: '',
    ministry: '',
    responsible_person: '',
    budget: 0,
    status: 'planned' as ProjectInsert['status'],
    start_date: '',
    end_date: ''
  });

  const [objectives, setObjectives] = useState<Awaited<ReturnType<typeof getObjectives>>>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<Record<string, number>>({});
  const [showAddObjectiveForm, setShowAddObjectiveForm] = useState(false);
  const [newObjective, setNewObjective] = useState<{ code: string; title: string; level: 'national'|'provincial'|'territorial'; sector: string }>({ code: '', title: '', level: 'national', sector: SECTORS[0] });

  // load objectives
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getObjectives();
        if (mounted) setObjectives(data || []);
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const canCreate = !!profile && (profile.role === 'government' || profile.role === 'partner');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'budget' ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user || !canCreate) {
      setError(STRINGS.cannotCreate);
      return;
    }

    if (!form.title || !form.description || !form.city || !form.ministry || !form.responsible_person || !form.start_date || !form.end_date) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      setLoading(true);
      const payload: Omit<ProjectInsert, 'created_by'> & { created_by?: ProjectInsert['created_by'] } = {
        title: form.title,
        description: form.description,
        sector: form.sector,
        status: form.status,
        budget: form.budget || 0,
        spent: 0,
        province: form.province,
        city: form.city,
        start_date: form.start_date,
        end_date: form.end_date,
        ministry: form.ministry,
        responsible_person: form.responsible_person,
      };

const { images: _images, created_by: _createdBy, ...rest } = payload;
const created = await createProject(rest);

      // Link selected objectives with weights
      const links = Object.entries(selectedObjectives);
      if (links.length > 0) {
        await Promise.all(links.map(([objective_id, weight]) => linkProjectObjective(created.id, { objective_id, weight })));
      }

      // Initialize standard phases (Planification, Exécution, Évaluation)
      try {
        const start = new Date(form.start_date);
        const end = new Date(form.end_date);
        const total = end.getTime() - start.getTime();
        if (!isNaN(total) && total > 0) {
          const p1End = new Date(start.getTime() + total / 3);
          const p2End = new Date(start.getTime() + (2 * total) / 3);
          await createPhase(created.id, { name: 'Planification', status: 'planned', planned_start: start.toISOString().slice(0,10), planned_end: p1End.toISOString().slice(0,10), actual_start: null, actual_end: null, deliverables: [] });
          await createPhase(created.id, { name: 'Exécution', status: 'planned', planned_start: p1End.toISOString().slice(0,10), planned_end: p2End.toISOString().slice(0,10), actual_start: null, actual_end: null, deliverables: [] });
          await createPhase(created.id, { name: 'Évaluation', status: 'planned', planned_start: p2End.toISOString().slice(0,10), planned_end: end.toISOString().slice(0,10), actual_start: null, actual_end: null, deliverables: [] });
        } else {
          await createPhase(created.id, { name: 'Planification', status: 'planned', planned_start: null, planned_end: null, actual_start: null, actual_end: null, deliverables: [] });
          await createPhase(created.id, { name: 'Exécution', status: 'planned', planned_start: null, planned_end: null, actual_start: null, actual_end: null, deliverables: [] });
          await createPhase(created.id, { name: 'Évaluation', status: 'planned', planned_start: null, planned_end: null, actual_start: null, actual_end: null, deliverables: [] });
        }
      } catch {
        // ignore phase init errors silently
      }

      setSuccess(STRINGS.successProjectAdded);
      onCreated();
    } catch (err: any) {
      setError(err.message || STRINGS.errorProjectCreate);
    } finally {
      setLoading(false);
    }
  };

  const refreshObjectives = async () => {
    try {
      const data = await getObjectives();
      setObjectives(data || []);
    } catch {}
  };

  const handleNewObjectiveChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewObjective(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const created = await createObjective({
        code: newObjective.code.trim(),
        title: newObjective.title.trim(),
        level: newObjective.level,
        sector: newObjective.sector
      });
      setShowAddObjectiveForm(false);
      setNewObjective({ code: '', title: '', level: 'national', sector: SECTORS[0] });
      await refreshObjectives();
      setSelectedObjectives(prev => ({ ...prev, [created.id]: 1 }));
    } catch (err: any) {
      setError(err?.message || "Impossible de créer l'objectif.");
    }
  };

  return (
    <div className={isModal ? "fixed inset-0 z-50 flex items-center justify-center" : "min-h-screen bg-gray-50 flex items-center justify-center py-8"}>
      {isModal && <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose}></div>}
      <div className="relative bg-white w-full max-w-2xl rounded-lg shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{STRINGS.addProject}</h2>
          <button onClick={onClose} className="p-2 text-gray-600 hover:text-gray-900" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!canCreate && (
          <div className="p-4 text-sm text-red-700 bg-red-50">
            {STRINGS.cannotCreate}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre*</label>
            <input name="title" value={form.title} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" rows={4} required></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secteur*</label>
            <select name="sector" value={form.sector} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
              {SECTORS.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Province*</label>
            <select name="province" value={form.province} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
              {PROVINCES.map((p) => (<option key={p} value={p}>{p}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville*</label>
            <input name="city" value={form.city} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.ministryLabel}</label>
            <input name="ministry" value={form.ministry} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsable*</label>
            <input name="responsible_person" value={form.responsible_person} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget (CDF)</label>
            <input type="number" name="budget" value={form.budget} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" min={0} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select name="status" value={form.status} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
              {STATUSES.map((s) => (<option key={s} value={s}>{STRINGS.projectStatusLabels[s] ?? s}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.startDateLabel}</label>
            <input type="date" name="start_date" value={form.start_date} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.endDateLabel}</label>
            <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">{STRINGS.pagObjectivesLabel}</label>
            <div className="border rounded-lg p-3 max-h-64 overflow-auto space-y-3">
              {canCreate && (
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setShowAddObjectiveForm(v => !v)} className="text-xs px-2 py-1 rounded border hover:bg-gray-50">
                    {STRINGS.addObjectiveLabel}
                  </button>
                </div>
              )}

              {showAddObjectiveForm && canCreate && (
                <form onSubmit={handleCreateObjective} className="bg-gray-50 border rounded p-3 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">{STRINGS.codeLabel}</label>
                      <input name="code" value={newObjective.code} onChange={handleNewObjectiveChange} className="w-full px-2 py-1 border rounded text-sm" required />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-700 mb-1">{STRINGS.titleLabel}</label>
                      <input name="title" value={newObjective.title} onChange={handleNewObjectiveChange} className="w-full px-2 py-1 border rounded text-sm" required />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">{STRINGS.levelLabel}</label>
                      <select name="level" value={newObjective.level} onChange={handleNewObjectiveChange} className="w-full px-2 py-1 border rounded text-sm">
                        {(['national','provincial','territorial'] as const).map(l => (<option key={l} value={l}>{l}</option>))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-700 mb-1">{STRINGS.sectorLabel}</label>
                      <select name="sector" value={newObjective.sector} onChange={handleNewObjectiveChange} className="w-full px-2 py-1 border rounded text-sm">
                        {SECTORS.map(s => (<option key={s} value={s}>{s}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowAddObjectiveForm(false)} className="text-xs px-2 py-1 rounded border">{STRINGS.cancelLabel}</button>
                    <button type="submit" className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">{STRINGS.saveLabel}</button>
                  </div>
                </form>
              )}

              {objectives.length === 0 ? (
                <div className="text-sm text-gray-500">{STRINGS.noObjectivesLabel}</div>
              ) : (
                objectives.map((o) => (
                  <div key={o.id} className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedObjectives[o.id] !== undefined}
                        onChange={(e) => {
                          setSelectedObjectives(prev => {
                            const next = { ...prev };
                            if (e.target.checked) next[o.id] = 1; else delete next[o.id];
                            return next;
                          });
                        }}
                      />
                      <span className="font-medium">{o.code}</span> — {o.title} <span className="text-xs text-gray-500">({o.level})</span>
                    </label>
                    {selectedObjectives[o.id] !== undefined && (
                      <select
                        value={selectedObjectives[o.id]}
                        onChange={(e) => setSelectedObjectives(prev => ({ ...prev, [o.id]: Number(e.target.value) }))}
                        className="px-2 py-1 border rounded text-xs"
                        aria-label={STRINGS.weightLabel}
                      >
                        {[1,2,3,4,5].map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {error && <div className="md:col-span-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded">{error}</div>}
          {success && <div className="md:col-span-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded">{success}</div>}

          <div className="md:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">Annuler</button>
            <button type="submit" disabled={loading || !canCreate} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
              <Save className="w-4 h-4" />
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}