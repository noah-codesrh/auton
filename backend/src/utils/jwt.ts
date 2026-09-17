import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type JwtPayload = {
  sub: string;
  wallet: string;
};

export function signToken(userId: string, walletAddress: string): string {
  return jwt.sign({ sub: userId, wallet: walletAddress } satisfies JwtPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    !("sub" in decoded) ||
    !("wallet" in decoded) ||
    typeof decoded.sub !== "string" ||
    typeof decoded.wallet !== "string"
  ) {
    throw new Error("Invalid token payload");
  }

  return { sub: decoded.sub, wallet: decoded.wallet };
}
