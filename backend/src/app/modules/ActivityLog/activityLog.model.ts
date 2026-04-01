import mongoose, { Schema } from "mongoose";
import {
  activityEntityTypes,
  activityLogTypes,
  type IActivityLog,
} from "./activityLog.interface";

const activityLogSchema = new Schema<IActivityLog>(
  {
    type: {
      type: String,
      enum: activityLogTypes,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    actorName: {
      type: String,
      trim: true,
    },
    entityType: {
      type: String,
      enum: activityEntityTypes,
      required: true,
    },
    entityId: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ type: 1, createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>(
  "ActivityLog",
  activityLogSchema,
);
