import { useState } from "react";
import { saveProjectMaturity, type MaturityAssessment, type MaturityResult } from "../lib/api";

type Props = {
  projectId: string;
  initial: MaturityAssessment;
  onSaved: (res: MaturityResult) => void;
};

export default function MaturityForm({ projectId, initial, onSaved }: Props) {
  const [form, setForm] = useState<MaturityAssessment>({ ...initial, attachments: initial.attachments || [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const boolFields: { key: keyof MaturityAssessment; label: string }[] = [
    { key: "budget_available", label: "Budget disponible ?" },
    { key: "disbursement_planned", label: "Décaissement prévu ?" },
    { key: "funding_source_confirmed", label: "Source de financement confirmée ?" },
    { key: "contracts_signed", label: "Contrats de financement signés ?" },
    { key: "feasibility_study", label: "Étude de faisabilité disponible ?" },
    { key: "technical_plans_validated", label: "Plans techniques validés ?" },
    { key: "documentation_complete", label: "Documentation complète ?" },
    { key: "governance_defined", label: "Gouvernance définie ?" },
    { key: "steering_committee_formed", label: "Comité de pilotage formé ?" },
    { key: "tenders_launched_awarded", label: "Appels d’offres lancés / attribués ?" },
    { key: "project_team_available", label: "Équipe projet disponible ?" },
    { key: "logistics_ready", label: "Logistique prête ?" },
    { key: "risks_identified", label: "Risques identifiés ?" }
  ];

  const setBool = (key: keyof MaturityAssessment, value: boolean) => {
    setForm(prev => ({ ...prev, [key]: value ? 1 : 0 }));
  };

  const addAttachment = (name: string) => {
    if (!name.trim()) return;
    const att = { name };
    setForm(prev => ({ ...prev, attachments: [...(prev.attachments || []), att] }));
  };

  const removeAttachment = (idx: number) => {
    setForm(prev => ({ ...prev, attachments: (prev.attachments || []).filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await saveProjectMaturity(projectId, form);
      onSaved(res);
    } catch (e: any) {
      setError(e?.message || "Erreur d\u0027enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {boolFields.map(({ key, label }) => (
          <label key={key as string} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              checked={Boolean(form[key])}
              onChange={e => setBool(key, e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">{label}</span>
          </label>
        ))}
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Alignement PAG (%)</label>
        <input
          type="range"
          min={0}
          max={100}
          value={form.pag_alignment_percent || 0}
          onChange={e => setForm(prev => ({ ...prev, pag_alignment_percent: Number(e.target.value) }))}
          className="w-full"
        />
        <div className="text-sm text-gray-600 mt-1">{Math.round(form.pag_alignment_percent || 0)}%</div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Pièces jointes (preuves)</label>
        <div className="flex gap-2">
          <input id="attName" type="text" placeholder="Nom du document (ex: Contrat de financement.pdf)" className="flex-1 border rounded px-3 py-2" />
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("attName") as HTMLInputElement | null;
              if (el) { addAttachment(el.value); el.value = ""; }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >Ajouter</button>
        </div>
        <ul className="mt-3 space-y-2">
          {(form.attachments || []).map((a: any, idx: number) => (
            <li key={idx} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
              <span className="text-sm text-gray-700">{a?.name || "Document"}</span>
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                className="text-red-600 text-sm hover:underline"
              >Supprimer</button>
            </li>
          ))}
        </ul>
      </div>

      {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >{saving ? "Enregistrement..." : "Enregistrer"}</button>
        <span className="text-sm text-gray-500">Les recommandations seront mises à jour automatiquement après l\u0027enregistrement.</span>
      </div>
    </div>
  );
}