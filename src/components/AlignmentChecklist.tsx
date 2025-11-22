import { useEffect, useState } from "react";
import { getProjectAlignment, updateProjectObjectiveWeight, unlinkProjectObjective, linkProjectObjective } from "../lib/api";
import type { AlignmentResult, AlignmentObjective } from "../lib/api";
import { STRINGS } from "../lib/strings";
import { useAuth } from "../contexts/AuthContext";

type AlignmentChecklistProps = { projectId: string };

function ScoreBar({ score, redundancy }: { score: number; redundancy: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-24">
        <div className="w-full bg-gray-200 rounded h-3">
          <div
            className="h-3 rounded bg-blue-600"
            style={{ width: `${score}%` }}
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={STRINGS.scoreLabel}
          />
        </div>
        <div className="text-xs text-gray-600 mt-1">{STRINGS.scoreLabel}: {score}%</div>
      </div>
      <div className="text-xs text-gray-500">{STRINGS.redundancyLabel}: {redundancy}</div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded bg-gray-100 text-gray-700 text-xs px-2 py-1">{children}</span>;
}

function ObjectiveList({ objectives, projectId, canEdit, onChanged }: { objectives: AlignmentObjective[]; projectId: string; canEdit: boolean; onChanged: () => void }) {
  if (!objectives || objectives.length === 0) {
    return null;
  }
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-900 mb-2">{STRINGS.objectivesLabel}</h4>
      <ul className="space-y-2">
        {objectives.map((o) => (
          <li key={o.id} className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">{o.code}</span> — {o.title}
              <span className="ml-2 text-xs text-gray-500">({o.level})</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{STRINGS.weightLabel}: {o.weight}</Badge>
              {canEdit && (
                <select
                  value={o.weight}
                  onChange={async (e) => {
                    const w = Number(e.target.value);
                    try { await updateProjectObjectiveWeight(projectId, o.id, w); onChanged(); } catch {}
                  }}
                  className="px-2 py-1 border rounded text-xs"
                  aria-label={STRINGS.weightLabel}
                >
                  {[1,2,3,4,5].map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              )}
              {canEdit && (
                <button
                  onClick={async () => { try { await unlinkProjectObjective(projectId, o.id); onChanged(); } catch {} }}
                  className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                >{STRINGS.unlinkObjectiveLabel}</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SuggestionsList({ suggestions, projectId, canEdit, onChanged }: { suggestions: AlignmentResult["suggestions"]; projectId: string; canEdit: boolean; onChanged: () => void }) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-900 mb-2">{STRINGS.suggestionsLabel}</h4>
      <ul className="list-disc pl-5 text-sm text-gray-700">
        {suggestions.map((s) => (
          <li key={s.id} className="flex items-center justify-between">
            <div>
              <span className="font-medium">{s.code}</span> — {s.title}
              <span className="ml-2 text-xs text-gray-500">({s.level})</span>
            </div>
            {canEdit && (
              <button
                onClick={async () => { try { await linkProjectObjective(projectId, { objective_id: s.id, weight: 1 }); onChanged(); } catch {} }}
                className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
              >{STRINGS.addObjectiveLabel}</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AlignmentChecklist({ projectId }: AlignmentChecklistProps) {
  const { profile } = useAuth();
  const canEdit = !!profile && (profile.role === 'government' || profile.role === 'partner');
  const [data, setData] = useState<AlignmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProjectAlignment(projectId);
      setData(res || null);
    } catch (e: any) {
      setError(e?.message || "Erreur d'alignement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { let mounted = true; (async () => { if (!mounted) return; await refresh(); })(); return () => { mounted = false; }; }, [projectId]);

  if (loading) {
    return <div className="text-sm text-gray-600" aria-live="polite">{STRINGS.loadingLabel}</div>;
  }
  if (error) {
    return <div className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded" aria-live="polite">{error}</div>;
  }
  if (!data) {
    return <div className="text-sm text-gray-600" aria-live="polite">{STRINGS.emptyAlignmentLabel}</div>;
  }

  const redundancyCount = data.redundancy?.similarProjects ?? 0;
  const objectives = Array.isArray(data.objectives) ? data.objectives : [];
  const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];

  return (
    <div className="space-y-4">
      <ScoreBar score={data.score} redundancy={redundancyCount} />
      <ObjectiveList objectives={objectives} projectId={projectId} canEdit={canEdit} onChanged={refresh} />
      <SuggestionsList suggestions={suggestions} projectId={projectId} canEdit={canEdit} onChanged={refresh} />
    </div>
  );
}

export default AlignmentChecklist;