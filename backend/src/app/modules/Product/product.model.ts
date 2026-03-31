import mongoose, { Schema } from "mongoose";
import type { IProduct } from "./product.interface";

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumStockThreshold: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Out of Stock"],
      required: true,
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

export const Product = mongoose.model<IProduct>("Product", productSchema);
