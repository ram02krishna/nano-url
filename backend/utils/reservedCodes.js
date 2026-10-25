// Paths the API itself uses — these can never be used as a short code / custom alias.
export const RESERVED_CODES = new Set([
  "user", "codes", "shorten", "shorten-free", "verify-password", "check-alias",
  "stats", "p", "api", "admin", "login", "register", "dashboard", "settings",
  "forgot-password", "status", "health", "favicon.ico", "robots.txt", "assets",
]);

export const isReservedCode = (code) => RESERVED_CODES.has(String(code).toLowerCase());
