const DEVICE_ID_KEY = "device_id";
const FREE_USES_KEY = "free_uses";
export const FREE_LIMIT = 3;

function generateDeviceId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

function getFreeUsesCount() {
  const count = parseInt(localStorage.getItem(FREE_USES_KEY) ?? "0", 10);
  return Number.isNaN(count) ? 0 : count;
}

export function incrementFreeUses() {
  const next = getFreeUsesCount() + 1;
  localStorage.setItem(FREE_USES_KEY, String(next));
  return next;
}

/** Called when the server says the free quota is used up (keeps the UI in sync). */
export function markFreeUsesExhausted() {
  localStorage.setItem(FREE_USES_KEY, String(FREE_LIMIT));
}

export function getRemainingFreeUses() {
  return Math.max(0, FREE_LIMIT - getFreeUsesCount());
}
