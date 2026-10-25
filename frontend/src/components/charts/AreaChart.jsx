import { useId, useState } from "react";

/**
 * Lightweight responsive area/line chart (no chart library needed).
 * data: [{ label: string, value: number }]
 */
const AreaChart = ({ data, height = 160, className = "" }) => {
  const gradId = useId().replace(/:/g, "");
  const [hover, setHover] = useState(null);

  const W = 600;
  const H = 160;
  const padTop = 12;
  const padBottom = 6;

  const max = Math.max(1, ...data.map((d) => d.value));
  const niceMax = max <= 4 ? 4 : Math.ceil(max / 4) * 4;
  const n = data.length;
  const stepX = n > 1 ? W / (n - 1) : W;

  const pts = data.map((d, i) => ({
    x: n > 1 ? i * stepX : W / 2,
    y: padTop + (1 - d.value / niceMax) * (H - padTop - padBottom),
  }));

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = pts.length
    ? `${line} L${pts[pts.length - 1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z`
    : "";

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHover(Math.round(ratio * (n - 1)));
  };

  const hovered = hover !== null ? data[hover] : null;
  const hp = hover !== null ? pts[hover] : null;

  const tickIdx = n > 1 ? [0, Math.floor((n - 1) / 2), n - 1] : [0];

  return (
    <div className={className}>
      <div
        className="relative select-none"
        style={{ height }}
        onMouseMove={onMove}
        onTouchMove={(e) => onMove(e.touches[0] ? { currentTarget: e.currentTarget, clientX: e.touches[0].clientX } : e)}
        onMouseLeave={() => setHover(null)}
        onTouchEnd={() => setHover(null)}
        role="img"
        aria-label={`Chart of ${n} data points, peak ${max}`}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00aaff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#00aaff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = padTop + t * (H - padTop - padBottom);
            return (
              <line key={t} x1="0" x2={W} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray={t === 1 ? "" : "3 4"} />
            );
          })}

          {area && <path d={area} fill={`url(#${gradId})`} />}
          {line && (
            <path d={line} fill="none" stroke="#00aaff" strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          )}
          {hp && (
            <line x1={hp.x} x2={hp.x} y1={padTop} y2={H} stroke="#00aaff" strokeOpacity="0.45" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          )}
        </svg>

        {hp && hovered && (
          <>
            <span
              className="absolute w-2.5 h-2.5 rounded-full bg-accent-400 ring-4 ring-accent-400/25 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: `${(hp.x / W) * 100}%`, top: `${(hp.y / H) * 100}%` }}
            />
            <div
              className="absolute -top-1 -translate-y-full -translate-x-1/2 pointer-events-none card px-2.5 py-1.5 text-xs shadow-lg whitespace-nowrap z-10"
              style={{ left: `${Math.min(88, Math.max(12, (hp.x / W) * 100))}%` }}
            >
              <span className="font-semibold text-accent-700 dark:text-accent-300">{hovered.value.toLocaleString()}</span>
              <span className="text-zinc-500 dark:text-zinc-400"> · {hovered.label}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-between mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
        {tickIdx.map((i) => (
          <span key={i}>{data[i]?.label}</span>
        ))}
      </div>
    </div>
  );
};

export default AreaChart;
