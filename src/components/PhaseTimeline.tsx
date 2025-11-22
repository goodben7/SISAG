import { useMemo } from "react";
import type { Phase } from "../lib/api";
import { STRINGS } from "../lib/strings";

function parseDate(d: string | null): number | null { if (!d) return null; const t = new Date(d).getTime(); return isNaN(t) ? null : t; }

type Props = { phases: Phase[] };

export default function PhaseTimeline({ phases }: Props) {
  const ranges = useMemo(() => {
    const arr = phases.map(p => {
      const start = parseDate(p.planned_start) ?? parseDate(p.actual_start);
      const end = parseDate(p.planned_end) ?? parseDate(p.actual_end) ?? start;
      return { id: p.id, name: p.name, status: p.status, start, end };
    }).filter(r => r.start !== null) as { id: string; name: string; status: Phase["status"]; start: number; end: number | null }[];
    return arr;
  }, [phases]);

  if (ranges.length === 0) return null;

  const minStart = Math.min(...ranges.map(r => r.start));
  const maxEnd = Math.max(...ranges.map(r => r.end || r.start));
  const total = Math.max(maxEnd - minStart, 1);

  const statusColor: Record<Phase["status"], string> = {
    planned: "bg-gray-400",
    in_progress: "bg-rdcBlue",
    completed: "bg-rdcGreen",
    blocked: "bg-rdcRed"
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="text-sm font-semibold text-gray-900 mb-2">{STRINGS.phasesGanttTitle}</div>
      <div className="space-y-3">
        {ranges.map(r => {
          const left = Math.max(0, Math.min(100, ((r.start - minStart) / total) * 100));
          const width = Math.max(2, Math.min(100, (((r.end || r.start) - r.start) / total) * 100));
          return (
            <div key={r.id} className="w-full">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-700 font-medium truncate" title={r.name}>{r.name}</span>
                <span className="text-[10px] text-gray-500">{STRINGS.phaseStatusLabels[r.status]}</span>
              </div>
              <div className="relative w-full h-3 bg-gray-200 rounded">
                <div className={`absolute h-3 rounded ${statusColor[r.status]}`} style={{ left: `${left}%`, width: `${width}%`, transition: "all 0.6s ease" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}