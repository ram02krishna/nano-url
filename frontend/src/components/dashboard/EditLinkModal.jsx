import { useState } from "react";
import toast from "react-hot-toast";
import { X, Loader2, Lock, Clock, MousePointerClick, Tag, Link2 } from "lucide-react";
import Modal from "../common/Modal";
import { updateUrl } from "../../services/url.service";
import { normalizeUrl, getShortUrl } from "../../utils/urlFormat";
import { errorMessage, toLocalInputValue } from "../../utils/format";

const EditLinkModal = ({ url, onClose, onSaved }) => {
  const [target, setTarget] = useState(url.targetURL);
  const [title, setTitle] = useState(url.title ?? "");
  const [expires, setExpires] = useState(url.expiresAt ? toLocalInputValue(url.expiresAt) : "");
  const [maxClicks, setMaxClicks] = useState(url.maxClicks ?? "");
  const [isActive, setIsActive] = useState(url.isActive);
  const [passwordMode, setPasswordMode] = useState("keep"); // keep | change | remove
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    const changes = {};

    const { url: normalized, error } = normalizeUrl(target);
    if (error) return toast.error(error);
    if (normalized !== url.targetURL) changes.url = normalized;

    if (title.trim() !== (url.title ?? "")) changes.title = title.trim() || null;
    if (isActive !== url.isActive) changes.isActive = isActive;

    const prevExpires = url.expiresAt ? toLocalInputValue(url.expiresAt) : "";
    if (expires !== prevExpires) {
      if (expires && new Date(expires).getTime() <= Date.now()) return toast.error("Expiry must be in the future");
      changes.expiresAt = expires ? new Date(expires).toISOString() : null;
    }

    const prevMax = url.maxClicks ?? "";
    if (String(maxClicks) !== String(prevMax)) {
      changes.maxClicks = maxClicks === "" ? null : Number(maxClicks);
    }

    if (passwordMode === "remove" && url.hasPassword) changes.password = null;
    if (passwordMode === "change") {
      if (password.length < 4) return toast.error("Password must be at least 4 characters");
      changes.password = password;
    }

    if (Object.keys(changes).length === 0) return onClose();

    setSaving(true);
    try {
      const res = await updateUrl(url.id, changes);
      onSaved(res.data);
      toast.success("Link updated");
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update link"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} width="max-w-lg" labelledBy="edit-title">
      <div className="flex items-center justify-between px-5 py-4 border-b border-accent-100 dark:border-accent-900/60">
        <div className="min-w-0">
          <h3 id="edit-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Edit link</h3>
          <p className="text-xs font-mono text-zinc-400 mt-0.5 truncate">{getShortUrl(url.shortCode).replace(/^https?:\/\//, "")}</p>
        </div>
        <button onClick={onClose} className="btn-icon btn-ghost" aria-label="Close"><X className="w-4 h-4" /></button>
      </div>

      <form onSubmit={save} className="p-5 space-y-4 overflow-y-auto">
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300"><Link2 className="w-3.5 h-3.5" />Destination URL</label>
          <input value={target} onChange={(e) => setTarget(e.target.value)} className="input text-sm" required />
          <p className="text-[11px] text-zinc-400">The short link stays the same — only where it points changes.</p>
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300"><Tag className="w-3.5 h-3.5" />Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className="input text-sm" placeholder="Optional label" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300"><Clock className="w-3.5 h-3.5" />Expires</label>
            <input type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)} className="input text-sm" />
            {expires && (
              <button type="button" onClick={() => setExpires("")} className="text-[11px] text-accent-600 hover:underline">Remove expiry</button>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300"><MousePointerClick className="w-3.5 h-3.5" />Click limit</label>
            <input type="number" min={1} value={maxClicks} onChange={(e) => setMaxClicks(e.target.value)} className="input text-sm" placeholder="Unlimited" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300"><Lock className="w-3.5 h-3.5" />Password</label>
          <div className="flex flex-wrap gap-1.5">
            {[
              ["keep", url.hasPassword ? "Keep current" : "No password"],
              ["change", url.hasPassword ? "Change" : "Add password"],
              ...(url.hasPassword ? [["remove", "Remove"]] : []),
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPasswordMode(mode)}
                className={`chip ${passwordMode === mode ? "chip-active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
          {passwordMode === "change" && (
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (min 4 characters)"
              className="input text-sm animate-fade-in"
              autoFocus
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-accent-100 dark:border-accent-900/60 px-3.5 py-3">
          <div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Link is active</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Turn off to pause redirects without deleting the link.</p>
          </div>
          <button type="button" role="switch" aria-checked={isActive} onClick={() => setIsActive((v) => !v)} className="switch" aria-label="Link active" />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary btn text-sm" disabled={saving}>Cancel</button>
          <button type="submit" className="btn-primary btn text-sm min-w-[7rem]" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditLinkModal;
