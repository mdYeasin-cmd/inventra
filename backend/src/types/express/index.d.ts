import type { IAuthUser } from "../../app/interfaces/auth";

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}

export {};
