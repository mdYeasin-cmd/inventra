import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import AppError from "../errors/AppError";
import { verifyToken } from "../utils/jwtUtil";

const auth = (req: Request, _res: Response, next: NextFunction) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    next(new AppError(httpStatus.UNAUTHORIZED, "Authorization token is required"));
    return;
  }

  const token = authorizationHeader.split(" ")[1];

  if (!token) {
    next(new AppError(httpStatus.UNAUTHORIZED, "Authorization token is required"));
    return;
  }

  try {
    const decodedToken = verifyToken(token);
    const userId =
      typeof decodedToken.userId === "string"
        ? decodedToken.userId
        : undefined;

    if (!userId) {
      next(new AppError(httpStatus.UNAUTHORIZED, "Invalid authorization token"));
      return;
    }

    req.user = {
      userId,
      name: typeof decodedToken.name === "string" ? decodedToken.name : undefined,
      role: typeof decodedToken.role === "string" ? decodedToken.role : undefined,
    };

    next();
  } catch {
    next(new AppError(httpStatus.UNAUTHORIZED, "Invalid authorization token"));
  }
};

export default auth;
