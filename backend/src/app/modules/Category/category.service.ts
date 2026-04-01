import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import type { IAuthUser } from "../../interfaces/auth";
import { ActivityLogServices } from "../ActivityLog/activityLog.service";
import {
  type TCreateCategoryPayload,
  type TUpdateCategoryPayload,
} from "./category.interface";
import { Category } from "./category.model";
import { Product } from "../Product/product.model";

const createCategoryIntoDB = async (
  payload: TCreateCategoryPayload,
  authUser?: IAuthUser,
) => {
  const category = await Category.create({
    name: payload.name.trim(),
  });

  await ActivityLogServices.createActivityLogIntoDB({
    type: "category_created",
    message: `Category "${category.name}" created${authUser?.name ? ` by ${authUser.name}` : ""}`,
    actor: authUser,
    entityType: "category",
    entityId: category._id.toString(),
    metadata: {
      categoryName: category.name,
    },
  });

  return category;
};

const getAllCategoriesFromDB = async () => {
  const categories = await Category.find({ isDeleted: false }).sort({
    createdAt: -1,
  });

  return categories;
};

const getSingleCategoryFromDB = async (id: string) => {
  const category = await Category.findOne({ _id: id, isDeleted: false });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  return category;
};

const updateCategoryIntoDB = async (
  id: string,
  payload: TUpdateCategoryPayload,
  authUser?: IAuthUser,
) => {
  const updateData: TUpdateCategoryPayload = {};

  if (payload.name !== undefined) {
    updateData.name = payload.name.trim();
  }

  const category = await Category.findOneAndUpdate(
    { _id: id, isDeleted: false },
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  await ActivityLogServices.createActivityLogIntoDB({
    type: "category_updated",
    message: `Category "${category.name}" updated${authUser?.name ? ` by ${authUser.name}` : ""}`,
    actor: authUser,
    entityType: "category",
    entityId: category._id.toString(),
    metadata: {
      categoryName: category.name,
    },
  });

  return category;
};

const deleteCategoryFromDB = async (id: string, authUser?: IAuthUser) => {
  const category = await Category.findOne({ _id: id, isDeleted: false });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  const assignedProduct = await Product.findOne({
    category: id,
    isDeleted: false,
  });

  if (assignedProduct) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Category cannot be deleted because products are assigned to it",
    );
  }

  category.isDeleted = true;
  await category.save();

  await ActivityLogServices.createActivityLogIntoDB({
    type: "category_deleted",
    message: `Category "${category.name}" deleted${authUser?.name ? ` by ${authUser.name}` : ""}`,
    actor: authUser,
    entityType: "category",
    entityId: category._id.toString(),
    metadata: {
      categoryName: category.name,
    },
  });

  return category;
};

export const CategoryServices = {
  createCategoryIntoDB,
  getAllCategoriesFromDB,
  getSingleCategoryFromDB,
  updateCategoryIntoDB,
  deleteCategoryFromDB,
};
