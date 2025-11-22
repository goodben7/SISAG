type Props = {
  value: number; // 0-100
  size?: number;
  thickness?: number;
  label?: string;
  colorOverride?: string | null;
  valueFontPx?: number;
};

export default function RadialGauge({ value, size = 160, thickness = 12, label, colorOverride = null, valueFontPx = 16 }: Props) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value || 0));
  const offset = circumference - (clamped / 100) * circumference;

  let color = "#0072C6"; // rdcBlue par défaut
  if (colorOverride) {
    color = colorOverride;
  } else {
    if (clamped >= 80) color = "#008000"; // Vert (bon alignement)
    else if (clamped >= 50) color = "#FF9800"; // Orange (alignement moyen)
    else color = "#DC143C"; // Rouge (mauvais alignement)
  }

  return (
    <div className="inline-flex flex-col items-center justify-center" aria-label={label || "Jauge"} role="img">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#E5E7EB" strokeWidth={thickness} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="font-extrabold text-gray-900" style={{ fontSize: valueFontPx }}>{clamped.toFixed(0)}%</div>
        </div>
      </div>
      {typeof label === "string" && label.trim() !== "" && <div className="text-xs text-gray-600 mt-2">{label}</div>}
    </div>
  );
}