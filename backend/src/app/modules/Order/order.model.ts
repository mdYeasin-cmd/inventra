import mongoose, { Schema } from "mongoose";
import type { IOrder, IOrderItem } from "./order.interface";
import { orderStatuses } from "./order.interface";

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const orderSchema = new Schema<IOrder>(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    products: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (value: IOrderItem[]) => value.length > 0,
        message: "At least one product is required",
      },
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: orderStatuses,
      required: true,
      default: "Pending",
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

export const Order = mongoose.model<IOrder>("Order", orderSchema);
