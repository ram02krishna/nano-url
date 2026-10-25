import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link as LinkIcon, Search, Download, X, ArrowUpDown } from "lucide-react";
import { getUserUrls, updateUrl, deleteUrl } from "../services/url.service";
import { getShortUrl } from "../utils/urlFormat";
import { getLinkStatus } from "../utils/linkStatus";
import { copyText, downloadBlob, errorMessage, hostnameOf } from "../utils/format";
import { useAuth } from "../context/AuthContext";

import CreateLinkForm from "../components/dashboard/CreateLinkForm";
import OverviewStats from "../components/dashboard/OverviewStats";
import LinkCard from "../components/dashboard/LinkCard";
import AnalyticsModal from "../components/dashboard/AnalyticsModal";
import EditLinkModal from "../components/dashboard/EditLinkModal";
import QRModal from "../components/dashboard/QRModal";
import DeleteModal from "../components/dashboard/DeleteModal";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "protected", label: "Protected" },
  { id: "inactive", label: "Disabled / expired" },
];

const SORTS = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "clicks", label: "Most clicks" },
  { id: "expiring", label: "Expiring soon" },
];

const PAGE_SIZE = 12;

const sorters = {
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  clicks: (a, b) => (b.clickCount ?? 0) - (a.clickCount ?? 0),
  expiring: (a, b) => {
    const ax = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
    const bx = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
    return ax - bx;
  },
};

