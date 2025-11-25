import { useEffect, useState } from "react";
import { AlertCircle, Plus, XCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { STRINGS } from "../lib/strings";
import { getPlanningAlerts, getProjects } from "../lib/api";
import type { PlanningAlert } from "../lib/api";
import { PlanningAlertForm } from "./PlanningAlertForm";
import type { Database } from "../lib/database.types";

const ALERT_SEVERITY_COLORS: Record<PlanningAlert["severity"], string> = {

    low: "bg-rdcBlueLight text-rdcBlue border-rdcBlueLight",
  medium: "bg-rdcYellowLight text-black border-rdcYellowLight",
  high: "bg-rdcYellowLight text-black border-rdcYellowLight",
  critical: "bg-rdcRedLight text-rdcRed border-rdcRedLight"
};

export function PlanningAlertsPanel() {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState<PlanningAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [projects, setProjects] = useState<Database['public']['Tables']['projects']['Row'][]>([]);
  const [selectedProject, setSelectedProject] = useState<Database['public']['Tables']['projects']['Row'] | null>(null);

  const canCreate = !!profile && (profile.role === "government" || profile.role === "partner");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [alertsData, projectsData] = await Promise.all([getPlanningAlerts(), getProjects()]);
      setAlerts(alertsData || []);
      setProjects(projectsData || []);
    } catch (e) {
      const msg = (e as any)?.message || "Erreur de chargement";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">{STRINGS.planningAlertsTitle}</h4>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {STRINGS.addPlanningAlertLabel}
          </button>
        )}
      </div>

      {showModal && (
        <PlanningAlertForm
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            load();
          }}
        />
      )}

      {loading ? (
        <div className="text-sm text-gray-500">{STRINGS.loadingLabel}</div>
      ) : error ? (
        <div className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded">{error}</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <AlertCircle className="w-10 h-10 mx-auto mb-2 text-gray-400" />
          <p>Aucune alerte de planification</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => {
            const pr = projects.find(p => p.id === a.project_id) || null;
            return (
              <div key={a.id} className={`border rounded-lg p-4 ${ALERT_SEVERITY_COLORS[a.severity]}`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{STRINGS.planningAlertTypeLabels[a.type]}</span>
                      <span className="text-xs uppercase font-medium">{STRINGS.alertSeverityLabels[a.severity]}</span>
                    </div>
                    {pr && (
                      <button
                        type="button"
                        className="text-xs text-gray-700 mb-1 underline underline-offset-2 hover:text-blue-700"
                        onClick={() => setSelectedProject(pr)}
                        title="Voir le détail du projet"
                      >
                        Projet: <span className="font-bold">{pr.title}</span> — {pr.province} — {pr.sector}
                      </button>
                    )}
                    <p className="text-sm">{a.message}</p>
                    <p className="text-xs mt-2 opacity-75">
                      {new Date(a.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" role="dialog" aria-modal="true" onClick={() => setSelectedProject(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                  <p className="text-gray-700 text-lg">{new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', minimumFractionDigits: 0 }).format(Number(selectedProject.budget || 0))}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Budget dépensé</h3>
                  <p className="text-gray-700 text-lg">{new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', minimumFractionDigits: 0 }).format(Number(selectedProject.spent || 0))}</p>
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
