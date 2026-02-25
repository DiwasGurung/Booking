import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "supersecret"
    ) as { userId: string; role: string };

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};