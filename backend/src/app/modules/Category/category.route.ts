import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { CategoryControllers } from "./category.controller";
import { CategoryValidations } from "./category.validation";

const router = express.Router();

router.post(
  "/",
  validateRequest(CategoryValidations.createCategoryValidationSchema),
  CategoryControllers.createCategory,
);

router.get("/", CategoryControllers.getAllCategories);
router.get("/:id", CategoryControllers.getSingleCategory);

router.patch(
  "/:id",
  validateRequest(CategoryValidations.updateCategoryValidationSchema),
  CategoryControllers.updateCategory,
);

router.delete("/:id", CategoryControllers.deleteCategory);

export const CategoryRoutes = router;
