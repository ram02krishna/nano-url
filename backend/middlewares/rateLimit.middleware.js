import rateLimit from "express-rate-limit";

const make = (windowMs, max, message, extra = {}) =>
  rateLimit({
    windowMs,
    max,
    message: { error: message },
    ...extra,
    standardHeaders: true,
    legacyHeaders: false,
  });

// Management API (create / list / analytics ...)
export const apiLimiter = make(60 * 1000, 60, "Too many requests, please slow down.");

// Creating links
export const createLimiter = make(60 * 1000, 30, "Too many URL shortening requests, please try again later.");

// Login / signup / OTP endpoints
export const authLimiter = make(15 * 60 * 1000, 50, "Too many login/signup attempts, please try again later.");

// Public redirects — generous, these are the hot path
export const redirectLimiter = make(60 * 1000, 300, "Too many requests, please try again later.");

// Brute-force protection for password-protected links
export const linkPasswordLimiter = make(15 * 60 * 1000, 10, "Too many incorrect attempts. Please try again in a few minutes.", {
  skipSuccessfulRequests: true,
});

// Alias availability checks (typed live in the UI)
export const aliasCheckLimiter = make(60 * 1000, 40, "Too many requests, please slow down.");
