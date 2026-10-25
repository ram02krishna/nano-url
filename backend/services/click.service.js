import { UAParser } from "ua-parser-js";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { clicksTable, urlsTable } from "../models/index.js";

const LOCALHOST_IPS = new Set(["::1", "127.0.0.1", "::ffff:127.0.0.1"]);
const UNKNOWN_GEO = { country: "Unknown", city: "Unknown", latitude: null, longitude: null };

// Tiny in-memory cache so repeat visitors don't trigger a new geo API call
const GEO_TTL_MS = 6 * 60 * 60 * 1000;
const GEO_CACHE_MAX = 5000;
const geoCache = new Map();

async function geoLookup(ip) {
  if (!ip || LOCALHOST_IPS.has(ip)) {
    return { country: "Localhost", city: "Localhost", latitude: null, longitude: null };
  }

  const cached = geoCache.get(ip);
  if (cached && cached.expires > Date.now()) return cached.value;

  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,city,lat,lon`,
      { signal: AbortSignal.timeout(1500) }
    );
    const data = await res.json();
    const value = data.status === "success"
      ? {
          country: data.country || "Unknown",
          city: data.city || "Unknown",
          latitude: data.lat ? String(data.lat) : null,
          longitude: data.lon ? String(data.lon) : null,
        }
      : UNKNOWN_GEO;

    if (geoCache.size >= GEO_CACHE_MAX) geoCache.delete(geoCache.keys().next().value);
    geoCache.set(ip, { value, expires: Date.now() + GEO_TTL_MS });
    return value;
  } catch {
    return UNKNOWN_GEO;
  }
}

/**
 * Atomically count a visit. Returns false when the link has reached its click
 * limit (so concurrent visitors can never exceed `maxClicks`).
 */
export async function registerVisit(urlId) {
  const rows = await db
    .update(urlsTable)
    .set({
      clickCount: sql`${urlsTable.clickCount} + 1`,
      lastClickedAt: new Date(),
    })
    .where(
      sql`${urlsTable.id} = ${urlId}
          AND (${urlsTable.maxClicks} IS NULL OR ${urlsTable.clickCount} < ${urlsTable.maxClicks})`
    )
    .returning({ id: urlsTable.id });
  return rows.length > 0;
}

export async function logClick({ urlId, ip, ua, referrer, edgeGeo }) {
  try {
    const result = new UAParser(ua).getResult();
    const browser = result.browser.name ?? "Unknown";
    const os = result.os.name ?? "Unknown";
    const rawType = result.device.type;
    const device = rawType === "mobile" ? "Mobile" : rawType === "tablet" ? "Tablet" : "Desktop";

    const { country, city, latitude, longitude } = edgeGeo ?? (await geoLookup(ip));

    await db.insert(clicksTable).values({
      urlId,
      ipAddress: ip || "Unknown",
      country,
      city,
      latitude,
      longitude,
      browser,
      os,
      device,
      referrer: referrer || "Direct",
    });
  } catch (err) {
    console.error("Failed to log click:", err?.message ?? err);
  }
}

/**
 * Record a click without delaying the redirect.
 * On serverless (Vercel) the work must finish before the function is frozen,
 * so we await there; elsewhere it runs in the background.
 */
export function recordClick(payload) {
  const task = logClick(payload);
  return process.env.VERCEL === "1" ? task : undefined;
}
