import type { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { RestockQueueServices } from "./restockQueue.service";

const getQueryValue = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return undefined;
};

const getAllRestockQueue = catchAsync(async (req: Request, res: Response) => {
  const result = await RestockQueueServices.getAllRestockQueueFromDB({
    status: getQueryValue(req.query.status),
    priority: getQueryValue(req.query.priority),
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Restock queue retrieved successfully",
    data: result,
  });
});

const getSingleRestockQueueItem = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await RestockQueueServices.getSingleRestockQueueFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Restock queue item retrieved successfully",
    data: result,
  });
});

const restockQueueItem = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await RestockQueueServices.restockQueueItemIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Restock queue item updated successfully",
    data: result,
  });
});

const removeRestockQueueItem = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await RestockQueueServices.removeRestockQueueItemFromDB(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Restock queue item removed successfully",
    data: result,
  });
});

export const RestockQueueControllers = {
  getAllRestockQueue,
  getSingleRestockQueueItem,
  restockQueueItem,
  removeRestockQueueItem,
};
