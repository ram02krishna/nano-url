import { useState } from "react";
import {
  Copy, ExternalLink, BarChart3, QrCode, Pencil, Trash2, Lock,
  MousePointerClick, Link2, Gauge,
} from "lucide-react";
import { getShortUrl } from "../../utils/urlFormat";
import { getLinkStatus } from "../../utils/linkStatus";
import { formatNumber, hostnameOf, timeAgo } from "../../utils/format";
import ExpiryBadge from "./ExpiryBadge";

const Favicon = ({ url }) => {
  const [failed, setFailed] = useState(false);
  const host = hostnameOf(url);

  if (failed || !host) {
    return (
      <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-900/40 flex items-center justify-center shrink-0">
        <Link2 className="w-4 h-4 text-accent-600 dark:text-accent-300" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-white dark:bg-accent-900/40 border border-accent-100 dark:border-accent-800 flex items-center justify-center shrink-0 overflow-hidden">
      <img
        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`}
        alt=""
        width={22}
        height={22}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </div>
  );
};

const IconAction = ({ label, onClick, href, children, danger }) => {
  const cls = `btn-icon btn-ghost !p-2 ${danger ? "!text-red-500 hover:!bg-red-50 dark:hover:!bg-red-900/20" : ""}`;
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" title={label} aria-label={label} className={cls}>{children}</a>
  ) : (
    <button type="button" onClick={onClick} title={label} aria-label={label} className={cls}>{children}</button>
  );
};

const LinkCard = ({ url, onCopy, onDelete, onAnalytics, onQrCode, onEdit, onToggle }) => {
  const shortUrl = getShortUrl(url.shortCode);
  const status = getLinkStatus(url);
  const usable = status === "active";
  const display = shortUrl.replace(/^https?:\/\//, "");

  return (
    <article className={`card card-hover p-3.5 sm:p-4 ${usable ? "" : "opacity-80"}`}>
      <div className="flex items-start gap-3">
        <Favicon url={url.targetURL} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
              {url.title || hostnameOf(url.targetURL)}
            </h3>
            {status === "disabled" && <span className="badge-zinc shrink-0">Disabled</span>}
            {status === "expired" && <span className="badge-red shrink-0">Expired</span>}
            {status === "limit" && <span className="badge-amber shrink-0">Limit reached</span>}
          </div>

          <button
            type="button"
            onClick={() => onCopy(url.shortCode)}
            className="mt-0.5 max-w-full text-left text-sm font-mono font-medium text-accent-600 dark:text-accent-400 hover:underline truncate block"
            title="Click to copy"
          >
            {display}
          </button>

          <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5" title={url.targetURL}>
            → {url.targetURL}
          </p>

          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span className="badge-blue" title="Total clicks">
              <MousePointerClick className="w-3 h-3" />
              {formatNumber(url.clickCount)}{url.maxClicks != null ? ` / ${formatNumber(url.maxClicks)}` : ""} clicks
            </span>
            {url.hasPassword && <span className="badge-zinc"><Lock className="w-3 h-3" />Protected</span>}
            {url.maxClicks != null && status !== "limit" && (
              <span className="badge-zinc"><Gauge className="w-3 h-3" />{formatNumber(Math.max(0, url.maxClicks - url.clickCount))} left</span>
            )}
            <ExpiryBadge expiresAt={url.expiresAt} />
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500" title={new Date(url.createdAt).toLocaleString()}>
              Created {timeAgo(url.createdAt)}
            </span>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={url.isActive}
          aria-label={url.isActive ? "Disable link" : "Enable link"}
          title={url.isActive ? "Active — click to disable" : "Disabled — click to enable"}
          onClick={() => onToggle(url)}
          className="switch mt-1"
        />
      </div>

      <div className="mt-3 pt-3 border-t border-accent-100 dark:border-accent-900/60 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => onCopy(url.shortCode)} className="btn-secondary btn btn-sm" disabled={!usable && status !== "limit"}>
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
          {usable && (
            <a href={shortUrl} target="_blank" rel="noreferrer" className="btn-ghost btn btn-sm">
              <ExternalLink className="w-3.5 h-3.5" /> Visit
            </a>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <IconAction label="Analytics" onClick={onAnalytics}><BarChart3 className="w-4 h-4" /></IconAction>
          <IconAction label="QR code" onClick={onQrCode}><QrCode className="w-4 h-4" /></IconAction>
          <IconAction label="Edit" onClick={onEdit}><Pencil className="w-4 h-4" /></IconAction>
          <IconAction label="Delete" onClick={onDelete} danger><Trash2 className="w-4 h-4" /></IconAction>
        </div>
      </div>
    </article>
  );
};

export default LinkCard;
