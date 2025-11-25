import { useEffect, useState } from 'react';
import { AlertCircle, Clock, XCircle } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { getAlerts, getProjects } from '../lib/api';
import { STRINGS } from '../lib/strings';

type Alert = Database['public']['Tables']['alerts']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

export function RecentAlerts({ refreshKey = 0 }: { refreshKey?: number }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const load = async () => {
      const [alertsData, projectsData] = await Promise.all([getAlerts(), getProjects()]);
      setAlerts((alertsData || []).slice(0, 3));
      setProjects(projectsData || []);
    };
    load();
  }, [refreshKey]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="card p-6">
      <h3 className="font-display font-semibold text-rdcTextPrimary mb-4">Alertes récentes</h3>
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-sm text-rdcGrayText">Aucune alerte récente</p>
        ) : (
          alerts.map((a) => {
            const pr = projects.find(p => p.id === a.project_id) || null;
            return (
              <div key={a.id} className="border border-rdcGrayBorder rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-rdcRed mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-rdcTextPrimary">{STRINGS.alertTypeLabels[a.type]} <span className="text-xs font-medium text-rdcGrayText">· {STRINGS.alertSeverityLabels[a.severity]}</span></p>
                    {pr && (
                      <button
                        type="button"
                        className="text-xs text-rdcTextPrimary mb-1 underline underline-offset-2 hover:text-blue-600"
                        onClick={() => setSelectedProject(pr)}
                        title="Voir le détail du projet"
                      >
                        Projet: <span className="font-bold">{pr.title}</span> — {pr.province} — {pr.sector}
                      </button>
                    )}
                    <p className="text-sm text-rdcGrayText line-clamp-2">{a.message}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(a.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="mt-4 text-right">
        <a href="#" className="inline-block px-4 py-2 bg-rdcBlue text-white rounded-lg hover:bg-rdcBlueDark transition-colors">Voir toutes les alertes</a>
      </div>
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedProject(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedProject.title}</h2>
                  <div className="text-sm text-gray-700">{selectedProject.city}, {selectedProject.province} • {selectedProject.sector}</div>
                </div>
                <button onClick={() => setSelectedProject(null)} className="text-gray-400 hover:text-gray-600" title="Fermer">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Budget alloué</h3>
                  <p className="text-gray-700 text-lg">{formatCurrency(Number(selectedProject.budget || 0))}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Budget dépensé</h3>
                  <p className="text-gray-700 text-lg">{formatCurrency(Number(selectedProject.spent || 0))}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Date de début</h3>
                  <p className="text-gray-700">{new Date(selectedProject.start_date).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Date de fin prévue</h3>
                  <p className="text-gray-700">{new Date(selectedProject.end_date).toLocaleDateString('fr-FR')}</p>
                </div>
                {selectedProject.actual_end_date && (
                  <div className="col-span-2">
                    <h3 className="font-semibold text-gray-900 mb-2">Date de fin réelle</h3>
                    <p className="text-gray-700">{new Date(selectedProject.actual_end_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{selectedProject.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Localisation</h3>
                    <p className="text-gray-700">{selectedProject.city}, {selectedProject.province}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Secteur</h3>
                    <p className="text-gray-700">{selectedProject.sector}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Ministère</h3>
                    <p className="text-gray-700">{selectedProject.ministry}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Responsable</h3>
                    <p className="text-gray-700">{selectedProject.responsible_person}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
