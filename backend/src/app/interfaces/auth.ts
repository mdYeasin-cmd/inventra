import type { Types } from "mongoose";

export interface IAuthTokenPayload {
  userId: Types.ObjectId | string;
  name: string;
  role: string;
}

export interface IAuthUser {
  userId: string;
  name?: string;
  role?: string;
}
