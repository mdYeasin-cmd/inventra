import type { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { DashboardServices } from "./dashboard.service";

const getDashboardOverview = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardServices.getDashboardOverviewFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dashboard overview retrieved successfully",
    data: result,
  });
});

export const DashboardControllers = {
  getDashboardOverview,
};
