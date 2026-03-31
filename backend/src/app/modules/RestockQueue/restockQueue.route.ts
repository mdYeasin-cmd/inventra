import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { RestockQueueControllers } from "./restockQueue.controller";
import { RestockQueueValidations } from "./restockQueue.validation";

const router = express.Router();

router.get("/", RestockQueueControllers.getAllRestockQueue);
router.get("/:id", RestockQueueControllers.getSingleRestockQueueItem);

router.patch(
  "/:id/restock",
  validateRequest(RestockQueueValidations.restockQueueRestockValidationSchema),
  RestockQueueControllers.restockQueueItem,
);

router.patch(
  "/:id/remove",
  validateRequest(RestockQueueValidations.removeRestockQueueItemValidationSchema),
  RestockQueueControllers.removeRestockQueueItem,
);

export const RestockQueueRoutes = router;
