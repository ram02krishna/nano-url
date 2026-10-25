export const formatNumber = (n) => (Number(n) || 0).toLocaleString();

export const compactNumber = (n) =>
  new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(Number(n) || 0);

export const hostnameOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export const timeAgo = (value) => {
  if (!value) return "Never";
  const diff = Date.now() - new Date(value).getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

/** Value for <input type="datetime-local"> in the user's local timezone. */
export const toLocalInputValue = (date) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Turn the sparse [{date:'YYYY-MM-DD', count}] list from the API into a
 * continuous series of the last `days` days (UTC, matching the server).
 */
export const fillDailySeries = (series = [], days = 30) => {
  const map = new Map(series.map((r) => [r.date, Number(r.count)]));
  const out = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    out.push({
      key,
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" }),
      value: map.get(key) ?? 0,
    });
  }
  return out;
};

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for insecure contexts / older browsers
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    ta.remove();
    return ok;
  }
};

export const errorMessage = (err, fallback = "Something went wrong") =>
  err?.response?.data?.error || err?.response?.data?.message || fallback;
