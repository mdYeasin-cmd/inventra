import type { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ActivityLogServices } from "./activityLog.service";

const getQueryValue = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return undefined;
};

const getActivityLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await ActivityLogServices.getActivityLogsFromDB({
    type: getQueryValue(req.query.type),
    page: getQueryValue(req.query.page),
    limit: getQueryValue(req.query.limit),
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Activity logs retrieved successfully",
    data: result,
  });
});

export const ActivityLogControllers = {
  getActivityLogs,
};
