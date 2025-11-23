import { useEffect, useMemo, useState } from 'react';
import type { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { getProjectActions, updateProject, type ProjectAction, getProfiles } from '../lib/api';
import { Building2, DollarSign, Calendar, MapPin, AlertTriangle, CheckCircle, X } from 'lucide-react';

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

const STATUS_LABELS: Record<Project['status'], string> = {
  planned: 'Planifié',
  in_progress: 'En cours',
  completed: 'Terminé',
  delayed: 'En retard',
  cancelled: 'Annulé'
};
const STATUS_BADGE_CLASSES: Record<Project['status'], string> = {
  planned: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  delayed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600'
};

const FIELD_LABELS_FR: Record<string, string> = {
  budget: 'Budget',
  spent: 'Dépensé',
  status: 'Statut',
  province: 'Province',
  city: 'Ville',
  ministry: 'Ministère',
  responsible_person: 'Responsable',
  sector: 'Secteur',
  start_date: 'Début',
  end_date: 'Fin',
  actual_end_date: 'Fin réelle',
  latitude: 'Latitude',
  longitude: 'Longitude'
};

type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectActionsPanelProps {
  project: Project;
  onUpdated?: (p: Project) => void;
}

export function ProjectActionsPanel({ project, onUpdated }: ProjectActionsPanelProps) {
  const { profile } = useAuth();
  const canEdit = !!profile && (profile.role === 'government' || profile.role === 'partner');

  const [status, setStatus] = useState<Project['status']>(project.status);
  const [budget, setBudget] = useState<number>(Number(project.budget || 0));
  const [spent, setSpent] = useState<number>(Number(project.spent || 0));
  const [saving, setSaving] = useState(false);
  const [actions, setActions] = useState<ProjectAction[]>([]);
  const [loadingActions, setLoadingActions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [province, setProvince] = useState<string>(project.province || '');
  const [city, setCity] = useState<string>(project.city || '');
  const [sector, setSector] = useState<string>(project.sector || '');
  const [ministry, setMinistry] = useState<string>(project.ministry || '');
  const [responsiblePerson, setResponsiblePerson] = useState<string>(project.responsible_person || '');
  const [startDate, setStartDate] = useState<string>(project.start_date ? project.start_date.slice(0, 10) : '');
  const [endDate, setEndDate] = useState<string>(project.end_date ? project.end_date.slice(0, 10) : '');
  const [actualEndDate, setActualEndDate] = useState<string>(project.actual_end_date ? project.actual_end_date.slice(0, 10) : '');
  const [latitude, setLatitude] = useState<number | null>(project.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(project.longitude ?? null);

  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [profilesById, setProfilesById] = useState<Record<string, { full_name: string; role: string }>>({});

  useEffect(() => {
    setStatus(project.status);
    setBudget(Number(project.budget || 0));
    setSpent(Number(project.spent || 0));
    setProvince(project.province || '');
    setCity(project.city || '');
    setSector(project.sector || '');
    setMinistry(project.ministry || '');
    setResponsiblePerson(project.responsible_person || '');
    setStartDate(project.start_date ? project.start_date.slice(0, 10) : '');
    setEndDate(project.end_date ? project.end_date.slice(0, 10) : '');
    setActualEndDate(project.actual_end_date ? project.actual_end_date.slice(0, 10) : '');
    setLatitude(project.latitude ?? null);
    setLongitude(project.longitude ?? null);
  }, [project]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingActions(true);
      try {
        const rows = await getProjectActions(project.id);
        if (mounted) setActions(rows);
        try {
          const profs = await getProfiles();
          if (mounted) setProfilesById(Object.fromEntries(profs.map((p) => [p.id, { full_name: p.full_name, role: p.role }])));
        } catch {}
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Erreur lors du chargement du journal des actions';
        if (mounted) setError(msg);
      } finally {
        if (mounted) setLoadingActions(false);
      }
    })();
    return () => { mounted = false; };
  }, [project.id]);

  const loadActions = async () => {
    setLoadingActions(true);
    try {
      const rows = await getProjectActions(project.id);
      setActions(rows);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur lors du chargement du journal des actions';
      setError(msg);
    } finally {
      setLoadingActions(false);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const changed = useMemo(() => ({
    status: status !== project.status ? status : undefined,
    budget: budget !== Number(project.budget || 0) ? budget : undefined,
    spent: spent !== Number(project.spent || 0) ? spent : undefined,
    province: province !== (project.province || '') ? province : undefined,
    city: city !== (project.city || '') ? city : undefined,
    sector: sector !== (project.sector || '') ? sector : undefined,
    ministry: ministry !== (project.ministry || '') ? ministry : undefined,
    responsible_person: responsiblePerson !== (project.responsible_person || '') ? responsiblePerson : undefined,
    start_date: startDate && startDate !== (project.start_date ? project.start_date.slice(0, 10) : '') ? startDate : undefined,
    end_date: endDate && endDate !== (project.end_date ? project.end_date.slice(0, 10) : '') ? endDate : undefined,
    actual_end_date: actualEndDate && actualEndDate !== (project.actual_end_date ? project.actual_end_date.slice(0, 10) : '') ? actualEndDate : undefined,
    latitude: latitude !== (project.latitude ?? null) ? latitude : undefined,
    longitude: longitude !== (project.longitude ?? null) ? longitude : undefined,
  }), [status, budget, spent, province, city, sector, ministry, responsiblePerson, startDate, endDate, actualEndDate, latitude, longitude, project]);

  const hasChanges = useMemo(() => Object.values(changed).some((v) => v !== undefined), [changed]);
  const utilization = useMemo(() => (budget > 0 ? (spent / budget) * 100 : 0), [budget, spent]);
  const utilizationAlert = utilization > 90;
  const dateError = useMemo(() => {
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e < s) return 'La date de fin doit être postérieure à la date de début';
    }
    return null;
  }, [startDate, endDate]);

  const handleUpdate = async () => {
    if (!canEdit) return;
    if (dateError) { setError(dateError); return; }
    const payload: Partial<Database['public']['Tables']['projects']['Update']> = {};
    if (changed.status !== undefined) payload.status = changed.status;
    if (changed.budget !== undefined) payload.budget = changed.budget as number;
    if (changed.spent !== undefined) payload.spent = changed.spent as number;
    if (changed.province !== undefined) payload.province = changed.province as string;
    if (changed.city !== undefined) payload.city = changed.city as string;
    if (changed.sector !== undefined) payload.sector = changed.sector as string;
    if (changed.ministry !== undefined) payload.ministry = changed.ministry as string;
    if (changed.responsible_person !== undefined) payload.responsible_person = changed.responsible_person as string;
    if (changed.start_date !== undefined) payload.start_date = changed.start_date as string;
    if (changed.end_date !== undefined) payload.end_date = changed.end_date as string;
    if (changed.actual_end_date !== undefined) payload.actual_end_date = changed.actual_end_date as string;
    if (changed.latitude !== undefined) payload.latitude = changed.latitude as number | null;
    if (changed.longitude !== undefined) payload.longitude = changed.longitude as number | null;
    if (Object.keys(payload).length === 0) return;

    setSaving(true);
    setError(null);
    try {
      const updated = await updateProject(project.id, payload);
      onUpdated?.(updated as Project);
      await loadActions();
      setUpdateSuccess('Projet mis à jour avec succès');
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Échec de mise à jour du projet';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const actionIcon = (t: ProjectAction['action_type']) => t === 'status_update' ? <Calendar className="w-4 h-4" /> : t === 'budget_update' ? <DollarSign className="w-4 h-4" /> : <MapPin className="w-4 h-4" />;
  const actionColor = (t: ProjectAction['action_type']) => t === 'status_update' ? 'border-blue-200' : t === 'budget_update' ? 'border-green-200' : 'border-orange-200';
  const typeLabel = (t: ProjectAction['action_type']) => t === 'status_update' ? 'Changement de statut' : t === 'budget_update' ? 'Mise à jour du budget' : 'Mise à jour des champs';
  const formatDetailValue = (k: string, v: unknown) => {
    if (k === 'budget' || k === 'spent') return formatCurrency(Number(v));
    if (k === 'status' && typeof v === 'string') return STATUS_LABELS[v as Project['status']] || v;
    if (k.endsWith('_date') && typeof v === 'string') {
      const d = new Date(v);
      return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('fr-FR');
    }
    return String(v);
  };

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(actions.length / pageSize));
  const pagedActions = actions.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]);

  const handleReset = () => {
    setStatus(project.status);
    setBudget(Number(project.budget || 0));
    setSpent(Number(project.spent || 0));
    setProvince(project.province || '');
    setCity(project.city || '');
    setSector(project.sector || '');
    setMinistry(project.ministry || '');
    setResponsiblePerson(project.responsible_person || '');
    setStartDate(project.start_date ? project.start_date.slice(0, 10) : '');
    setEndDate(project.end_date ? project.end_date.slice(0, 10) : '');
    setActualEndDate(project.actual_end_date ? project.actual_end_date.slice(0, 10) : '');
    setLatitude(project.latitude ?? null);
    setLongitude(project.longitude ?? null);
  };

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">Actions sur le projet</h4>
        {updateSuccess && (
          <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />{updateSuccess}</span>
        )}
      </div>
      {!canEdit && (
        <p className="text-xs text-gray-600 mb-3">Accès restreint: seuls les rôles Gouvernement/Partenaire peuvent modifier.</p>
      )}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-gray-800">
          <Building2 className="w-4 h-4" />
          <span className="text-xs font-semibold">Informations générales</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 w-28">Statut</label>
            <select
              className="flex-1 border rounded px-2 py-1 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as Project['status'])}
              disabled={!canEdit}
              aria-label="Changer le statut du projet"
            >
              <option value="planned">Planifié</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminé</option>
              <option value="delayed">En retard</option>
              <option value="cancelled">Annulé</option>
            </select>
            <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_BADGE_CLASSES[status]}`}>{STATUS_LABELS[status]}</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 w-28">Budget (CDF)</label>
            <input
              type="number"
              className="flex-1 border rounded px-2 py-1 text-sm"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              disabled={!canEdit}
              aria-label="Mettre à jour le budget"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 w-28">Dépensé (CDF)</label>
            <input
              type="number"
              className="flex-1 border rounded px-2 py-1 text-sm"
              value={spent}
              onChange={(e) => setSpent(Number(e.target.value))}
              disabled={!canEdit}
              aria-label="Mettre à jour le montant dépensé"
            />
          </div>
        </div>
        <div className={`rounded border p-3 ${utilizationAlert ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-800">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-semibold">Budget et dépenses</span>
            </div>
            {utilizationAlert && (<span className="text-xs text-orange-700 inline-flex items-center"><AlertTriangle className="w-3 h-3 mr-1" />Budget presque épuisé</span>)}
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full" style={{ background: `conic-gradient(#0072C6 ${Math.min(100, utilization)}%, #e5e7eb 0)` }}>
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center text-xs font-semibold">{Math.round(utilization)}%</div>
            </div>
            <div className="text-sm text-gray-700">
              <div><span className="font-mono font-semibold">{formatCurrency(budget)}</span> total</div>
              <div><span className="font-mono font-semibold">{formatCurrency(spent)}</span> dépensé</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded h-2">
              <div className={`${utilizationAlert ? 'bg-orange-500' : 'bg-blue-600'} h-2 rounded`} style={{ width: `${Math.min(100, utilization)}%` }}></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 w-28">Ministère</label>
            <input
              type="text"
              className="flex-1 border rounded px-2 py-1 text-sm"
              value={ministry}
              onChange={(e) => setMinistry(e.target.value)}
              disabled={!canEdit}
              aria-label="Mettre à jour le ministère"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 w-28">Responsable</label>
            <input
              type="text"
              className="flex-1 border rounded px-2 py-1 text-sm"
              value={responsiblePerson}
              onChange={(e) => setResponsiblePerson(e.target.value)}
              disabled={!canEdit}
              aria-label="Mettre à jour le responsable"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 w-28">Province</label>
            <select
              className="flex-1 border rounded px-2 py-1 text-sm"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              disabled={!canEdit}
              aria-label="Mettre à jour la province"
            >
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 w-28">Ville</label>
            <input
              type="text"
              className="flex-1 border rounded px-2 py-1 text-sm"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!canEdit}
              aria-label="Mettre à jour la ville"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 w-28">Secteur</label>
            <select
              className="flex-1 border rounded px-2 py-1 text-sm"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              disabled={!canEdit}
              aria-label="Mettre à jour le secteur"
            >
              {SECTORS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 w-28">Latitude</label>
            <input
              type="number"
              className="flex-1 border rounded px-2 py-1 text-sm"
              value={latitude ?? ''}
              onChange={(e) => setLatitude(e.target.value === '' ? null : Number(e.target.value))}
              disabled={!canEdit}
              aria-label="Mettre à jour la latitude"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 w-28">Longitude</label>
            <input
              type="number"
              className="flex-1 border rounded px-2 py-1 text-sm"
              value={longitude ?? ''}
              onChange={(e) => setLongitude(e.target.value === '' ? null : Number(e.target.value))}
              disabled={!canEdit}
              aria-label="Mettre à jour la longitude"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 w-28">Début</label>
            <input
              type="date"
              className="flex-1 border rounded px-2 py-1 text-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={!canEdit}
              aria-label="Mettre à jour la date de début"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 w-28">Fin</label>
            <input
              type="date"
              className="flex-1 border rounded px-2 py-1 text-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={!canEdit}
              aria-label="Mettre à jour la date de fin"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 w-28">Fin réelle</label>
            <input
              type="date"
              className="flex-1 border rounded px-2 py-1 text-sm"
              value={actualEndDate}
              onChange={(e) => setActualEndDate(e.target.value)}
              disabled={!canEdit}
              aria-label="Mettre à jour la date de fin réelle"
            />
          </div>
        </div>
        {dateError && <div className="text-xs text-red-700 bg-red-50 px-3 py-2 rounded">{dateError}</div>}
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={!canEdit || saving || !hasChanges}
              className={`px-3 py-1.5 rounded text-sm font-medium inline-flex items-center gap-2 ${(!canEdit || saving || !hasChanges) ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
            <button
              onClick={handleUpdate}
              disabled={!canEdit || saving || !hasChanges || !!dateError}
              className={`px-3 py-1.5 rounded text-sm font-medium inline-flex items-center gap-2 ${(!canEdit || saving || !hasChanges || !!dateError) ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              <CheckCircle className="w-4 h-4" />
              {saving ? 'Sauvegarde...' : 'Mettre à jour'}
            </button>
          </div>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      

      <div className="mt-4">
        <div className="flex items-center gap-2 text-gray-800 mb-2">
          <Calendar className="w-4 h-4" />
          <h5 className="text-xs font-semibold">Journal des actions</h5>
        </div>
        {loadingActions ? (
          <p className="text-xs text-gray-500">Chargement...</p>
        ) : actions.length === 0 ? (
          <p className="text-xs text-gray-500">Aucune action enregistrée</p>
        ) : (
          <div className="space-y-2">
            {pagedActions.map((a) => (
              <div key={a.id} className={`border rounded p-2 text-xs ${actionColor(a.action_type)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {actionIcon(a.action_type)}
                    <span className="font-medium">{typeLabel(a.action_type)}</span>
                  </div>
                  <span className="text-gray-500">{new Date(a.created_at).toLocaleString('fr-FR')}</span>
                </div>
                <div className="mt-1 text-[11px] text-gray-600">Par {profilesById[a.user_id]?.full_name || `Utilisateur ${a.user_id}`}</div>
                {(() => {
                  const d = a.details as unknown;
                  if (d && typeof d === 'object' && d !== null && 'changed' in (d as Record<string, unknown>)) {
                    const ch = (d as { changed: Record<string, unknown> }).changed;
                    return (
                      <div className="mt-1 text-gray-700">
                        {Object.entries(ch).map(([k, v]) => (
                          <div key={k} className="flex items-center gap-2">
                            <span className="w-28 text-gray-600">{FIELD_LABELS_FR[k] || k}</span>
                            <span className="font-mono">{formatDetailValue(k, v)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ))}
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-600">Page {page}/{totalPages}</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} className="text-xs px-2 py-1 border rounded">Précédent</button>
                <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="text-xs px-2 py-1 border rounded">Suivant</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectActionsPanel;
