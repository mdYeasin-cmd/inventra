import { z } from "zod";

const createProductValidationSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Product name is required" })
      .trim()
      .min(1, "Product name is required"),
    category: z.string({ required_error: "Category is required" }),
    price: z
      .number({ required_error: "Price is required" })
      .min(0, "Price cannot be negative"),
    stockQuantity: z
      .number({ required_error: "Stock quantity is required" })
      .int("Stock quantity must be an integer")
      .min(0, "Stock quantity cannot be negative"),
    minimumStockThreshold: z
      .number({ required_error: "Minimum stock threshold is required" })
      .int("Minimum stock threshold must be an integer")
      .min(0, "Minimum stock threshold cannot be negative"),
  }),
});

const updateProductValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Product name is required").optional(),
    category: z.string().optional(),
    price: z.number().min(0, "Price cannot be negative").optional(),
    stockQuantity: z
      .number()
      .int("Stock quantity must be an integer")
      .min(0, "Stock quantity cannot be negative")
      .optional(),
    minimumStockThreshold: z
      .number()
      .int("Minimum stock threshold must be an integer")
      .min(0, "Minimum stock threshold cannot be negative")
      .optional(),
  }),
});

export const ProductValidations = {
  createProductValidationSchema,
  updateProductValidationSchema,
};
