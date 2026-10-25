export const getFrontendUrl = () =>
  (process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",")[0].trim()
    : "http://localhost:5173"
  ).replace(/\/+$/, "");
