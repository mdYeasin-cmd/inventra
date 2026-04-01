import httpStatus from "http-status";
import mongoose from "mongoose";
import AppError from "../../errors/AppError";
import {
  activityLogTypes,
  type TActivityLogFilters,
  type TCreateActivityLogPayload,
} from "./activityLog.interface";
import { ActivityLog } from "./activityLog.model";

const getActorName = (name?: string) => {
  const trimmedName = name?.trim();

  return trimmedName && trimmedName.length > 0 ? trimmedName : "System";
};

const parsePositiveInteger = (
  value: string | undefined,
  fallbackValue: number,
  maximumValue: number,
) => {
  if (!value) {
    return fallbackValue;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue) || parsedValue < 1) {
    throw new AppError(httpStatus.BAD_REQUEST, "Pagination values must be positive integers");
  }

  return Math.min(parsedValue, maximumValue);
};

const validateActivityLogType = (type: string) => {
  if (!activityLogTypes.includes(type as (typeof activityLogTypes)[number])) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid activity log type");
  }
};

const createActivityLogIntoDB = async (payload: TCreateActivityLogPayload) => {
  const logData = {
    type: payload.type,
    message: payload.message.trim(),
    actorUserId: payload.actor?.userId
      ? new mongoose.Types.ObjectId(payload.actor.userId)
      : undefined,
    actorName: getActorName(payload.actor?.name),
    entityType: payload.entityType,
    entityId: payload.entityId,
    metadata: payload.metadata,
  };

  if (payload.session) {
    const [createdActivityLog] = await ActivityLog.create([logData], {
      session: payload.session,
    });

    return createdActivityLog;
  }

  return ActivityLog.create(logData);
};

const getRecentActivityLogsFromDB = async (limit = 6) => {
  const normalizedLimit = Math.min(Math.max(limit, 1), 10);

  return ActivityLog.find()
    .sort({ createdAt: -1 })
    .limit(normalizedLimit)
    .lean();
};

const getActivityLogsFromDB = async (filters: TActivityLogFilters) => {
  const query: {
    type?: (typeof activityLogTypes)[number];
  } = {};

  if (filters.type) {
    validateActivityLogType(filters.type);
    query.type = filters.type as (typeof activityLogTypes)[number];
  }

  const page = parsePositiveInteger(filters.page, 1, 1000);
  const limit = parsePositiveInteger(filters.limit, 10, 50);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ActivityLog.countDocuments(query),
  ]);

  const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

export const ActivityLogServices = {
  createActivityLogIntoDB,
  getRecentActivityLogsFromDB,
  getActivityLogsFromDB,
};
