import express from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { urlsTable } from "../models/index.js";
import { registerVisit, recordClick } from "../services/click.service.js";
import { redirectLimiter, linkPasswordLimiter } from "../middlewares/rateLimit.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyLinkPassword, hashLinkPassword } from "../utils/linkPassword.js";
import { getClientIp, getReferrerHost, getEdgeGeo } from "../utils/clientInfo.js";
import { getFrontendUrl } from "../utils/frontendUrl.js";
import { isReservedCode } from "../utils/reservedCodes.js";

const router = express.Router();

const STATUS_MESSAGES = {
  "not-found": { status: 404, error: "Short URL not found" },
  expired: { status: 410, error: "This link has expired and is no longer available." },
  disabled: { status: 410, error: "This link has been disabled by its owner." },
  "limit-reached": { status: 410, error: "This link has reached its maximum number of clicks." },
};

/** Browsers get a friendly page, API clients get JSON. */
function sendStatus(req, res, reason) {
  const info = STATUS_MESSAGES[reason];
  if (req.accepts(["json", "html"]) === "html") {
    return res.redirect(`${getFrontendUrl()}/status/${reason}`);
  }
  return res.status(info.status).json({ error: info.error, reason });
}

const SELECT = {
  id: urlsTable.id,
  targetURL: urlsTable.targetURL,
  expiresAt: urlsTable.expiresAt,
  password: urlsTable.password,
  isActive: urlsTable.isActive,
  maxClicks: urlsTable.maxClicks,
  clickCount: urlsTable.clickCount,
};

/** Returns a reason string if the link can't be used right now, else null. */
function getBlockReason(link) {
  if (!link.isActive) return "disabled";
  if (link.expiresAt && Date.now() > new Date(link.expiresAt).getTime()) return "expired";
  if (link.maxClicks !== null && link.clickCount >= link.maxClicks) return "limit-reached";
  return null;
}

async function trackVisit(req, link) {
  const counted = await registerVisit(link.id);
  if (!counted) return false;

  await recordClick({
    urlId: link.id,
    ip: getClientIp(req),
    ua: req.headers["user-agent"] ?? "",
    referrer: getReferrerHost(req),
    edgeGeo: getEdgeGeo(req),
  });
  return true;
}

router.post(
  "/verify-password/:shortCode",
  linkPasswordLimiter,
  asyncHandler(async (req, res) => {
    const code = req.params.shortCode;
    const password = req.body?.password;

    const [link] = await db.select(SELECT).from(urlsTable).where(eq(urlsTable.shortCode, code));
    if (!link) return res.status(404).json({ error: STATUS_MESSAGES["not-found"].error, reason: "not-found" });

    const blocked = getBlockReason(link);
    if (blocked) return res.status(410).json({ error: STATUS_MESSAGES[blocked].error, reason: blocked });

    if (!link.password) {
      return res.status(400).json({ error: "This link is not password protected" });
    }

    const { ok, needsUpgrade } = await verifyLinkPassword(password, link.password);
    if (!ok) return res.status(401).json({ error: "Incorrect password" });

    // Transparently migrate legacy plain-text passwords to hashed ones
    if (needsUpgrade) {
      await db
        .update(urlsTable)
        .set({ password: await hashLinkPassword(password) })
        .where(eq(urlsTable.id, link.id));
    }

    if (!(await trackVisit(req, link))) {
      return res.status(410).json({ error: STATUS_MESSAGES["limit-reached"].error, reason: "limit-reached" });
    }

    return res.json({ targetURL: link.targetURL });
  })
);

router.get(
  "/:shortCode",
  redirectLimiter,
  asyncHandler(async (req, res) => {
    const code = req.params.shortCode;
    if (isReservedCode(code)) return sendStatus(req, res, "not-found");

    const [link] = await db.select(SELECT).from(urlsTable).where(eq(urlsTable.shortCode, code));
    if (!link) return sendStatus(req, res, "not-found");

    const blocked = getBlockReason(link);
    if (blocked) return sendStatus(req, res, blocked);

    if (link.password) {
      return res.redirect(`${getFrontendUrl()}/p/${encodeURIComponent(code)}`);
    }

    if (!(await trackVisit(req, link))) return sendStatus(req, res, "limit-reached");

    // 302 so browsers don't cache the redirect (keeps analytics accurate and edits effective)
    res.set("Cache-Control", "no-store");
    return res.redirect(302, link.targetURL);
  })
);

export default router;
