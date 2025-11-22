import { useEffect, useState } from "react";
import { getProjectAlignment, linkProjectObjective } from "../lib/api";
import type { AlignmentResult, AlignmentObjective } from "../lib/api";
import { STRINGS } from "../lib/strings";
import { useAuth } from "../contexts/AuthContext";
import RadialGauge from "./RadialGauge";
import ObjectiveCard from "./ObjectiveCard";
import { Info } from "lucide-react";
import PagInfoModal from "./PagInfoModal";

type AlignmentChecklistProps = { projectId: string };

function ScoreBar({ score, redundancy, onInfo }: { score: number; redundancy: number; onInfo: () => void }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimatedValue(score), 150); return () => clearTimeout(t); }, [score]);
  const desc = score >= 80 ? "Excellent alignement avec les priorités nationales" : score >= 50 ? "Alignement modéré avec les priorités nationales" : "Alignement faible, à renforcer";
  const badgeClass = score >= 80 ? "bg-green-50 text-green-700 border-green-200" : score >= 50 ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-red-50 text-red-700 border-red-200";
  return (
    <div className="flex items-center gap-6">
      <RadialGauge value={animatedValue} size={80} valueFontPx={16} />
      <div className="text-sm text-gray-700">

        <div className={`inline-flex items-center mt-1 text-xs px-2 py-1 rounded border ${badgeClass}`}>{desc}</div>

        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2" title={STRINGS.redundancyHelp}><Info className="w-4 h-4" aria-hidden="true" />{STRINGS.redundancyLabel}: {redundancy}</div>
        <button onClick={onInfo} className="mt-2 text-xs px-2 py-1 rounded border hover:bg-gray-50">{STRINGS.learnMoreLabel}</button>
      </div>
    </div>
  );
}


function ObjectiveList({ objectives, projectId, canEdit, onChanged }: { objectives: AlignmentObjective[]; projectId: string; canEdit: boolean; onChanged: () => void }) {
  if (!objectives || objectives.length === 0) {
    return null;
  }
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-900 mb-2">{STRINGS.objectivesLabel}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {objectives.map((o) => (
          <ObjectiveCard key={o.id} projectId={projectId} objective={o} canEdit={canEdit} onChanged={onChanged} />
        ))}
      </div>
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
  const [filterLevel, setFilterLevel] = useState<'all'|'national'|'provincial'|'territorial'>('all');
  const [filterText, setFilterText] = useState<string>('');
  const [infoOpen, setInfoOpen] = useState(false);
  const levelStyles = { all: "bg-gray-100 border-gray-300 text-gray-700", national: "bg-blue-50 border-blue-600 text-blue-700", provincial: "bg-green-50 border-green-600 text-green-700", territorial: "bg-yellow-50 border-yellow-600 text-yellow-700" } as const;

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
  const q = filterText.trim().toLowerCase();
  const filteredObjectives = objectives.filter(o => (filterLevel === 'all' ? true : o.level === filterLevel) && (q === '' ? true : (o.code.toLowerCase().includes(q) || o.title.toLowerCase().includes(q))));
  const filteredSuggestions = suggestions.filter(s => (filterLevel === 'all' ? true : s.level === filterLevel) && (q === '' ? true : (s.code.toLowerCase().includes(q) || s.title.toLowerCase().includes(q))));

  return (
    <div className="space-y-4">
      <ScoreBar score={data.score} redundancy={redundancyCount} onInfo={() => setInfoOpen(true)} />

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1" role="tablist" aria-label="Filtrer par niveau">
          {(['all','national','provincial','territorial'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              role="tab"
              aria-selected={filterLevel === lvl}
              className={`text-xs px-2 py-1 rounded border ${filterLevel === lvl ? levelStyles[lvl] : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              {{ all: 'Tous niveaux', national: 'National', provincial: 'Provincial', territorial: 'Territorial' }[lvl]}
            </button>
          ))}
        </div>
        <input className="px-2 py-1 border rounded text-xs" placeholder="Rechercher un objectif PAG..." value={filterText} onChange={(e) => setFilterText(e.target.value)} aria-label="Rechercher par code ou titre" />
      </div>

      <ObjectiveList objectives={filteredObjectives} projectId={projectId} canEdit={canEdit} onChanged={refresh} />
      <SuggestionsList suggestions={filteredSuggestions} projectId={projectId} canEdit={canEdit} onChanged={refresh} />
      <PagInfoModal isOpen={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  );
}

export default AlignmentChecklist;