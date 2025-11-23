import { useEffect, useMemo, useState } from 'react';
import type { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { getProjectActions, updateProject, createAlert, type ProjectAction } from '../lib/api';

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

  const [alertType, setAlertType] = useState<'budget_overrun'|'delay'|'milestone_missed'>('delay');
  const [alertSeverity, setAlertSeverity] = useState<'low'|'medium'|'high'|'critical'>('medium');
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [creatingAlert, setCreatingAlert] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

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

  const handleUpdate = async () => {
    if (!canEdit) return;
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Échec de mise à jour du projet';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAlert = async () => {
    if (!canEdit || creatingAlert || !alertMessage.trim()) return;
    setCreatingAlert(true);
    setAlertSuccess(null);
    setError(null);
    try {
      await createAlert({ project_id: project.id, type: alertType, severity: alertSeverity, message: alertMessage.trim() });
      setAlertSuccess('Alerte créée');
      setAlertMessage('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Échec de création de l\'alerte';
      setError(msg);
    } finally {
      setCreatingAlert(false);
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Actions sur le projet</h4>
      {!canEdit && (
        <p className="text-xs text-gray-600 mb-3">Accès restreint: seuls les rôles Gouvernement/Partenaire peuvent modifier.</p>
      )}
      <div className="space-y-3">
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
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600">Utilisation: <span className="font-semibold">{budget > 0 ? Math.round((spent / budget) * 100) : 0}%</span></p>
          <button
            onClick={handleUpdate}
            disabled={!canEdit || saving || !hasChanges}
            className={`px-3 py-1.5 rounded text-sm font-medium ${(!canEdit || saving || !hasChanges) ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {saving ? 'Sauvegarde...' : 'Mettre à jour'}
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <div className="mt-4">
        <h5 className="text-xs font-semibold text-gray-800 mb-2">Créer une alerte rapide</h5>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <select
              className="w-full border rounded px-2 py-1 text-xs"
              value={alertType}
              onChange={(e) => setAlertType(e.target.value as 'budget_overrun'|'delay'|'milestone_missed')}
              disabled={!canEdit || creatingAlert}
              aria-label="Type d'alerte"
            >
              <option value="delay">Retard</option>
              <option value="budget_overrun">Dépassement budgétaire</option>
              <option value="milestone_missed">Jalon manqué</option>
            </select>
          </div>
          <div>
            <select
              className="w-full border rounded px-2 py-1 text-xs"
              value={alertSeverity}
              onChange={(e) => setAlertSeverity(e.target.value as 'low'|'medium'|'high'|'critical')}
              disabled={!canEdit || creatingAlert}
              aria-label="Sévérité de l'alerte"
            >
              <option value="low">Faible</option>
              <option value="medium">Moyenne</option>
              <option value="high">Élevée</option>
              <option value="critical">Critique</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <input
              type="text"
              className="w-full border rounded px-2 py-1 text-xs"
              placeholder="Message"
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
              disabled={!canEdit || creatingAlert}
              aria-label="Message de l'alerte"
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-green-700">{alertSuccess}</div>
          <button
            onClick={handleCreateAlert}
            disabled={!canEdit || creatingAlert || !alertMessage.trim()}
            className={`px-3 py-1.5 rounded text-xs font-medium ${(!canEdit || creatingAlert || !alertMessage.trim()) ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
          >
            {creatingAlert ? 'Création...' : 'Créer l\'alerte'}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <h5 className="text-xs font-semibold text-gray-800 mb-2">Journal des actions</h5>
        {loadingActions ? (
          <p className="text-xs text-gray-500">Chargement...</p>
        ) : actions.length === 0 ? (
          <p className="text-xs text-gray-500">Aucune action enregistrée</p>
        ) : (
          <div className="space-y-2">
            {actions.map((a) => (
              <div key={a.id} className="border rounded p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{a.action_type === 'status_update' ? 'Changement de statut' : a.action_type === 'budget_update' ? 'Mise à jour du budget' : 'Mise à jour des champs'}</span>
                  <span className="text-gray-500">{new Date(a.created_at).toLocaleString('fr-FR')}</span>
                </div>
                {(() => {
                  const d = a.details as unknown;
                  if (d && typeof d === 'object' && d !== null && 'changed' in (d as Record<string, unknown>)) {
                    const ch = (d as { changed: Record<string, unknown> }).changed;
                    return (
                      <div className="mt-1 text-gray-700">
                        {Object.entries(ch).map(([k, v]) => (
                          <div key={k} className="flex items-center gap-2">
                            <span className="w-28 capitalize text-gray-600">{k}</span>
                            <span className="font-mono">{k === 'budget' || k === 'spent' ? formatCurrency(Number(v)) : String(v)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectActionsPanel;