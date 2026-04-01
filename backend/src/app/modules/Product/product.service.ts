import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import type { IAuthUser } from "../../interfaces/auth";
import { ActivityLogServices } from "../ActivityLog/activityLog.service";
import { Category } from "../Category/category.model";
import { RestockQueueServices } from "../RestockQueue/restockQueue.service";
import {
  type TCreateProductPayload,
  type TUpdateProductPayload,
} from "./product.interface";
import { Product } from "./product.model";
import { attachProductStockInfo, getProductStatus } from "./product.utils";

const ensureCategoryExists = async (categoryId: string) => {
  const category = await Category.findOne({ _id: categoryId, isDeleted: false });

  if (!category) {
    throw new AppError(httpStatus.BAD_REQUEST, "Category not found");
  }
};

const createProductIntoDB = async (
  payload: TCreateProductPayload,
  authUser?: IAuthUser,
) => {
  await ensureCategoryExists(payload.category);

  const product = await Product.create({
    name: payload.name.trim(),
    category: payload.category,
    price: payload.price,
    stockQuantity: payload.stockQuantity,
    minimumStockThreshold: payload.minimumStockThreshold,
    status: getProductStatus(payload.stockQuantity),
  });

  await RestockQueueServices.syncRestockQueueForProduct(product._id, {
    updatedBy: authUser?.userId,
    activityActor: authUser,
  });

  const populatedProduct = await Product.findById(product._id).populate({
    path: "category",
    select: "name",
  });

  const formattedProduct = populatedProduct
    ? attachProductStockInfo(populatedProduct)
    : populatedProduct;

  await ActivityLogServices.createActivityLogIntoDB({
    type: "product_created",
    message: `Product "${product.name}" created${authUser?.name ? ` by ${authUser.name}` : ""}`,
    actor: authUser,
    entityType: "product",
    entityId: product._id.toString(),
    metadata: {
      productName: product.name,
      stockQuantity: product.stockQuantity,
      minimumStockThreshold: product.minimumStockThreshold,
    },
  });

  return formattedProduct;
};

const getAllProductsFromDB = async () => {
  const products = await Product.find({ isDeleted: false })
    .populate({
      path: "category",
      select: "name",
    })
    .sort({ createdAt: -1 });

  return products.map((product) => attachProductStockInfo(product));
};

const getSingleProductFromDB = async (id: string) => {
  const product = await Product.findOne({ _id: id, isDeleted: false }).populate({
    path: "category",
    select: "name",
  });

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  return attachProductStockInfo(product);
};

const updateProductIntoDB = async (
  id: string,
  payload: TUpdateProductPayload,
  authUser?: IAuthUser,
) => {
  const existingProduct = await Product.findOne({ _id: id, isDeleted: false });

  if (!existingProduct) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  const updateData: Partial<TCreateProductPayload> & {
    status?: ReturnType<typeof getProductStatus>;
  } = {};

  if (payload.name !== undefined) {
    updateData.name = payload.name.trim();
  }

  if (payload.category !== undefined) {
    await ensureCategoryExists(payload.category);
    updateData.category = payload.category;
  }

  if (payload.price !== undefined) {
    updateData.price = payload.price;
  }

  if (payload.stockQuantity !== undefined) {
    updateData.stockQuantity = payload.stockQuantity;
    updateData.status = getProductStatus(payload.stockQuantity);
  }

  if (payload.minimumStockThreshold !== undefined) {
    updateData.minimumStockThreshold = payload.minimumStockThreshold;
  }

  const product = await Product.findOneAndUpdate(
    { _id: id, isDeleted: false },
    updateData,
    {
      new: true,
      runValidators: true,
    },
  ).populate({
    path: "category",
    select: "name",
  });

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  await RestockQueueServices.syncRestockQueueForProduct(product._id, {
    updatedBy: authUser?.userId,
    activityActor: authUser,
  });

  const stockChanged =
    payload.stockQuantity !== undefined &&
    payload.stockQuantity !== existingProduct.stockQuantity;
  const formattedProduct = attachProductStockInfo(product);

  await ActivityLogServices.createActivityLogIntoDB({
    type: "product_updated",
    message: stockChanged
      ? `Stock updated for "${product.name}"${authUser?.name ? ` by ${authUser.name}` : ""}`
      : `Product "${product.name}" updated${authUser?.name ? ` by ${authUser.name}` : ""}`,
    actor: authUser,
    entityType: "product",
    entityId: product._id.toString(),
    metadata: {
      productName: product.name,
      previousStockQuantity: existingProduct.stockQuantity,
      stockQuantity: product.stockQuantity,
      minimumStockThreshold: product.minimumStockThreshold,
    },
  });

  return formattedProduct;
};

const deleteProductFromDB = async (id: string, authUser?: IAuthUser) => {
  const product = await Product.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    {
      new: true,
      runValidators: true,
    },
  ).populate({
    path: "category",
    select: "name",
  });

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  await RestockQueueServices.syncRestockQueueForProduct(product._id, {
    updatedBy: authUser?.userId,
    activityActor: authUser,
  });

  const formattedProduct = attachProductStockInfo(product);

  await ActivityLogServices.createActivityLogIntoDB({
    type: "product_deleted",
    message: `Product "${product.name}" deleted${authUser?.name ? ` by ${authUser.name}` : ""}`,
    actor: authUser,
    entityType: "product",
    entityId: product._id.toString(),
    metadata: {
      productName: product.name,
    },
  });

  return formattedProduct;
};

export const ProductServices = {
  createProductIntoDB,
  getAllProductsFromDB,
  getSingleProductFromDB,
  updateProductIntoDB,
  deleteProductFromDB,
};
