import type { AnyZodObject } from "zod";
import catchAsync from "../utils/catchAsync.js";
import type { Request, Response, NextFunction } from "express";

const validateRequest = (schema: AnyZodObject) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    await schema.parseAsync({
      body: req.body,
      cookies: req.cookies,
    });

    next();
  });
};

export default validateRequest;
