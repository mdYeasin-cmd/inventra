import type { Types } from "mongoose";

export const restockQueuePriorities = ["high", "medium", "low"] as const;
export type TRestockQueuePriority = (typeof restockQueuePriorities)[number];

export const restockQueueStatuses = [
  "pending",
  "restocked",
  "removed",
] as const;
export type TRestockQueueStatus = (typeof restockQueueStatuses)[number];

export interface IRestockQueue {
  product: Types.ObjectId;
  currentStock: number;
  minimumStockThreshold: number;
  priority: TRestockQueuePriority;
  status: TRestockQueueStatus;
  addedAt: Date;
  resolvedAt?: Date;
  updatedBy?: Types.ObjectId;
  notes?: string;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TRestockQueueFilters {
  status?: string;
  priority?: string;
}

export interface TRestockQueueRestockPayload {
  stockQuantity: number;
  notes?: string;
}

export interface TRemoveRestockQueuePayload {
  notes?: string;
}
