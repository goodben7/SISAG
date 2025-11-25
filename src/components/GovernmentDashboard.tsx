import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle, DollarSign, FileText, Plus, XCircle } from 'lucide-react';

import type { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertForm } from './AlertForm';
import { STRINGS } from '../lib/strings';
import { ProjectStatsCards } from './ProjectStatsCards';
import { ProjectStatusChart } from './ProjectStatusChart';
import { getProjects, getAlerts, getReports, updateReport } from '../lib/api';
import PhaseGantt from './PhaseGantt';
import AlignmentChecklist from './AlignmentChecklist';
import { PlanningAlertsPanel } from './PlanningAlertsPanel';
import AdditionalIndicators from './AdditionalIndicators';
import MaturityDashboard from './MaturityDashboard';
import ProjectActionsPanel from './ProjectActionsPanel';

type Project = Database['public']['Tables']['projects']['Row'];
type Alert = Database['public']['Tables']['alerts']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];

export function GovernmentDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'maturity' | 'phasesAlignment' | 'actions' | 'alerts' | 'reports'>('overview');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [showAlertModal, setShowAlertModal] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsRes, alertsRes, reportsRes] = await Promise.all([
        getProjects(),
        getAlerts(),
        getReports()
      ]);

      setProjects(projectsRes || []);
      setAlerts(alertsRes || []);
      setReports(reportsRes || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: projects.length,
    inProgress: projects.filter(p => p.status === 'in_progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    delayed: projects.filter(p => p.status === 'delayed').length,
    onTimeRate: projects.length > 0
      ? ((projects.filter(p => p.status === 'completed' && (!p.actual_end_date || new Date(p.actual_end_date) <= new Date(p.end_date))).length / projects.filter(p => p.status === 'completed').length) * 100 || 0)
      : 0,
    totalBudget: projects.reduce((sum, p) => sum + Number(p.budget), 0),
    totalSpent: projects.reduce((sum, p) => sum + Number(p.spent), 0),
    budgetUtilization: projects.reduce((sum, p) => sum + Number(p.budget), 0) > 0
      ? (projects.reduce((sum, p) => sum + Number(p.spent), 0) / projects.reduce((sum, p) => sum + Number(p.budget), 0)) * 100
      : 0,
  };
  const delayedPercent = stats.total > 0 ? (stats.delayed / stats.total) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const ALERT_SEVERITY_COLORS = {
    low: 'bg-rdcBlueLight text-rdcBlue border-rdcBlueLight',
    medium: 'bg-rdcYellowLight text-black border-rdcYellowLight',
    high: 'bg-rdcYellowLight text-black border-rdcYellowLight',
    critical: 'bg-rdcRedLight text-rdcRed border-rdcRedLight'
  };

  const ALERT_TYPE_LABELS = {
    budget_overrun: 'Dépassement budgétaire',
    delay: 'Retard',
    milestone_missed: 'Jalon manqué'
  };

  const REPORT_STATUS_COLORS = {
    pending: 'bg-rdcYellowLight text-rdcYellow',
    in_review: 'bg-rdcBlueLight text-rdcBlue',
    resolved: 'bg-rdcGreenLight text-rdcGreen',
    rejected: 'bg-rdcRedLight text-rdcRed'
  };

  const REPORT_STATUS_LABELS = {
    pending: 'En attente',
    in_review: 'En cours d\'examen',
    resolved: 'Résolu',
    rejected: 'Rejeté'
  };

  const canModerateReports = !!profile && (profile.role === 'government' || profile.role === 'partner');
  const [reportProject, setReportProject] = useState<Project | null>(null);
  const [reportsFilterProjectId, setReportsFilterProjectId] = useState<string>('');
  const changeReportStatus = async (reportId: string, status: Report['status']) => {
    try {
      const updated = await updateReport(reportId, { status });
      setReports((prev) => prev.map(r => r.id === reportId ? updated : r));
    } catch (e) { console.error('Failed to update report status', e); }
  };
  const [modAction, setModAction] = useState<{ id: string; action: 'resolved'|'rejected' } | null>(null);
  const [modNote, setModNote] = useState<string>('');
  const [modError, setModError] = useState<string | null>(null);
  const openModeration = (id: string, action: 'resolved'|'rejected') => { setModAction({ id, action }); setModNote(''); setModError(null); };
  const confirmModeration = async () => {
    if (!modAction) return;
    try {
      const updated = await updateReport(modAction.id, { status: modAction.action, resolution_notes: modNote });
      setReports((prev) => prev.map(r => r.id === modAction.id ? updated : r));
      setModAction(null);
      setModNote('');
      setModError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Échec de mise à jour';
      setModError(msg);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {showAlertModal && (
        <AlertForm
          onClose={() => setShowAlertModal(false)}
          onCreated={() => {
            setShowAlertModal(false);
            loadData();
          }}
        />
      )}
      <div className="header-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold">Tableau de Bord Gouvernemental</h1>
                <p className="text-blue-100 mt-1">Suivi et analyse de performance des projets</p>
              </div>
            </div>
            {profile && (profile.role === 'government' || profile.role === 'partner') && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAlertModal(true)}
                  className="px-4 py-2 bg-white text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
                >
                  <AlertCircle className="w-5 h-5" />
                  Ajouter une alerte
                </button>
                <button
                  onClick={() => navigate('/projects/new')}
                  className="px-4 py-2 bg-white text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  {STRINGS.addProject}
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <ProjectStatsCards stats={{ total: stats.total, inProgress: stats.inProgress, completed: stats.completed, delayed: stats.delayed, delayedPercent }} />
            </div>
            <ProjectStatusChart inProgress={stats.inProgress} completed={stats.completed} delayed={stats.delayed} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {selectedTab !== 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Taux de livraison à temps</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.onTimeRate.toFixed(1)}%</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-green-600 transition-all"
                  style={{ width: `${stats.onTimeRate}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Budget total</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBudget)}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Dépensé: <span className="font-semibold text-gray-900">{formatCurrency(stats.totalSpent)}</span>
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Utilisation budgétaire</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.budgetUtilization.toFixed(1)}%</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    stats.budgetUtilization > 100 ? 'bg-rdcRed' :
                    stats.budgetUtilization > 90 ? 'bg-rdcYellow' : 'bg-rdcBlue'
                  }`}
                  style={{ width: `${Math.min(100, stats.budgetUtilization)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <AdditionalIndicators projects={projects} alerts={alerts} />
        </div>


        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setSelectedTab('overview')}
                className={`px-6 py-4 font-medium transition-colors ${
                  selectedTab === 'overview'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Vue d'ensemble
              </button>
              <button
                onClick={() => setSelectedTab('maturity')}
                className={`px-6 py-4 font-medium transition-colors ${
                  selectedTab === 'maturity'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Évaluation de maturité
              </button>
              <button
                onClick={() => setSelectedTab('phasesAlignment')}
                className={`px-6 py-4 font-medium transition-colors ${
                  selectedTab === 'phasesAlignment'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Phases & Alignement
              </button>
              <button
                onClick={() => setSelectedTab('actions')}
                className={`px-6 py-4 font-medium transition-colors ${
                  selectedTab === 'actions'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Actions
              </button>
              <button
                onClick={() => setSelectedTab('alerts')}
                className={`px-6 py-4 font-medium transition-colors relative ${
                  selectedTab === 'alerts'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Alertes
                {alerts.filter(a => !a.is_read).length > 0 && (
                  <span className="absolute top-3 right-2 w-2 h-2 bg-red-600 rounded-full"></span>
                )}
              </button>
              <button
                onClick={() => setSelectedTab('reports')}
                className={`px-6 py-4 font-medium transition-colors ${
                  selectedTab === 'reports'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Signalements
              </button>
            </nav>
          </div>

          <div className="p-6">
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Projets récents</h3>
                {projects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    className={`border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer ${selectedProjectId === project.id ? 'border-blue-500 ring-1 ring-blue-200' : ''}`}
                    onClick={() => { setSelectedProjectId(project.id); setSelectedTab('phasesAlignment'); }}
                    role="button"
                    aria-pressed={selectedProjectId === project.id}
                    title="Sélectionner ce projet"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{project.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{project.province} - {project.sector}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">
                            Budget: <span className="font-semibold">{formatCurrency(project.budget)}</span>
                          </span>
                          <span className="text-gray-600">
                            Dépensé: <span className="font-semibold">{formatCurrency(project.spent)}</span>
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        project.status === 'completed' ? 'bg-green-100 text-green-800' :
                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        project.status === 'delayed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status === 'completed' ? 'Terminé' :
                         project.status === 'in_progress' ? 'En cours' :
                         project.status === 'delayed' ? 'En retard' :
                         project.status === 'planned' ? 'Planifié' : 'Annulé'}
                      </span>
                    </div>
                  </div>
                ))}

              </div>
            )}
            {selectedTab === 'maturity' && (
              <div className="space-y-6">
                <MaturityDashboard projects={projects} />
              </div>
            )}
            {selectedTab === 'phasesAlignment' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                  <label className="text-sm text-gray-700">Projet</label>
                  <select
                    className="border rounded px-3 py-2 text-sm"
                    value={selectedProjectId || ''}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                  >
                    <option value="">Sélectionnez un projet</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
                {selectedProjectId ? (
                  <>
                    <div className="col-span-1 md:col-span-2 border-2 border-blue-500 ring-1 ring-blue-200 rounded-lg p-4 bg-white">
                      <h4 className="text-sm font-semibold text-blue-700 mb-1">Projet sélectionné</h4>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{projects.find(p => p.id === selectedProjectId)?.title || ''}</p>
                          <p className="text-sm text-gray-600">{projects.find(p => p.id === selectedProjectId)?.province || ''} - {projects.find(p => p.id === selectedProjectId)?.sector || ''}</p>
                        </div>
                        <div className="text-sm text-gray-700">
                          <span className="mr-4">Budget: <span className="font-semibold">{formatCurrency(Number(projects.find(p => p.id === selectedProjectId)?.budget || 0))}</span></span>
                          <span>Dépensé: <span className="font-semibold">{formatCurrency(Number(projects.find(p => p.id === selectedProjectId)?.spent || 0))}</span></span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Phases — {projects.find(p => p.id === selectedProjectId)?.title || ''}</h4>
                      <PhaseGantt projectId={selectedProjectId} />
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Alignement — {projects.find(p => p.id === selectedProjectId)?.title || ''}</h4>
                      <AlignmentChecklist projectId={selectedProjectId} />
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 bg-white border rounded-lg p-6 text-sm text-gray-600">
                    {STRINGS.selectProjectForPhasesAlignment}
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'actions' && (
              <div className="grid grid-cols-1 gap-6">
                <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                  <label className="text-sm text-gray-700">Projet</label>
                  <select
                    className="border rounded px-3 py-2 text-sm"
                    value={selectedProjectId || ''}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                  >
                    <option value="">Sélectionnez un projet</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
                {selectedProjectId ? (
                  <>
                    <div className="col-span-1 md:col-span-2 border-2 border-blue-500 ring-1 ring-blue-200 rounded-lg p-4 bg-white">
                      <h4 className="text-sm font-semibold text-blue-700 mb-1">Projet sélectionné</h4>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{projects.find(p => p.id === selectedProjectId)?.title || ''}</p>
                          <p className="text-sm text-gray-600">{projects.find(p => p.id === selectedProjectId)?.province || ''} - {projects.find(p => p.id === selectedProjectId)?.sector || ''}</p>
                        </div>
                        <div className="text-sm text-gray-700">
                          <span className="mr-4">Budget: <span className="font-semibold">{formatCurrency(Number(projects.find(p => p.id === selectedProjectId)?.budget || 0))}</span></span>
                          <span>Dépensé: <span className="font-semibold">{formatCurrency(Number(projects.find(p => p.id === selectedProjectId)?.spent || 0))}</span></span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white border rounded-lg p-4 col-span-1 md:col-span-2">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Actions — {projects.find(p => p.id === selectedProjectId)?.title || ''}</h4>
                      {selectedProjectId && (
                        <ProjectActionsPanel
                          project={projects.find(p => p.id === selectedProjectId) as Project}
                          onUpdated={(p) => {
                            setProjects((prev) => prev.map((pr) => (pr.id === p.id ? p : pr)));
                          }}
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 bg-white border rounded-lg p-6 text-sm text-gray-600">
                    {STRINGS.selectProjectForPhasesAlignment}
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'alerts' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Alertes récentes</h3>
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>Aucune alerte pour le moment</p>
                  </div>
                ) : (
                  alerts.map((alert) => {
                    const pr = projects.find(p => p.id === alert.project_id) || null;
                    return (
                      <div key={alert.id} className={`border rounded-lg p-4 ${ALERT_SEVERITY_COLORS[alert.severity]}`}>
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{ALERT_TYPE_LABELS[alert.type]}</span>
                              <span className="text-xs uppercase font-medium">{STRINGS.alertSeverityLabels[alert.severity]}</span>
                            </div>
                            {pr && (
                              <button
                                type="button"
                                className="text-xs text-gray-700 mb-1 underline underline-offset-2 hover:text-blue-700"
                                onClick={() => setReportProject(pr)}
                                title="Voir le détail du projet"
                              >
                                Projet: <span className="font-bold">{pr.title}</span> — {pr.province} — {pr.sector}
                              </button>
                            )}
                            <p className="text-sm">{alert.message}</p>
                            <p className="text-xs mt-2 opacity-75">
                              {new Date(alert.created_at).toLocaleString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div className="bg-white border rounded-lg p-4">
                  <PlanningAlertsPanel />
                </div>
              </div>
            )}

            {selectedTab === 'reports' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Signalements citoyens</h3>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Projet</label>
                  <select
                    className="border rounded px-3 py-2 text-sm"
                    value={reportsFilterProjectId}
                    onChange={(e) => setReportsFilterProjectId(e.target.value)}
                  >
                    <option value="">Tous les projets</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
                {((reportsFilterProjectId ? reports.filter(r => r.project_id === reportsFilterProjectId) : reports).length === 0) ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>Aucun signalement</p>
                  </div>
                ) : (
                  (reportsFilterProjectId ? reports.filter(r => r.project_id === reportsFilterProjectId) : reports).map((report) => {
                    const pr = projects.find(p => p.id === (report.project_id || '')) || null;
                    return (
                      <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{report.title}</h4>
                            {pr && (
                              <button
                                type="button"
                                className="text-xs text-gray-700 mb-2 underline underline-offset-2 hover:text-blue-700"
                                onClick={() => setReportProject(pr)}
                                title="Voir le détail du projet"
                              >
                                Projet: <span className="font-bold">{pr.title}</span> — {pr.province} — {pr.sector}
                              </button>
                            )}
                            <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className={`px-2 py-1 rounded-full font-medium ${REPORT_STATUS_COLORS[report.status]}`}>
                                {REPORT_STATUS_LABELS[report.status]}
                              </span>
                              <span>{new Date(report.created_at).toLocaleDateString('fr-FR')}</span>
                            </div>
                            {report.resolution_notes && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs font-medium mb-1">Réponse:</p>
                                <p className="text-sm">{report.resolution_notes}</p>
                              </div>
                            )}
                          </div>
                         <div className="ml-4">
                          {canModerateReports && (
                            <div className="space-y-2 text-xs">
                              {report.status === 'pending' && (
                                <button onClick={() => changeReportStatus(report.id, 'in_review')} className="px-2 py-1 rounded border hover:bg-gray-50">Prendre en charge</button>
                              )}
                              {report.status === 'in_review' && (
                                <div className="flex gap-2">
                                  <button onClick={() => openModeration(report.id, 'resolved')} className="px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700">Marquer résolu</button>
                                  <button onClick={() => openModeration(report.id, 'rejected')} className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700">Rejeter</button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {modAction && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" role="dialog" aria-modal="true">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                      <div className="p-4 border-b">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {modAction.action === 'resolved' ? 'Marquer le signalement comme résolu' : 'Rejeter le signalement'}
                        </h4>
                      </div>
                      <div className="p-4 space-y-3">
                        <textarea
                          value={modNote}
                          onChange={(e) => setModNote(e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                          rows={4}
                          placeholder="Justification"
                        />
                        {modError && (
                          <div className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded">{modError}</div>
                        )}
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setModAction(null); setModNote(''); setModError(null); }} className="px-3 py-2 rounded border">Annuler</button>
                          <button onClick={confirmModeration} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Confirmer</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {reportProject && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" role="dialog" aria-modal="true" onClick={() => setReportProject(null)}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{reportProject.title}</h2>
                            <div className="text-sm text-gray-700">{reportProject.city}, {reportProject.province} • {reportProject.sector}</div>
                            <div className="mt-1 text-xs text-gray-600">Statut: {STRINGS.projectStatusLabels[reportProject.status]}</div>
                          </div>
                          <button onClick={() => setReportProject(null)} className="text-gray-400 hover:text-gray-600" title="Fermer">
                            <XCircle className="w-6 h-6" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Budget alloué</h3>
                            <p className="text-gray-700 text-lg">{formatCurrency(Number(reportProject.budget || 0))}</p>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Budget dépensé</h3>
                            <p className="text-gray-700 text-lg">{formatCurrency(Number(reportProject.spent || 0))}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Date de début</h3>
                            <p className="text-gray-700">{new Date(reportProject.start_date).toLocaleDateString('fr-FR')}</p>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Date de fin prévue</h3>
                            <p className="text-gray-700">{new Date(reportProject.end_date).toLocaleDateString('fr-FR')}</p>
                          </div>
                          {reportProject.actual_end_date && (
                            <div className="col-span-2">
                              <h3 className="font-semibold text-gray-900 mb-2">Date de fin réelle</h3>
                              <p className="text-gray-700">{new Date(reportProject.actual_end_date).toLocaleDateString('fr-FR')}</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-6 space-y-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                            <p className="text-gray-700">{reportProject.description}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-2">Localisation</h3>
                              <p className="text-gray-700">{reportProject.city}, {reportProject.province}</p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-2">Secteur</h3>
                              <p className="text-gray-700">{reportProject.sector}</p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-2">Ministère</h3>
                              <p className="text-gray-700">{reportProject.ministry}</p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-2">Responsable</h3>
                              <p className="text-gray-700">{reportProject.responsible_person}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
      {reportProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" role="dialog" aria-modal="true" onClick={() => setReportProject(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{reportProject.title}</h2>
                  <div className="text-sm text-gray-700">{reportProject.city}, {reportProject.province} • {reportProject.sector}</div>
                  <div className="mt-1 text-xs text-gray-600">Statut: {STRINGS.projectStatusLabels[reportProject.status]}</div>
                </div>
                <button onClick={() => setReportProject(null)} className="text-gray-400 hover:text-gray-600" title="Fermer">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Budget alloué</h3>
                  <p className="text-gray-700 text-lg">{formatCurrency(Number(reportProject.budget || 0))}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Budget dépensé</h3>
                  <p className="text-gray-700 text-lg">{formatCurrency(Number(reportProject.spent || 0))}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Date de début</h3>
                  <p className="text-gray-700">{new Date(reportProject.start_date).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Date de fin prévue</h3>
                  <p className="text-gray-700">{new Date(reportProject.end_date).toLocaleDateString('fr-FR')}</p>
                </div>
                {reportProject.actual_end_date && (
                  <div className="col-span-2">
                    <h3 className="font-semibold text-gray-900 mb-2">Date de fin réelle</h3>
                    <p className="text-gray-700">{new Date(reportProject.actual_end_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{reportProject.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Localisation</h3>
                    <p className="text-gray-700">{reportProject.city}, {reportProject.province}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Secteur</h3>
                    <p className="text-gray-700">{reportProject.sector}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Ministère</h3>
                    <p className="text-gray-700">{reportProject.ministry}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Responsable</h3>
                    <p className="text-gray-700">{reportProject.responsible_person}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
    );
}
