import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { Database } from "../lib/database.types";
import { X, Save, AlertCircle } from "lucide-react";
import { getProjects, createAlert } from "../lib/api";
import { STRINGS } from "../lib/strings";

type AlertInsert = Database["public"]["Tables"]["alerts"]["Insert"];
type Project = Database["public"]["Tables"]["projects"]["Row"];

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

const ALERT_TYPES: AlertInsert["type"][] = ["budget_overrun", "delay", "milestone_missed"];
const SEVERITIES: AlertInsert["severity"][] = ["low", "medium", "high", "critical"];

export function AlertForm({ onClose, onCreated }: Props) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const [form, setForm] = useState<{ project_id: string; type: AlertInsert["type"]; severity: AlertInsert["severity"]; message: string }>({
    project_id: "",
    type: "delay",
    severity: "medium",
    message: "",
  });

  const canCreate = !!profile && (profile.role === "government" || profile.role === "partner");

  useEffect(() => {
    (async () => {
      try {
        const data = await getProjects();
        setProjects(data || []);
      } catch (error) {
        console.error("Error loading projects:", error);
      }
    })();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target as { name: string; value: string };
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!canCreate) {
      setError(STRINGS.errorNoRightsAlert);
      return;
    }

    if (!form.project_id || !form.message) {
      setError(STRINGS.errorSelectProjectMessage);
      return;
    }

    try {
      setLoading(true);

      await createAlert({
        project_id: form.project_id,
        type: form.type,
        severity: form.severity,
        message: form.message,
      });

      setSuccess(STRINGS.successAlertCreated);
      onCreated();
    } catch (err) {
      const msg = (err as any)?.message || "Erreur lors de la cr\u00e9ation de l\u0027alerte.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-2xl rounded-lg shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><AlertCircle className="w-5 h-5" />{STRINGS.addAlertTitle}</h2>
          <button onClick={onClose} className="p-2 text-gray-600 hover:text-gray-900" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!canCreate && (
          <div className="p-4 text-sm text-red-700 bg-red-50">
            {STRINGS.errorNoRightsAlert}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.projectLabel}</label>
            <select name="project_id" value={form.project_id} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">{STRINGS.selectProjectPlaceholder}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.typeLabel}</label>
            <select name="type" value={form.type} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
              {ALERT_TYPES.map((t) => (<option key={t} value={t}>{t.replace("_"," ")}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.severityLabel}</label>
            <select name="severity" value={form.severity} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
              {SEVERITIES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{STRINGS.messageLabel}</label>
            <textarea name="message" value={form.message} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" rows={4} required></textarea>
          </div>

          {error && <div className="md:col-span-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded">{error}</div>}
          {success && <div className="md:col-span-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded">{success}</div>}

          <div className="md:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">{STRINGS.cancelLabel}</button>
            <button type="submit" disabled={loading || !canCreate} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
              <Save className="w-4 h-4" />
              {loading ? STRINGS.savingLabel : STRINGS.saveLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}