import mongoose, { Schema } from "mongoose";
import {
  restockQueuePriorities,
  restockQueueStatuses,
  type IRestockQueue,
} from "./restockQueue.interface";

const restockQueueSchema = new Schema<IRestockQueue>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    currentStock: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumStockThreshold: {
      type: Number,
      required: true,
      min: 0,
    },
    priority: {
      type: String,
      enum: restockQueuePriorities,
      required: true,
    },
    status: {
      type: String,
      enum: restockQueueStatuses,
      required: true,
      default: "pending",
    },
    addedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

restockQueueSchema.index({ status: 1, priority: 1, currentStock: 1, addedAt: 1 });
restockQueueSchema.index(
  { product: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: "pending",
      isDeleted: false,
    },
  },
);

export const RestockQueue = mongoose.model<IRestockQueue>(
  "RestockQueue",
  restockQueueSchema,
);
