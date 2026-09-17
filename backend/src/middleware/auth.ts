import type { NextFunction, Request, Response } from "express";
import { verifyToken, type JwtPayload } from "../utils/jwt.js";

export type AuthenticatedRequest = Request & {
  auth: JwtPayload;
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: { message: "Missing or invalid Authorization header", code: "unauthorized" },
    });
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = verifyToken(token);
    (req as AuthenticatedRequest).auth = payload;
    next();
  } catch {
    return res.status(401).json({
      error: { message: "Invalid or expired token", code: "unauthorized" },
    });
  }
}
