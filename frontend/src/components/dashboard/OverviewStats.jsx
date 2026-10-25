import { useEffect, useMemo, useState } from "react";
import { Link2, Zap, MousePointerClick, Users, Trophy } from "lucide-react";
import AreaChart from "../charts/AreaChart";
import { getOverview } from "../../services/url.service";
import { compactNumber, fillDailySeries, formatNumber } from "../../utils/format";
import { getShortUrl } from "../../utils/urlFormat";

const Tile = ({ icon: Icon, label, value, hint }) => (
  <div className="card p-4">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="w-7 h-7 rounded-lg bg-accent-50 dark:bg-accent-900/40 text-accent-600 dark:text-accent-300 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5" />
      </span>
    </div>
    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-2 tabular-nums" title={formatNumber(value)}>
      {compactNumber(value)}
    </p>
    {hint && <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{hint}</p>}
  </div>
);

/** `refreshKey` changes whenever links are created/deleted so the numbers stay fresh. */
const OverviewStats = ({ refreshKey, onOpenLink }) => {
  const [stats, setStats] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOverview()
      .then((res) => { if (!cancelled) { setStats(res.data); setFailed(false); } })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const series = useMemo(() => (stats ? fillDailySeries(stats.clicksOverTime, stats.days) : []), [stats]);
  const periodClicks = useMemo(() => series.reduce((s, d) => s + d.value, 0), [series]);

  if (failed && !stats) return null;

  if (!stats) {
    return (
      <div className="space-y-3 mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-[98px]" />)}
        </div>
        <div className="skeleton h-52" />
      </div>
    );
  }

  return (
    <section className="space-y-3 mb-6" aria-label="Overview">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile icon={Link2} label="Total links" value={stats.totalLinks} hint={`${stats.activeLinks} active`} />
        <Tile icon={MousePointerClick} label="Total clicks" value={stats.totalClicks} hint={`${formatNumber(stats.clicksToday)} today`} />
        <Tile icon={Users} label="Unique visitors" value={stats.uniqueVisitors} hint="By IP address" />
        <Tile icon={Zap} label={`Clicks · ${stats.days}d`} value={periodClicks} hint="All links combined" />
      </div>

      {stats.totalClicks > 0 && (
        <div className="grid lg:grid-cols-3 gap-3">
          <div className="card p-4 lg:col-span-2 text-accent-700 dark:text-accent-300">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Traffic · last {stats.days} days
            </p>
            <AreaChart data={series} height={130} />
          </div>

          <div className="card p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              <Trophy className="w-3.5 h-3.5" /> Top links
            </p>
            <ol className="space-y-2">
              {stats.topLinks.map((l, i) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => onOpenLink?.(l.id)}
                    className="w-full flex items-center gap-2.5 text-left rounded-lg px-2 py-1.5 -mx-2 hover:bg-accent-50 dark:hover:bg-accent-900/30 transition-colors"
                  >
                    <span className="w-5 h-5 rounded-md bg-accent-100 dark:bg-accent-900/50 text-accent-700 dark:text-accent-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                        {l.title || `/${l.shortCode}`}
                      </span>
                      <span className="block text-[11px] font-mono text-zinc-400 truncate">
                        {getShortUrl(l.shortCode).replace(/^https?:\/\//, "")}
                      </span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">{compactNumber(l.clickCount)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
};

export default OverviewStats;
