import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { Types } from "mongoose";

const JWT_SECRET: Secret = "your_jwt_secret_key";

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
