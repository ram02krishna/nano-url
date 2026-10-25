import { validateToken } from "../utils/token.js";
import { getUserById } from "../services/user.service.js";

export async function authenticationMiddleware(req, res, next) {
  try {
    let authHeader = req.headers["authorization"];

    if (!authHeader) return next();

    if (!authHeader.startsWith("Bearer"))
      return res
        .status(400)
        .json({ error: "Auth header should start with Bearer" });

    let token = authHeader.split(" ")[1];

    let isValid = await validateToken(token);

    if (isValid.error) {
      return res.status(401).json({
        error: isValid.error,
      });
    }

    let user = await getUserById(isValid.data.id);

    if (!user) {
      return res.status(401).json({
        error: "Invalid Token",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(500).json({
      error: "Internal Server Error",

    });
  }
}

export function ensureAuthenticated(req, res, next) {
  if (!req.user || !req.user.id) {
    return res
      .status(401)
      .json({ error: "You must be logged in to access this resource" });
  }
  next();
}
