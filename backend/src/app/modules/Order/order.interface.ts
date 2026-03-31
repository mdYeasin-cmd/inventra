import type { Types } from "mongoose";

export const orderStatuses = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;

export type TOrderStatus = (typeof orderStatuses)[number];

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
}

export interface IOrder {
  customerName: string;
  products: IOrderItem[];
  totalPrice: number;
  status: TOrderStatus;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TCreateOrderItemPayload {
  product: string;
  quantity: number;
}

export interface TCreateOrderPayload {
  customerName: string;
  products: TCreateOrderItemPayload[];
}

export interface TOrderFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface TUpdateOrderStatusPayload {
  status: TOrderStatus;
}
