import { z } from "zod";
import { orderStatuses } from "./order.interface";

const createOrderValidationSchema = z.object({
  body: z.object({
    customerName: z
      .string({ required_error: "Customer name is required" })
      .trim()
      .min(1, "Customer name is required"),
    products: z
      .array(
        z.object({
          product: z.string({ required_error: "Product is required" }),
          quantity: z
            .number({ required_error: "Quantity is required" })
            .int("Quantity must be an integer")
            .min(1, "Quantity must be at least 1"),
        }),
      )
      .min(1, "At least one product is required"),
  }),
});

const updateOrderStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(orderStatuses, {
      required_error: "Order status is required",
    }),
  }),
});

export const OrderValidations = {
  createOrderValidationSchema,
  updateOrderStatusValidationSchema,
};
