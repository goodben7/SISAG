import { useState } from "react";

import { STRINGS, normalizeApostrophes } from "../lib/strings";
import type { AlignmentObjective } from "../lib/api";
import { updateProjectObjectiveWeight, unlinkProjectObjective } from "../lib/api";
import ObjectiveDetailsModal from "./ObjectiveDetailsModal";

type Props = {
  projectId: string;
  objective: AlignmentObjective;
  canEdit: boolean;
  onChanged: () => void;
};

export default function ObjectiveCard({ projectId, objective, canEdit, onChanged }: Props) {
  const weightMax = 5;
  const percent = Math.max(0, Math.min(100, (objective.weight / weightMax) * 100));
  const [open, setOpen] = useState(false as boolean);
  const { sectorColor, sectorBg, sectorEmoji } = (() => {
    const s = (objective.sector || "").toLowerCase();
    if (s.includes("eau")) return { sectorColor: "bg-rdcBlue", sectorBg: "bg-rdcBlueLight", sectorEmoji: "💧" };
    if (s.includes("infra")) return { sectorColor: "bg-rdcGreen", sectorBg: "bg-rdcGreenLight", sectorEmoji: "🛣️" };
    if (s.includes("sant")) return { sectorColor: "bg-rdcYellow", sectorBg: "bg-rdcYellowLight", sectorEmoji: "🏥" };
    return { sectorColor: "bg-blue-600", sectorBg: "bg-gray-50", sectorEmoji: "🎯" };
  })();
  return (
    <div className={`${sectorBg} rounded-xl shadow-sm p-4 border hover:shadow-soft transition-shadow`}>
      <div className="flex items-start justify-between cursor-pointer" onClick={() => setOpen(true)}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center rounded bg-white/60 text-lg" aria-hidden="true">{sectorEmoji}</div>
          <div>
            <div className="text-sm text-gray-600">{normalizeApostrophes(objective.code)}</div>
            <div className="font-semibold text-gray-900 text-sm">{normalizeApostrophes(objective.title)}</div>
            <div className="text-xs text-gray-500">{STRINGS.levelLabel}: {normalizeApostrophes(String(objective.level))} · {STRINGS.sectorLabel}: {normalizeApostrophes(objective.sector)}</div>
          </div>
        </div>
        <div className="flex items-center gap-1" title={STRINGS.weightHelp}>
          {[1,2,3,4,5].map(i => (
            <span key={i} className={`inline-block w-2.5 h-2.5 rounded-full ${i <= objective.weight ? sectorColor : "bg-gray-300"}`}></span>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded-full h-2" aria-label={`${STRINGS.weightLabel}: ${objective.weight}`} role="progressbar" aria-valuenow={objective.weight} aria-valuemin={0} aria-valuemax={weightMax}>
          <div className={`h-2 rounded-full ${sectorColor} transition-all duration-500`} style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button onClick={() => setOpen(true)} className="text-xs px-2 py-1 rounded border hover:bg-gray-50">{STRINGS.viewDetailsLabel}</button>
        {canEdit && (
          <div className="flex items-center gap-2">
            <select
              value={objective.weight}
              onChange={async (e) => {
                const w = Number(e.target.value);
                try { await updateProjectObjectiveWeight(projectId, objective.id, w); onChanged(); } catch {}
              }}
              className="px-2 py-1 border rounded text-xs"
              aria-label={STRINGS.weightLabel}
            >
              {[1,2,3,4,5].map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <button
              onClick={async () => { try { await unlinkProjectObjective(projectId, objective.id); onChanged(); } catch {} }}
              className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
            >{STRINGS.unlinkObjectiveLabel}</button>
          </div>
        )}
      </div>

      <ObjectiveDetailsModal isOpen={open} objective={objective} onClose={() => setOpen(false)} />
    </div>
  );
}