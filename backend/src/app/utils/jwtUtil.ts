import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { Types } from "mongoose";
import { envVars } from "../config/env";

const JWT_SECRET: Secret = envVars.JWT_SECRET;

export const createToken = (
  jwtPayload: { userId: Types.ObjectId; role: string },
  secret: string,
  expiresIn: number,
) => {
  return jwt.sign(jwtPayload, JWT_SECRET, {
    expiresIn,
  });
};

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret) as JwtPayload;
};
