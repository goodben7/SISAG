interface ProjectStatusChartProps {
  inProgress: number;
  completed: number;
  delayed: number;
}

export function ProjectStatusChart({ inProgress, completed, delayed }: ProjectStatusChartProps) {
  const total = Math.max(inProgress + completed + delayed, 1);
  const segments = [
    { value: inProgress, color: '#0072C6', label: 'En cours' },
    { value: completed, color: '#008000', label: 'Terminés' },
    { value: delayed, color: '#DC143C', label: 'En retard' }
  ];

  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = segments.map((s) => {
    const length = (s.value / total) * circumference;
    const arc = { length, dash: `${length} ${circumference - length}`, offset };
    offset += length;
    return { ...s, ...arc };
  });

  return (
    <div className="card p-6">
      <h3 className="font-display font-semibold text-rdcTextPrimary mb-4">Répartition des projets</h3>
      <div className="flex items-center gap-6">
        <svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="Répartition des projets par statut">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="18" />
          {arcs.map((a, idx) => (
            <circle key={idx} cx="80" cy="80" r={radius} fill="none" stroke={a.color} strokeWidth="18" strokeDasharray={a.dash} strokeDashoffset={-a.offset} transform="rotate(-90 80 80)" />
          ))}
          <circle cx="80" cy="80" r="40" fill="#fff" />
          <text x="80" y="85" textAnchor="middle" className="font-display" fontSize="14" fill="#4B5563">{total} projets</text>
        </svg>
        <div className="space-y-2 text-sm">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: s.color }}></span>
              <span className="text-rdcGrayText">{s.label}</span>
              <span className="ml-auto font-semibold">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}