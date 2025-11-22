import { X, Info } from "lucide-react";
import { STRINGS } from "../lib/strings";

type Props = { isOpen: boolean; onClose: () => void };

export default function PagInfoModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">En savoir plus sur les objectifs PAG</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fermer">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <p>{STRINGS.alignmentHelp}</p>
            </div>
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <p>{STRINGS.weightHelp}</p>
            </div>
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <p>{STRINGS.redundancyHelp}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Méthodologie simplifiée: le score résulte de la somme pondérée des objectifs liés (poids 1–5), normalisée sur 100. La redondance indique les éventuels recouvrements de contribution entre objectifs.</p>
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