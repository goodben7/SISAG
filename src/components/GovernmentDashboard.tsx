import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle, DollarSign, FileText, Plus } from 'lucide-react';

import type { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertForm } from './AlertForm';
import { STRINGS } from '../lib/strings';
import { ProjectStatsCards } from './ProjectStatsCards';
import { ProjectStatusChart } from './ProjectStatusChart';
import { RecentAlerts } from './RecentAlerts';
import { getProjects, getAlerts, getReports } from '../lib/api';
import PhaseGantt from './PhaseGantt';
import AlignmentChecklist from './AlignmentChecklist';
import { PlanningAlertsPanel } from './PlanningAlertsPanel';
import AdditionalIndicators from './AdditionalIndicators';

type Project = Database['public']['Tables']['projects']['Row'];
type Alert = Database['public']['Tables']['alerts']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];

export function GovernmentDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'alerts' | 'reports'>('overview');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [refreshAlertsKey, setRefreshAlertsKey] = useState(0);
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
            setRefreshAlertsKey((k) => k + 1);
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

        <div className="mb-8">
          <AdditionalIndicators projects={projects} alerts={alerts} />
        </div>

        <div className="mb-8">
          <RecentAlerts refreshKey={refreshAlertsKey} />
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
                    onClick={() => setSelectedProjectId(prev => prev === project.id ? null : project.id)}
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
                {projects.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedProjectId ? (
                      <>
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
                  alerts.map((alert) => (
                    <div key={alert.id} className={`border rounded-lg p-4 ${ALERT_SEVERITY_COLORS[alert.severity]}`}>
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{ALERT_TYPE_LABELS[alert.type]}</span>
                            <span className="text-xs uppercase font-medium">{STRINGS.alertSeverityLabels[alert.severity]}</span>
                          </div>
                          <p className="text-sm">{alert.message}</p>
                          <p className="text-xs mt-2 opacity-75">
                            {new Date(alert.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div className="bg-white border rounded-lg p-4">
                  <PlanningAlertsPanel />
                </div>
              </div>
            )}

            {selectedTab === 'reports' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Signalements citoyens</h3>
                {reports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>Aucun signalement</p>
                  </div>
                ) : (
                  reports.map((report) => (
                    <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{report.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className={`px-2 py-1 rounded-full font-medium ${REPORT_STATUS_COLORS[report.status]}`}>
                              {REPORT_STATUS_LABELS[report.status]}
                            </span>
                            <span>{new Date(report.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
