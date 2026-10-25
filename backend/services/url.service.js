import { customAlphabet } from "nanoid";
import { and, desc, eq, sql, count } from "drizzle-orm";
import { db } from "../db/index.js";
import { urlsTable } from "../models/index.js";
import { HttpError } from "../utils/httpError.js";
import { isReservedCode } from "../utils/reservedCodes.js";
import { hashLinkPassword } from "../utils/linkPassword.js";

export const FREE_TIER_LIMIT = 3;

// URL-safe, no look-alike characters
const generateCode = customAlphabet(
  "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ",
  7
);

const isUniqueViolation = (err) => err?.code === "23505" || err?.cause?.code === "23505";

/** Public shape of a link (never exposes the password hash). */
export const toPublicUrl = (row) => {
  const { password, deviceId, ...rest } = row;
  return { ...rest, hasPassword: !!password };
};

export async function isAliasAvailable(code) {
  if (isReservedCode(code)) return { available: false, reason: "This alias is reserved" };
  const [existing] = await db
    .select({ id: urlsTable.id })
    .from(urlsTable)
    .where(eq(urlsTable.shortCode, code))
    .limit(1);
  return existing
    ? { available: false, reason: "This alias is already taken" }
    : { available: true };
}

export const countFreeUses = async (deviceId) => {
  const [row] = await db
    .select({ total: count() })
    .from(urlsTable)
    .where(and(eq(urlsTable.deviceId, deviceId), sql`${urlsTable.userId} IS NULL`));
  return Number(row?.total ?? 0);
};

export const createShortUrl = async ({
  url, code, title, deviceId, userId, expiresAt, password, maxClicks,
}) => {
  if (code) {
    const { available, reason } = await isAliasAvailable(code);
    if (!available) throw new HttpError(409, reason);
  }

  const passwordHash = password ? await hashLinkPassword(password) : null;

  // Auto-generated codes: retry a few times on the (very unlikely) collision
  const attempts = code ? 1 : 5;
  for (let i = 0; i < attempts; i++) {
    const shortCode = code ?? generateCode();
    try {
      const [row] = await db
        .insert(urlsTable)
        .values({
          shortCode,
          targetURL: url,
          title: title || null,
          deviceId,
          userId,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          password: passwordHash,
          maxClicks: maxClicks ?? null,
        })
        .returning();
      return toPublicUrl(row);
    } catch (err) {
      if (isUniqueViolation(err)) {
        if (code) throw new HttpError(409, "This alias is already taken");
        continue;
      }
      throw err;
    }
  }
  throw new HttpError(500, "Could not generate a unique short code. Please try again.");
};

export const listUserUrls = async (userId) => {
  const rows = await db
    .select()
    .from(urlsTable)
    .where(eq(urlsTable.userId, userId))
    .orderBy(desc(urlsTable.createdAt));
  return rows.map(toPublicUrl);
};

export const updateUserUrl = async (userId, id, changes) => {
  const values = {};

  if (changes.url !== undefined) values.targetURL = changes.url;
  if (changes.title !== undefined) values.title = changes.title || null;
  if (changes.expiresAt !== undefined) values.expiresAt = changes.expiresAt ? new Date(changes.expiresAt) : null;
  if (changes.maxClicks !== undefined) values.maxClicks = changes.maxClicks;
  if (changes.isActive !== undefined) values.isActive = changes.isActive;
  if (changes.password !== undefined) {
    values.password = changes.password ? await hashLinkPassword(changes.password) : null;
  }

  const [row] = await db
    .update(urlsTable)
    .set(values)
    .where(and(eq(urlsTable.id, id), eq(urlsTable.userId, userId)))
    .returning();

  if (!row) throw new HttpError(404, "URL not found");
  return toPublicUrl(row);
};
