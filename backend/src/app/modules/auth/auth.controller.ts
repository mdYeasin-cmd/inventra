import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AuthServices } from "./auth.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

const signupUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.signupUserIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User is signup in successfully",
    data: result,
  });
});

export const AuthControllers = {
  signupUser,
};
