import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import httpStatus from "http-status";
import { AuthServices } from "./auth.service.js";

const signupUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.signupUserIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User is logged in successfully",
    data: result,
  });
});

export const AuthControllers = {
  signupUser,
};
