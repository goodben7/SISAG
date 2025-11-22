import { useEffect, useState } from "react";
import { AlertCircle, Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { STRINGS } from "../lib/strings";
import { getPlanningAlerts } from "../lib/api";
import type { PlanningAlert } from "../lib/api";
import { PlanningAlertForm } from "./PlanningAlertForm";

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

  const canCreate = !!profile && (profile.role === "government" || profile.role === "partner");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getPlanningAlerts();
      setAlerts(data || []);
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
          {alerts.map((a) => (
            <div key={a.id} className={`border rounded-lg p-4 ${ALERT_SEVERITY_COLORS[a.severity]}`}>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{STRINGS.planningAlertTypeLabels[a.type]}</span>
                    <span className="text-xs uppercase font-medium">{STRINGS.alertSeverityLabels[a.severity]}</span>
                  </div>
                  <p className="text-sm">{a.message}</p>
                  <p className="text-xs mt-2 opacity-75">
                    {new Date(a.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}