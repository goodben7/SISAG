import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { STRINGS } from "../lib/strings";
import { getPlanningAlerts, createPlanningAlert, getProjects, getProjectPhases } from "../lib/api";
import type { PlanningAlert, Phase } from "../lib/api";
import type { Database } from "../lib/database.types";

type Project = Database["public"]["Tables"]["projects"]["Row"];

const SEVERITY_COLORS: Record<PlanningAlert["severity"], string> = {
  low: "bg-rdcBlueLight text-rdcBlue",
  medium: "bg-rdcYellowLight text-rdcYellow",
  high: "bg-rdcYellowLight text-rdcYellow",
  critical: "bg-rdcRedLight text-rdcRed"
};

const TYPE_LABELS: Record<PlanningAlert["type"], string> = {
  delay: "Retard",
  blocked: "Bloqué",
  budget_drift: "Dérive budgétaire"
};

function formatDateTimeFR(iso: string) {
  return new Date(iso).toLocaleString("fr-FR");
}

type FormState = {
  project_id: string;
  phase_id: string;
  type: PlanningAlert["type"];
  severity: PlanningAlert["severity"];
  message: string;
};

function AlertList({ alerts }: { alerts: PlanningAlert[] }) {
  if (!alerts || alerts.length === 0) {
    return <div className="text-sm text-gray-600">Aucune alerte de planification.</div>;
  }

  return (
    <div className="space-y-3">
      {alerts.map((a) => (
        <div key={a.id} className={`border rounded-lg p-4 ${SEVERITY_COLORS[a.severity]}`}>
          <div className="flex items-start gap-3">
            <div className="text-sm font-semibold">{TYPE_LABELS[a.type]}</div>
            <div className="flex-1 text-sm">{a.message}</div>
            <div className="text-xs opacity-70">{formatDateTimeFR(a.created_at)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AlertCreateForm({
  canCreate,
  projects,
  phases,
  form,
  onChange,
  onSubmit,
  loading
}: {
  canCreate: boolean;
  projects: Project[];
  phases: Phase[];
  form: FormState;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}) {
  if (!canCreate) return null;

  const phaseDisabled = !form.project_id || phases.length === 0;

  return (
    <form onSubmit={onSubmit} className="bg-white border rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.projectLabel}</label>
          <select
            name="project_id"
            value={form.project_id}
            onChange={onChange}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">{STRINGS.selectProjectPlaceholder}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {STRINGS.phaseLabel} ({STRINGS.selectPhaseOptional})
          </label>
          <select
            name="phase_id"
            value={form.phase_id}
            onChange={onChange}
            className="w-full px-3 py-2 border rounded-lg"
            disabled={phaseDisabled}
          >
            <option value="">{STRINGS.selectPhasePlaceholder ?? "Sélectionner une phase"}</option>
            {phases.map((ph) => (
              <option key={ph.id} value={ph.id}>{ph.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.typeLabel}</label>
          <select name="type" value={form.type} onChange={onChange} className="w-full px-3 py-2 border rounded-lg">
            {Object.keys(TYPE_LABELS).map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t as PlanningAlert["type"]]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.severityLabel}</label>
          <select name="severity" value={form.severity} onChange={onChange} className="w-full px-3 py-2 border rounded-lg">
            {(["low", "medium", "high", "critical"] as PlanningAlert["severity"][]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.messageLabel}</label>
          <textarea
            name="message"
            value={form.message}
            onChange={onChange}
            className="w-full px-3 py-2 border rounded-lg"
            rows={4}
            placeholder={STRINGS.messagePlaceholder ?? "Décrivez l'alerte"}
          />
        </div>
      </div>

      <div className="md:col-span-2 flex justify-end gap-2 mt-2">
        <button type="submit" disabled={loading || !canCreate} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
          {loading ? STRINGS.savingLabel : STRINGS.saveLabel}
        </button>
      </div>
    </form>
  );
}

export function PlanningAlertsPanel() {
  const { profile } = useAuth();
  const canCreate = !!profile && (profile.role === "government" || profile.role === "partner");

  const [alerts, setAlerts] = useState<PlanningAlert[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    project_id: "",
    phase_id: "",
    type: "delay",
    severity: "medium",
    message: ""
  });

  // Charger alertes et projets
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [alertsRes, projectsRes] = await Promise.all([
          getPlanningAlerts(),
          getProjects()
        ]);
        if (mounted) {
          setAlerts(alertsRes || []);
          setProjects(projectsRes || []);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Erreur de chargement des alertes");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Charger les phases quand un projet est sélectionné
  useEffect(() => {
    let mounted = true;
    (async () => {
      // reset phase quand projet change
      setForm((prev) => ({ ...prev, phase_id: "" }));

      if (!form.project_id) {
        setPhases([]);
        return;
      }
      try {
        const res = await getProjectPhases(form.project_id);
        if (mounted) setPhases(res || []);
      } catch (e) {
        if (mounted) setPhases([]);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.project_id]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const canSubmit = useMemo(() => {
    return !!form.project_id && !!form.message && !!form.type && !!form.severity;
  }, [form]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canCreate) {
      setError(STRINGS.errorNoRightsAlert);
      return;
    }

    if (!canSubmit) {
      setError(STRINGS.errorSelectProjectMessage);
      return;
    }

    try {
      setLoading(true);
      await createPlanningAlert({
        project_id: form.project_id,
        phase_id: form.phase_id || null,
        type: form.type,
        severity: form.severity,
        message: form.message
      });

      const refreshed = await getPlanningAlerts();
      setAlerts(refreshed || []);

      setForm({ project_id: "", phase_id: "", type: "delay", severity: "medium", message: "" });
      setPhases([]);
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la création de l'alerte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">{STRINGS.planningAlertsTitle}</h3>

      {loading && alerts.length === 0 ? (
        <div className="text-sm text-gray-600">{STRINGS.savingLabel}</div>
      ) : error ? (
        <div className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded">{error}</div>
      ) : (
        <AlertList alerts={alerts} />
      )}

      <AlertCreateForm
        canCreate={canCreate}
        projects={projects}
        phases={phases}
        form={form}
        onChange={onChange}
        onSubmit={submit}
        loading={loading}
      />
    </div>
  );
}