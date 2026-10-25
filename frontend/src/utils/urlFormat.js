export const getBackendUrl = () => {
  let baseUrl = (import.meta.env.VITE_BACKEND_URL || "").trim().replace(/\/+$/, "");
  if (baseUrl && !/^https?:\/\//i.test(baseUrl)) baseUrl = `https://${baseUrl}`;
  return baseUrl;
};

export const getShortUrl = (shortCode) => `${getBackendUrl()}/${shortCode}`;

/** "nanourl.app" — host shown in front of a custom alias. */
export const getShortHost = () => {
  const base = getBackendUrl();
  try {
    return new URL(base || window.location.origin).host;
  } catch {
    return window.location.host;
  }
};

/**
 * Accepts "example.com/path" and turns it into "https://example.com/path".
 * Returns { url, error }.
 */
export const normalizeUrl = (input) => {
  const raw = (input || "").trim();
  if (!raw) return { url: "", error: "Please enter a URL" };

  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withScheme);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { url: "", error: "Only http:// and https:// links can be shortened" };
    }
    if (!parsed.hostname.includes(".") && parsed.hostname !== "localhost") {
      return { url: "", error: "That doesn't look like a valid web address" };
    }
    return { url: parsed.toString(), error: "" };
  } catch {
    return { url: "", error: "That doesn't look like a valid URL" };
  }
};
