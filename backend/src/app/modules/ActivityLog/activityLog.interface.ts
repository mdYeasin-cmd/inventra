import type { ClientSession, Types } from "mongoose";
import type { IAuthUser } from "../../interfaces/auth";

export const activityLogTypes = [
  "category_created",
  "category_updated",
  "category_deleted",
  "product_created",
  "product_updated",
  "product_deleted",
  "order_created",
  "order_status_changed",
  "restock_queue_added",
  "restock_completed",
  "restock_removed",
] as const;

export const activityEntityTypes = [
  "category",
  "product",
  "order",
  "restockQueue",
] as const;

export type TActivityLogType = (typeof activityLogTypes)[number];
export type TActivityEntityType = (typeof activityEntityTypes)[number];

export interface IActivityLog {
  type: TActivityLogType;
  message: string;
  actorUserId?: Types.ObjectId;
  actorName?: string;
  entityType: TActivityEntityType;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TCreateActivityLogPayload {
  type: TActivityLogType;
  message: string;
  actor?: IAuthUser;
  entityType: TActivityEntityType;
  entityId?: string;
  metadata?: Record<string, unknown>;
  session?: ClientSession;
}

export interface TActivityLogFilters {
  type?: string;
  page?: string;
  limit?: string;
}
