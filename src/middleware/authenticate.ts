import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface JwtUserPayload {
  sub: number;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const decoded = jwt.verify(token, secret) as unknown as {
      sub: number | string;
      username: string;
    };

    req.user = {
      sub: Number(decoded.sub),
      username: String(decoded.username),
    };

    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
