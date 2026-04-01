import jwt, { type JwtPayload, type Secret } from "jsonwebtoken";
import { envVars } from "../config/env";
import type { IAuthTokenPayload } from "../interfaces/auth";

const JWT_SECRET: Secret = envVars.JWT_SECRET;

export const createToken = (
  jwtPayload: IAuthTokenPayload,
  expiresIn: number,
) => {
  return jwt.sign(jwtPayload, JWT_SECRET, {
    expiresIn,
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
