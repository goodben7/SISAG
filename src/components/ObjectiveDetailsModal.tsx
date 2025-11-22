import { X, Info, Target } from "lucide-react";
import type { AlignmentObjective } from "../lib/api";
import { STRINGS, normalizeApostrophes } from "../lib/strings";

type Props = {
  isOpen: boolean;
  objective: AlignmentObjective | null;
  onClose: () => void;
};

export default function ObjectiveDetailsModal({ isOpen, objective, onClose }: Props) {
  if (!isOpen || !objective) return null;
  const weightMax = 5;
  const percent = Math.max(0, Math.min(100, (objective.weight / weightMax) * 100));
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">{STRINGS.objectiveDetailsTitle}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fermer">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-start gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">{objective.code}</div>
              <div className="font-semibold text-gray-900">{normalizeApostrophes(objective.title)}</div>
              <div className="text-xs text-gray-500">{STRINGS.levelLabel}: {normalizeApostrophes(String(objective.level))} · {STRINGS.sectorLabel}: {normalizeApostrophes(objective.sector)}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">{STRINGS.weightLabel}: {objective.weight}/5</div>
              <div className="w-full bg-gray-200 rounded-full h-2" aria-label={`${STRINGS.weightLabel}: ${objective.weight}`} role="progressbar" aria-valuenow={objective.weight} aria-valuemin={0} aria-valuemax={5}>
                <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${percent}%` }} />
              </div>
              <p className="text-xs text-gray-600 mt-1 flex items-center gap-1"><Info className="w-4 h-4" />{STRINGS.weightHelp}</p>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">{STRINGS.indicatorsLabel}</div>
              <ul className="text-sm text-gray-700 list-disc pl-5">
                <li>Indicateur 1 — Exemple (nombre d'activités réalisées)</li>
                <li>Indicateur 2 — Exemple (taux d'exécution)</li>
                <li>Indicateur 3 — Exemple (bénéficiaires ciblés)</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border hover:bg-gray-50">{STRINGS.cancelLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}