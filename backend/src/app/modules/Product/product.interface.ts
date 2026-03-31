import type { Types } from "mongoose";

export type TProductStatus = "Active" | "Out of Stock";

export interface IProduct {
  name: string;
  category: Types.ObjectId;
  price: number;
  stockQuantity: number;
  minimumStockThreshold: number;
  status: TProductStatus;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TCreateProductPayload {
  name: string;
  category: string;
  price: number;
  stockQuantity: number;
  minimumStockThreshold: number;
}

export type TUpdateProductPayload = Partial<TCreateProductPayload>;
