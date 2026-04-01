import { z } from "zod";

const restockQueueActionBaseSchema = z.object({
  notes: z.string().trim().min(1, "Notes cannot be empty").optional(),
});

const restockQueueRestockValidationSchema = z.object({
  body: restockQueueActionBaseSchema.extend({
    stockQuantity: z
      .number({ required_error: "Stock quantity is required" })
      .int("Stock quantity must be an integer")
      .min(0, "Stock quantity cannot be negative"),
  }),
});

const removeRestockQueueItemValidationSchema = z.object({
  body: restockQueueActionBaseSchema,
});

export const RestockQueueValidations = {
  restockQueueRestockValidationSchema,
  removeRestockQueueItemValidationSchema,
};
