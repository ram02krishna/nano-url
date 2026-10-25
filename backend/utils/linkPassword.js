import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCb);
const PREFIX = "scrypt";

/**
 * Hash a link password with a per-link random salt (scrypt).
 * Format: scrypt$<saltHex>$<hashHex>
 */
export async function hashLinkPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 32);
  return `${PREFIX}$${salt}$${derived.toString("hex")}`;
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verify a password against a stored value.
 * Supports legacy rows that stored the password in plain text.
 * Returns { ok, needsUpgrade } — callers can re-hash legacy rows on success.
 */
export async function verifyLinkPassword(password, stored) {
  if (!stored || typeof password !== "string") return { ok: false, needsUpgrade: false };

  if (stored.startsWith(`${PREFIX}$`)) {
    const [, salt, hash] = stored.split("$");
    if (!salt || !hash) return { ok: false, needsUpgrade: false };
    const derived = await scrypt(password, salt, 32);
    return { ok: safeEqual(derived.toString("hex"), hash), needsUpgrade: false };
  }

  // Legacy plain-text value
  return { ok: safeEqual(password, stored), needsUpgrade: true };
}
