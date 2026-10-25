import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  BarChart3, X, RefreshCw, MousePointerClick, Users, CalendarDays, TrendingUp,
  Globe, MapPin, Compass, Cpu, Smartphone, ArrowUpRight, Download, Loader2,
} from "lucide-react";
import Modal from "../common/Modal";
import AreaChart from "../charts/AreaChart";
import BarList from "../charts/BarList";
import { getUrlAnalytics, exportClicksCsv } from "../../services/url.service";
import { downloadBlob, errorMessage, fillDailySeries, formatNumber } from "../../utils/format";

const RANGES = [7, 30, 90];

const StatTile = ({ icon: Icon, label, value }) => (
  <div className="stat-tile">
    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mb-1.5">
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[11px] font-medium">{label}</span>
    </div>
    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">{formatNumber(value)}</p>
  </div>
);

const AnalyticsModal = ({ url, onClose }) => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getUrlAnalytics(url.id, days)
      .then((res) => { if (!cancelled) { setData(res.data); setError(null); } })
      .catch((err) => { if (!cancelled) setError(errorMessage(err, "Failed to load analytics")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [url.id, days, reloadKey]);

  const load = () => { setLoading(true); setError(null); setReloadKey((k) => k + 1); };
  const changeRange = (r) => { if (r !== days) { setLoading(true); setDays(r); } };

  const series = useMemo(() => (data ? fillDailySeries(data.clicksOverTime, days) : []), [data, days]);
  const periodTotal = useMemo(() => series.reduce((s, d) => s + d.value, 0), [series]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await exportClicksCsv(url.id);
      downloadBlob(res.data, `clicks-${url.shortCode}.csv`);
    } catch (err) {
      toast.error(errorMessage(err, "Export failed"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal onClose={onClose} width="max-w-3xl" labelledBy="analytics-title">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-accent-100 dark:border-accent-900/60">
        <div className="min-w-0">
          <h3 id="analytics-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent-500" />
            Analytics
          </h3>
          <p className="text-xs font-mono text-zinc-400 mt-0.5 truncate">/{url.shortCode}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={exportCsv} disabled={exporting || !data?.totalClicks} className="btn-secondary btn btn-sm" title="Export all clicks as CSV">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span className="hidden xs:inline">CSV</span>
          </button>
          <button onClick={load} className="btn-icon btn-ghost" title="Refresh" aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={onClose} className="btn-icon btn-ghost" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="p-4 sm:p-5 overflow-y-auto flex-1">
        {loading && !data && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-[74px]" />)}
            </div>
            <div className="skeleton h-48" />
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-10">
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={load} className="btn-secondary btn btn-sm mt-3">Try again</button>
          </div>
        )}

        {data && !error && (
          <div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile icon={MousePointerClick} label="Total clicks" value={data.totalClicks} />
              <StatTile icon={Users} label="Unique visitors" value={data.uniqueClicks} />
              <StatTile icon={CalendarDays} label="Today" value={data.clicksToday} />
              <StatTile icon={TrendingUp} label="Last 7 days" value={data.clicksLast7} />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Clicks over time</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{formatNumber(periodTotal)} in the last {days} days</p>
                </div>
                <div className="flex gap-1.5" role="group" aria-label="Date range">
                  {RANGES.map((r) => (
                    <button key={r} onClick={() => changeRange(r)} className={`chip ${days === r ? "chip-active" : ""}`}>{r}d</button>
                  ))}
                </div>
              </div>
              <div className="stat-tile !p-3 sm:!p-4 text-accent-700 dark:text-accent-300">
                <AreaChart data={series} height={170} />
              </div>
            </div>

            {data.totalClicks === 0 ? (
              <div className="text-center py-8 border border-dashed border-accent-200 dark:border-accent-800 rounded-2xl">
                <MousePointerClick className="w-8 h-8 text-accent-300 dark:text-accent-700 mx-auto mb-2" />
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">No clicks recorded yet</p>
                <p className="text-xs text-zinc-400 mt-1">Share your link and the stats will show up here.</p>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-3">
                  <BarList title="Countries" icon={Globe} items={data.topCountries} />
                  <BarList title="Cities" icon={MapPin} items={data.topCities} />
                  <BarList title="Browsers" icon={Compass} items={data.browsers} />
                  <BarList title="Operating systems" icon={Cpu} items={data.oses} />
                  <BarList title="Devices" icon={Smartphone} items={data.devices} />
                  <BarList title="Referrers" icon={ArrowUpRight} items={data.referrers} />
                </div>

                {data.visitorIps?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                      Recent visits
                    </p>
                    <div className="border border-accent-100 dark:border-accent-900/60 rounded-xl overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-accent-100 dark:border-accent-900/60 bg-accent-50/60 dark:bg-accent-900/20">
                            {["Time", "Location", "Browser", "OS", "Device", "Source"].map((h) => (
                              <th key={h} className="text-left px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-accent-50 dark:divide-accent-900/40">
                          {data.visitorIps.map((row, i) => (
                            <tr key={i} className="hover:bg-accent-50/50 dark:hover:bg-accent-900/20">
                              <td className="px-3 py-2 text-zinc-500 whitespace-nowrap">
                                {row.clickedAt ? new Date(row.clickedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                              </td>
                              <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                                {[row.city, row.country].filter((v) => v && v !== "Unknown").join(", ") || "Unknown"}
                              </td>
                              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">{row.browser ?? "—"}</td>
                              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">{row.os ?? "—"}</td>
                              <td className="px-3 py-2 whitespace-nowrap"><span className="badge-zinc">{row.device ?? "—"}</span></td>
                              <td className="px-3 py-2 text-zinc-500 whitespace-nowrap">{row.referrer ?? "Direct"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AnalyticsModal;