const Dashboard = () => {
  const { user } = useAuth();
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const [editUrl, setEditUrl] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [analyticsUrl, setAnalyticsUrl] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  const searchRef = useRef(null);

  const bump = () => setRefreshKey((k) => k + 1);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getUserUrls()
      .then((res) => { if (!cancelled) { setUrls(res.data.codes || []); setLoadError(false); } })
      .catch(() => { if (!cancelled) { setLoadError(true); toast.error("Failed to load links"); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const load = () => { setLoading(true); setLoadError(false); setReloadKey((k) => k + 1); };

  // "/" focuses the search box
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(tag) && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleCreated = (link) => { setUrls((prev) => [link, ...prev]); bump(); };
  const replaceUrl = (link) => { setUrls((prev) => prev.map((u) => (u.id === link.id ? link : u))); bump(); };

  const copy = async (shortCode) => {
    (await copyText(getShortUrl(shortCode))) ? toast.success("Copied to clipboard") : toast.error("Couldn't copy");
  };

  const handleToggle = async (url) => {
    const next = !url.isActive;
    // optimistic
    setUrls((prev) => prev.map((u) => (u.id === url.id ? { ...u, isActive: next } : u)));
    try {
      const res = await updateUrl(url.id, { isActive: next });
      replaceUrl(res.data);
      toast.success(next ? "Link enabled" : "Link disabled");
    } catch (err) {
      setUrls((prev) => prev.map((u) => (u.id === url.id ? { ...u, isActive: url.isActive } : u)));
      toast.error(errorMessage(err, "Failed to update link"));
    }
  };

  const handleDelete = async () => {
    const target = deleteTarget;
    if (!target) return;
    try {
      await deleteUrl(target.id);
      setUrls((prev) => prev.filter((u) => u.id !== target.id));
      setDeleteTarget(null);
      bump();
      toast.success("Link deleted");
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete"));
    }
  };

  const openAnalyticsById = (id) => {
    const url = urls.find((u) => u.id === id);
    if (url) setAnalyticsUrl(url);
  };

  const exportLinks = () => {
    const esc = (v) => {
      let s = String(v ?? "");
      if (/^[=+\-@]/.test(s)) s = `'${s}`;
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = [
      ["title", "short_url", "destination", "clicks", "status", "protected", "expires_at", "created_at"],
      ...urls.map((u) => [
        u.title, getShortUrl(u.shortCode), u.targetURL, u.clickCount, getLinkStatus(u),
        u.hasPassword ? "yes" : "no", u.expiresAt ?? "", u.createdAt,
      ]),
    ];
    downloadBlob(new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" }), "nanourl-links.csv");
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return urls
      .filter((u) => {
        const status = getLinkStatus(u);
        if (filter === "active" && status !== "active") return false;
        if (filter === "protected" && !u.hasPassword) return false;
        if (filter === "inactive" && status === "active") return false;
        if (!q) return true;
        return (
          u.shortCode.toLowerCase().includes(q) ||
          u.targetURL.toLowerCase().includes(q) ||
          (u.title ?? "").toLowerCase().includes(q) ||
          hostnameOf(u.targetURL).toLowerCase().includes(q)
        );
      })
      .sort(sorters[sort]);
  }, [urls, query, filter, sort]);

  const shown = filtered.slice(0, visible);
  const activeCount = urls.filter((u) => getLinkStatus(u) === "active").length;
  const greeting = user?.firstname ? `Hi, ${user.firstname}` : "Your links";

  return (
    <div className="min-h-screen pt-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{greeting}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {urls.length} {urls.length === 1 ? "link" : "links"} · {activeCount} active
            </p>
          </div>
          {urls.length > 0 && (
            <button onClick={exportLinks} className="btn-secondary btn btn-sm shrink-0" title="Download all links as CSV">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          )}
        </div>

        <div className="mb-6">
          <CreateLinkForm onCreated={handleCreated} />
        </div>

        <OverviewStats refreshKey={refreshKey} onOpenLink={openAnalyticsById} />

        {urls.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setVisible(PAGE_SIZE); }}
                placeholder="Search by title, alias or destination…"
                className="input pl-9 pr-16 text-sm"
                aria-label="Search links"
              />
              {query ? (
                <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 btn-icon btn-ghost !p-1.5" aria-label="Clear search">
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 kbd hidden sm:inline-flex">/</span>
              )}
            </div>

            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="input text-sm pl-9 md:w-44" aria-label="Sort links">
                {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {urls.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4" role="group" aria-label="Filter links">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => { setFilter(f.id); setVisible(PAGE_SIZE); }}
                className={`chip ${filter === f.id ? "chip-active" : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="skeleton h-[148px]" />)}
          </div>
        ) : loadError && urls.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">We couldn't load your links.</p>
            <button onClick={load} className="btn-primary btn btn-sm mt-4">Try again</button>
          </div>
        ) : urls.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-accent-50 dark:bg-accent-900/40 flex items-center justify-center mx-auto mb-4">
              <LinkIcon className="w-6 h-6 text-accent-500" />
            </div>
            <p className="text-base font-semibold text-zinc-800 dark:text-zinc-100">No links yet</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              Paste a long URL above to create your first short link. You'll get a QR code and click analytics for free.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-10 text-center">
            <Search className="w-7 h-7 text-accent-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">No links match your filters</p>
            <button onClick={() => { setQuery(""); setFilter("all"); }} className="btn-secondary btn btn-sm mt-4">Clear filters</button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {shown.map((url) => (
                <LinkCard
                  key={url.id}
                  url={url}
                  onCopy={copy}
                  onToggle={handleToggle}
                  onEdit={() => setEditUrl(url)}
                  onDelete={() => setDeleteTarget(url)}
                  onAnalytics={() => setAnalyticsUrl(url)}
                  onQrCode={() => setQrCodeUrl(url)}
                />
              ))}
            </div>
            {filtered.length > shown.length && (
              <div className="text-center mt-5">
                <button onClick={() => setVisible((v) => v + PAGE_SIZE)} className="btn-secondary btn text-sm">
                  Show more ({filtered.length - shown.length} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {editUrl && <EditLinkModal url={editUrl} onClose={() => setEditUrl(null)} onSaved={replaceUrl} />}
      {deleteTarget && <DeleteModal url={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
      {analyticsUrl && <AnalyticsModal url={analyticsUrl} onClose={() => setAnalyticsUrl(null)} />}
      {qrCodeUrl && <QRModal url={qrCodeUrl} onClose={() => setQrCodeUrl(null)} />}
    </div>
  );
};

export default Dashboard;
