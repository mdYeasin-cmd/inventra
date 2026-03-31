import { z } from "zod";

const createCategoryValidationSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Category name is required" })
      .trim()
      .min(1, "Category name is required"),
  }),
});

const updateCategoryValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Category name is required").optional(),
  }),
});

export const CategoryValidations = {
  createCategoryValidationSchema,
  updateCategoryValidationSchema,
};
