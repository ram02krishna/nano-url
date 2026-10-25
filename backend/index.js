import "dotenv/config";
import express from "express";
import cors from "cors";
import { authenticationMiddleware } from "./middlewares/auth.middleware.js";
import { authLimiter } from "./middlewares/rateLimit.middleware.js";
import userRouter from "./routes/user.routes.js";
import urlRouter from "./routes/url.routes.js";
import redirectRouter from "./routes/redirect.routes.js";

const app = express();
const PORT = process.env.PORT ?? 8000;

app.set("trust proxy", 1);
app.disable("x-powered-by");

let allowedOrigins = ["http://localhost:5173"];
if (process.env.CORS_ORIGIN) {
  allowedOrigins = process.env.CORS_ORIGIN.split(",").map((o) => o.trim().replace(/\/$/, ""));
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS error"));
      }
    },
    credentials: true,
  })
);

// Lightweight security headers (no extra dependency needed)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(express.json({ limit: "100kb" }));

app.use(authenticationMiddleware);

app.use((req, res, next) => {
  if (req.url.includes("//")) {
    req.url = req.url.replace(/\/\/+/g, "/");
  }
  next();
});

app.get("/", (req, res) => {
  return res.json({ status: "Server is up and running..." });
});

app.get("/health", (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// Order matters: fixed API routes first, the catch-all /:shortCode redirect last.
// Rate limiters are attached per route (see middlewares/rateLimit.middleware.js)
// so public redirects aren't throttled like the management API.
app.use("/user", authLimiter, userRouter);
app.use(urlRouter);
app.use(redirectRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  return res.status(status).json({
    error: status >= 500 && process.env.NODE_ENV === "production"
      ? "Something went wrong"
      : err.message || "Something went wrong",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

if (process.env.VERCEL !== "1") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`nanoURL API listening on port ${PORT}`);
  });
}

export default app;
