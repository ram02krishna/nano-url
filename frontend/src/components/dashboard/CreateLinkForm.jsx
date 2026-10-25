import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Plus, Loader2, Lock, Clock, MousePointerClick, Tag, SlidersHorizontal,
  ClipboardPaste, Check, X, Link2, ChevronDown,
} from "lucide-react";
import { createShortUrl, checkAlias } from "../../services/url.service";
import { getShortHost, normalizeUrl } from "../../utils/urlFormat";
import { errorMessage, toLocalInputValue } from "../../utils/format";

const EXPIRY_OPTIONS = [
  { label: "Never expires", value: "" },
  { label: "1 hour", value: String(1 * 60 * 60 * 1000) },
  { label: "24 hours", value: String(24 * 60 * 60 * 1000) },
  { label: "7 days", value: String(7 * 24 * 60 * 60 * 1000) },
  { label: "30 days", value: String(30 * 24 * 60 * 60 * 1000) },
  { label: "Custom date…", value: "custom" },
];

const ALIAS_RE = /^[a-zA-Z0-9_-]{3,50}$/;

const CreateLinkForm = ({ onCreated }) => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [alias, setAlias] = useState("");
  const [expiry, setExpiry] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [password, setPassword] = useState("");
  const [maxClicks, setMaxClicks] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aliasState, setAliasState] = useState({ status: "idle", message: "" });
  const urlRef = useRef(null);
  const [minDate] = useState(() => toLocalInputValue(new Date(Date.now() + 60000)));

  // Live alias availability (debounced). Instant feedback is set in onAliasChange.
  useEffect(() => {
    if (!alias || !ALIAS_RE.test(alias)) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const { data } = await checkAlias(alias, controller.signal);
        setAliasState(
          data.available
            ? { status: "available", message: "Available" }
            : { status: "taken", message: data.reason || "Not available" }
        );
      } catch (err) {
        if (err?.code !== "ERR_CANCELED") setAliasState({ status: "idle", message: "" });
      }
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [alias]);

  const onAliasChange = (raw) => {
    const value = raw.replace(/\s/g, "");
    setAlias(value);
    if (!value) setAliasState({ status: "idle", message: "" });
    else if (!ALIAS_RE.test(value)) setAliasState({ status: "invalid", message: "3-50 characters: letters, numbers, - and _" });
    else setAliasState({ status: "checking", message: "" });
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      toast.error("Couldn't read the clipboard — paste manually instead");
    }
  };

  const reset = () => {
    setUrl(""); setTitle(""); setAlias(""); setExpiry(""); setCustomDate("");
    setAliasState({ status: "idle", message: "" });
    setPassword(""); setMaxClicks("");
  };

  const submit = async (e) => {
    e.preventDefault();

    const { url: target, error } = normalizeUrl(url);
    if (error) { toast.error(error); urlRef.current?.focus(); return; }
    if (alias && (aliasState.status === "invalid" || aliasState.status === "taken")) {
      toast.error(aliasState.message || "Fix the custom alias first");
      setShowAdvanced(true);
      return;
    }

    let expiresAt;
    if (expiry === "custom") {
      if (!customDate) { toast.error("Please pick an expiry date"); return; }
      const d = new Date(customDate);
      if (d.getTime() <= Date.now()) { toast.error("Expiry must be in the future"); return; }
      expiresAt = d.toISOString();
    } else if (expiry) {
      expiresAt = new Date(Date.now() + Number(expiry)).toISOString();
    }

    const payload = { url: target };
    if (title.trim()) payload.title = title.trim();
    if (alias) payload.code = alias;
    if (expiresAt) payload.expiresAt = expiresAt;
    if (password) payload.password = password;
    if (maxClicks) payload.maxClicks = Number(maxClicks);

    setLoading(true);
    try {
      const res = await createShortUrl(payload);
      onCreated(res.data);
      reset();
      toast.success("Link created!");
    } catch (err) {
      toast.error(errorMessage(err, "Failed to create link"));
    } finally {
      setLoading(false);
    }
  };

  const hasAdvanced = !!(title || alias || expiry || password || maxClicks);

  return (
    <form onSubmit={submit} className="card p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-400 pointer-events-none" />
          <input
            ref={urlRef}
            type="text"
            inputMode="url"
            autoComplete="off"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a long URL to shorten…"
            className="input pl-9 pr-10 py-3"
            disabled={loading}
            aria-label="Long URL"
          />
          <button
            type="button"
            onClick={paste}
            title="Paste from clipboard"
            aria-label="Paste from clipboard"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 btn-icon btn-ghost !p-1.5"
          >
            <ClipboardPaste className="w-4 h-4" />
          </button>
        </div>
        <button type="submit" disabled={loading || !url.trim()} className="btn-primary btn px-6 py-3 shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" />Shorten</>}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        aria-expanded={showAdvanced}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent-700 dark:text-accent-300 hover:underline"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        Advanced options
        {hasAdvanced && !showAdvanced && <span className="w-1.5 h-1.5 rounded-full bg-accent-400" />}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
      </button>

      {showAdvanced && (
        <div className="mt-3 grid sm:grid-cols-2 gap-3 animate-fade-in">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              <Tag className="w-3.5 h-3.5" /> Title <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="e.g. Summer campaign"
              className="input text-sm"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              <Link2 className="w-3.5 h-3.5" /> Custom alias <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <div className="relative flex">
              <span className="inline-flex items-center px-3 text-xs font-mono text-zinc-500 dark:text-zinc-400 rounded-l-lg border border-r-0 border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-900/30 max-w-[45%] truncate">
                {getShortHost()}/
              </span>
              <input
                value={alias}
                onChange={(e) => onAliasChange(e.target.value)}
                maxLength={50}
                placeholder="my-link"
                className="input text-sm font-mono !rounded-l-none pr-9"
                disabled={loading}
                aria-describedby="alias-status"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                {aliasState.status === "checking" && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
                {aliasState.status === "available" && <Check className="w-4 h-4 text-green-500" />}
                {(aliasState.status === "taken" || aliasState.status === "invalid") && <X className="w-4 h-4 text-red-500" />}
              </span>
            </div>
            <p
              id="alias-status"
              className={`text-xs min-h-[1rem] ${aliasState.status === "available" ? "text-green-600 dark:text-green-400" : "text-red-500"}`}
            >
              {aliasState.message}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              <Clock className="w-3.5 h-3.5" /> Expiration
            </label>
            <select value={expiry} onChange={(e) => setExpiry(e.target.value)} className="input text-sm" disabled={loading}>
              {EXPIRY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {expiry === "custom" && (
              <input
                type="datetime-local"
                value={customDate}
                min={minDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="input text-sm mt-2"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              <MousePointerClick className="w-3.5 h-3.5" /> Click limit <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <input
              type="number"
              min={1}
              max={10000000}
              value={maxClicks}
              onChange={(e) => setMaxClicks(e.target.value)}
              placeholder="Unlimited"
              className="input text-sm"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              <Lock className="w-3.5 h-3.5" /> Password protection <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <input
              type="password"
              autoComplete="new-password"
              minLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 4 characters"
              className="input text-sm"
              disabled={loading}
            />
          </div>
        </div>
      )}
    </form>
  );
};

export default CreateLinkForm;
