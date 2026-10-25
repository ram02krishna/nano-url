import { db } from "../db/index.js";
import { clicksTable, urlsTable } from "../models/index.js";
import { and, eq, sql, count, countDistinct, desc, inArray } from "drizzle-orm";

export async function getUrlAnalytics(urlId, days = 30) {
  const where = eq(clicksTable.urlId, urlId);
  const since = sql`NOW() - (${days} * INTERVAL '1 day')`;

  function topN(col) {
    return db
      .select({ label: col, count: count().as("count") })
      .from(clicksTable)
      .where(where)
      .groupBy(col)
      .orderBy(sql`count(*) desc`)
      .limit(10);
  }

  const [
    [totals],
    clicksOverTime,
    topCountries,
    topCities,
    browsers,
    oses,
    devices,
    referrers,
    visitorIps,
  ] = await Promise.all([
    db.select({
      totalClicks: count().as("total_clicks"),
      uniqueClicks: countDistinct(clicksTable.ipAddress).as("unique_clicks"),
      clicksToday: sql`count(*) FILTER (WHERE ${clicksTable.clickedAt} >= date_trunc('day', NOW()))`.mapWith(Number),
      clicksLast7: sql`count(*) FILTER (WHERE ${clicksTable.clickedAt} >= NOW() - INTERVAL '7 days')`.mapWith(Number),
    }).from(clicksTable).where(where),

    db.select({
      date: sql`to_char(DATE(${clicksTable.clickedAt}), 'YYYY-MM-DD')`.as("date"),
      count: count().as("count"),
    })
      .from(clicksTable)
      .where(and(where, sql`${clicksTable.clickedAt} >= ${since}`))
      .groupBy(sql`DATE(${clicksTable.clickedAt})`)
      .orderBy(sql`DATE(${clicksTable.clickedAt}) asc`),

    topN(clicksTable.country),
    topN(clicksTable.city),
    topN(clicksTable.browser),
    topN(clicksTable.os),
    topN(clicksTable.device),
    topN(clicksTable.referrer),

    db.select({
      ip: clicksTable.ipAddress,
      country: clicksTable.country,
      city: clicksTable.city,
      latitude: clicksTable.latitude,
      longitude: clicksTable.longitude,
      browser: clicksTable.browser,
      os: clicksTable.os,
      device: clicksTable.device,
      referrer: clicksTable.referrer,
      clickedAt: clicksTable.clickedAt,
    })
      .from(clicksTable)
      .where(where)
      .orderBy(desc(clicksTable.clickedAt))
      .limit(50),
  ]);

  return {
    days,
    totalClicks: Number(totals?.totalClicks ?? 0),
    uniqueClicks: Number(totals?.uniqueClicks ?? 0),
    clicksToday: Number(totals?.clicksToday ?? 0),
    clicksLast7: Number(totals?.clicksLast7 ?? 0),
    topCountries,
    topCities,
    browsers,
    oses,
    devices,
    referrers,
    clicksOverTime,
    visitorIps,
  };
}

/** Account-wide overview shown at the top of the dashboard. */
export async function getUserOverview(userId, days = 14) {
  const urls = await db
    .select({
      id: urlsTable.id,
      shortCode: urlsTable.shortCode,
      title: urlsTable.title,
      clickCount: urlsTable.clickCount,
      isActive: urlsTable.isActive,
      expiresAt: urlsTable.expiresAt,
    })
    .from(urlsTable)
    .where(eq(urlsTable.userId, userId));

  const ids = urls.map((u) => u.id);
  const now = Date.now();

  const totalLinks = urls.length;
  const activeLinks = urls.filter(
    (u) => u.isActive && (!u.expiresAt || new Date(u.expiresAt).getTime() > now)
  ).length;
  const totalClicks = urls.reduce((sum, u) => sum + (u.clickCount ?? 0), 0);
  const topLinks = [...urls]
    .sort((a, b) => b.clickCount - a.clickCount)
    .slice(0, 5)
    .filter((u) => u.clickCount > 0);

  let clicksOverTime = [];
  let uniqueVisitors = 0;
  let clicksToday = 0;

  if (ids.length) {
    const scope = inArray(clicksTable.urlId, ids);

    const [series, [uniq]] = await Promise.all([
      db.select({
        date: sql`to_char(DATE(${clicksTable.clickedAt}), 'YYYY-MM-DD')`.as("date"),
        count: count().as("count"),
      })
        .from(clicksTable)
        .where(and(scope, sql`${clicksTable.clickedAt} >= NOW() - (${days} * INTERVAL '1 day')`))
        .groupBy(sql`DATE(${clicksTable.clickedAt})`)
        .orderBy(sql`DATE(${clicksTable.clickedAt}) asc`),

      db.select({
        unique: countDistinct(clicksTable.ipAddress),
        today: sql`count(*) FILTER (WHERE ${clicksTable.clickedAt} >= date_trunc('day', NOW()))`.mapWith(Number),
      }).from(clicksTable).where(scope),
    ]);

    clicksOverTime = series;
    uniqueVisitors = Number(uniq?.unique ?? 0);
    clicksToday = Number(uniq?.today ?? 0);
  }

  return { totalLinks, activeLinks, totalClicks, uniqueVisitors, clicksToday, days, clicksOverTime, topLinks };
}

const csvCell = (value) => {
  if (value === null || value === undefined) return "";
  let s = value instanceof Date ? value.toISOString() : String(value);
  // Neutralise spreadsheet formula injection
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function getClicksCsv(urlId) {
  const rows = await db
    .select()
    .from(clicksTable)
    .where(eq(clicksTable.urlId, urlId))
    .orderBy(desc(clicksTable.clickedAt))
    .limit(10000);

  const header = ["clicked_at", "ip", "country", "city", "browser", "os", "device", "referrer"];
  const lines = rows.map((r) =>
    [r.clickedAt, r.ipAddress, r.country, r.city, r.browser, r.os, r.device, r.referrer]
      .map(csvCell)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}
