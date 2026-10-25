/** Best-effort client IP (works behind Vercel / proxies). */
export function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  const first = typeof fwd === "string" ? fwd.split(",")[0]?.trim() : undefined;
  return first || req.socket?.remoteAddress || "Unknown";
}

/** Hostname of the Referer header, or "Direct". */
export function getReferrerHost(req) {
  const ref = req.headers["referer"] || req.headers["referrer"];
  if (!ref || typeof ref !== "string") return "Direct";
  try {
    return new URL(ref).hostname.replace(/^www\./, "").slice(0, 250) || "Direct";
  } catch {
    return "Direct";
  }
}

/** Geo hints supplied by edge platforms (Vercel / Cloudflare) — avoids an extra API call. */
export function getEdgeGeo(req) {
  const h = req.headers;
  const country = h["x-vercel-ip-country"] || h["cf-ipcountry"];
  if (!country || country === "XX") return null;

  let city = h["x-vercel-ip-city"];
  try { if (city) city = decodeURIComponent(city); } catch { /* keep raw */ }

  return {
    country: String(country),
    city: city ? String(city) : "Unknown",
    latitude: h["x-vercel-ip-latitude"] ? String(h["x-vercel-ip-latitude"]) : null,
    longitude: h["x-vercel-ip-longitude"] ? String(h["x-vercel-ip-longitude"]) : null,
  };
}
