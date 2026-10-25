import express from "express";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import {
  shortenPostRequestBodySchema,
  updateUrlBodySchema,
  analyticsQuerySchema,
  aliasSchema,
} from "../validation/request.validation.js";
import { db } from "../db/index.js";
import { urlsTable } from "../models/index.js";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { apiLimiter, createLimiter, aliasCheckLimiter } from "../middlewares/rateLimit.middleware.js";
import {
  createShortUrl,
  listUserUrls,
  updateUserUrl,
  isAliasAvailable,
  countFreeUses,
  FREE_TIER_LIMIT,
} from "../services/url.service.js";
import { getUrlAnalytics, getUserOverview, getClicksCsv } from "../services/analytics.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

const router = express.Router();

const uuidSchema = z.string().uuid();

// Reject malformed ids early instead of letting Postgres throw a 500
router.param("id", (req, res, next, id) => {
  if (!uuidSchema.safeParse(id).success) {
    return next(new HttpError(404, "URL not found"));
  }
  next();
});

async function getOwnedUrl(id, userId) {
  const [url] = await db
    .select({ id: urlsTable.id, shortCode: urlsTable.shortCode })
    .from(urlsTable)
    .where(and(eq(urlsTable.id, id), eq(urlsTable.userId, userId)));
  if (!url) throw new HttpError(404, "URL not found");
  return url;
}

/* ---------- Create ---------- */

router.post(
  "/shorten-free",
  createLimiter,
  validate(shortenPostRequestBodySchema),
  asyncHandler(async (req, res) => {
    const { url, deviceId } = req.body;
    if (!deviceId) {
      return res.status(400).json({ error: "Device ID is required for free tier" });
    }

    const used = await countFreeUses(deviceId);
    if (used >= FREE_TIER_LIMIT) {
      return res.status(403).json({
        error: `Free limit reached (${FREE_TIER_LIMIT} links). Create a free account to continue.`,
        limitReached: true,
      });
    }

    // Free tier: plain shortening only (no alias / password / expiry)
    const link = await createShortUrl({ url, deviceId });

    return res.status(201).json({
      id: link.id,
      shortCode: link.shortCode,
      targetURL: link.targetURL,
      hasPassword: link.hasPassword,
      remaining: Math.max(0, FREE_TIER_LIMIT - used - 1),
    });
  })
);

router.post(
  "/shorten",
  createLimiter,
  ensureAuthenticated,
  validate(shortenPostRequestBodySchema),
  asyncHandler(async (req, res) => {
    const { url, code, title, expiresAt, password, maxClicks } = req.body;
    const link = await createShortUrl({
      url, code, title, expiresAt, password, maxClicks, userId: req.user.id,
    });
    return res.status(201).json(link);
  })
);

/* ---------- Read ---------- */

router.get(
  "/codes",
  apiLimiter,
  ensureAuthenticated,
  asyncHandler(async (req, res) => {
    return res.json({ codes: await listUserUrls(req.user.id) });
  })
);

router.get(
  "/stats",
  apiLimiter,
  ensureAuthenticated,
  asyncHandler(async (req, res) => {
    return res.json(await getUserOverview(req.user.id));
  })
);

router.get(
  "/check-alias/:code",
  aliasCheckLimiter,
  asyncHandler(async (req, res) => {
    const parsed = aliasSchema.safeParse(req.params.code);
    if (!parsed.success) {
      return res.json({ available: false, reason: parsed.error.issues[0].message });
    }
    return res.json(await isAliasAvailable(parsed.data));
  })
);

router.get(
  "/:id/analytics",
  apiLimiter,
  ensureAuthenticated,
  validate(analyticsQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const url = await getOwnedUrl(req.params.id, req.user.id);
    return res.json(await getUrlAnalytics(url.id, req.query.days));
  })
);

router.get(
  "/:id/export",
  apiLimiter,
  ensureAuthenticated,
  asyncHandler(async (req, res) => {
    const url = await getOwnedUrl(req.params.id, req.user.id);
    const csv = await getClicksCsv(url.id);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="clicks-${url.shortCode}.csv"`);
    return res.send(csv);
  })
);

/* ---------- Update / Delete ---------- */

router.patch(
  "/:id",
  apiLimiter,
  ensureAuthenticated,
  validate(updateUrlBodySchema),
  asyncHandler(async (req, res) => {
    const link = await updateUserUrl(req.user.id, req.params.id, req.body);
    return res.json(link);
  })
);

router.delete(
  "/:id",
  apiLimiter,
  ensureAuthenticated,
  asyncHandler(async (req, res) => {
    const deleted = await db
      .delete(urlsTable)
      .where(and(eq(urlsTable.id, req.params.id), eq(urlsTable.userId, req.user.id)))
      .returning({ id: urlsTable.id });

    if (!deleted.length) throw new HttpError(404, "URL not found");
    return res.status(200).json({ deleted: true });
  })
);

export default router;
