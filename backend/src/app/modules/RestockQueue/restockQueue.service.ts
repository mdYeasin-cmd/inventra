import httpStatus from "http-status";
import mongoose, { type ClientSession, type Types } from "mongoose";
import AppError from "../../errors/AppError";
import { Product } from "../Product/product.model";
import { getProductStatus } from "../Product/product.utils";
import { User } from "../User/user.model";
import {
  restockQueuePriorities,
  restockQueueStatuses,
  type IRestockQueue,
  type TRemoveRestockQueuePayload,
  type TRestockQueueFilters,
  type TRestockQueuePriority,
  type TRestockQueueRestockPayload,
  type TRestockQueueStatus,
} from "./restockQueue.interface";
import { RestockQueue } from "./restockQueue.model";

interface TSyncRestockQueueOptions {
  session?: ClientSession;
  updatedBy?: string;
  notes?: string;
}

const restockQueuePopulate = [
  {
    path: "product",
    select: "name price stockQuantity minimumStockThreshold status category",
    populate: {
      path: "category",
      select: "name",
    },
  },
  {
    path: "updatedBy",
    select: "name email role",
  },
];

const normalizeNotes = (notes?: string) => {
  if (notes === undefined) {
    return undefined;
  }

  const trimmedNotes = notes.trim();

  return trimmedNotes.length > 0 ? trimmedNotes : undefined;
};

const validateRestockQueueStatus = (status: string) => {
  if (!restockQueueStatuses.includes(status as TRestockQueueStatus)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid restock queue status");
  }
};

const validateRestockQueuePriority = (priority: string) => {
  if (!restockQueuePriorities.includes(priority as TRestockQueuePriority)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid restock queue priority");
  }
};

const ensureUserExists = async (userId: string, session?: ClientSession) => {
  let userQuery = User.findById(userId);

  if (session) {
    userQuery = userQuery.session(session);
  }

  const user = await userQuery;

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, "Updated by user not found");
  }

  return user;
};

const shouldBeInRestockQueue = (
  stockQuantity: number,
  minimumStockThreshold: number,
) => {
  return stockQuantity <= minimumStockThreshold;
};

const getRestockPriority = (
  stockQuantity: number,
  minimumStockThreshold: number,
): TRestockQueuePriority => {
  if (stockQuantity === 0) {
    return "high";
  }

  const mediumThreshold = Math.max(1, Math.floor(minimumStockThreshold / 2));

  if (stockQuantity <= mediumThreshold) {
    return "medium";
  }

  return "low";
};

const getPendingRestockQueueItemByProduct = async (
  productId: string | Types.ObjectId,
  session?: ClientSession,
) => {
  let restockQueueQuery = RestockQueue.findOne({
    product: productId,
    status: "pending",
    isDeleted: false,
  });

  if (session) {
    restockQueueQuery = restockQueueQuery.session(session);
  }

  return restockQueueQuery;
};

const getPendingRestockQueueItemById = async (
  id: string | Types.ObjectId,
  session?: ClientSession,
) => {
  let restockQueueQuery = RestockQueue.findOne({
    _id: id,
    status: "pending",
    isDeleted: false,
  });

  if (session) {
    restockQueueQuery = restockQueueQuery.session(session);
  }

  return restockQueueQuery;
};

const applySyncMetadata = (
  restockQueueItem: mongoose.HydratedDocument<IRestockQueue>,
  options: TSyncRestockQueueOptions,
) => {
  if (options.updatedBy) {
    restockQueueItem.updatedBy = new mongoose.Types.ObjectId(options.updatedBy);
  }

  if (options.notes !== undefined) {
    restockQueueItem.notes = normalizeNotes(options.notes);
  }
};

const getPopulatedRestockQueueItem = async (
  id: string | Types.ObjectId,
  session?: ClientSession,
) => {
  let restockQueueQuery = RestockQueue.findOne({ _id: id, isDeleted: false }).populate(
    restockQueuePopulate,
  );

  if (session) {
    restockQueueQuery = restockQueueQuery.session(session);
  }

  return restockQueueQuery;
};

const syncRestockQueueForProduct = async (
  productId: string | Types.ObjectId,
  options: TSyncRestockQueueOptions = {},
) => {
  const normalizedNotes = normalizeNotes(options.notes);

  if (options.updatedBy) {
    await ensureUserExists(options.updatedBy, options.session);
  }

  let productQuery = Product.findOne({ _id: productId, isDeleted: false });

  if (options.session) {
    productQuery = productQuery.session(options.session);
  }

  const product = await productQuery;
  const pendingRestockQueueItem = await getPendingRestockQueueItemByProduct(
    productId,
    options.session,
  );

  if (!product) {
    if (!pendingRestockQueueItem) {
      return null;
    }

    pendingRestockQueueItem.status = "removed";
    pendingRestockQueueItem.resolvedAt = new Date();
    applySyncMetadata(pendingRestockQueueItem, {
      ...options,
      notes: normalizedNotes,
    });
    await pendingRestockQueueItem.save({ session: options.session });

    return pendingRestockQueueItem;
  }

  const shouldQueueProduct = shouldBeInRestockQueue(
    product.stockQuantity,
    product.minimumStockThreshold,
  );

  if (shouldQueueProduct) {
    const priority = getRestockPriority(
      product.stockQuantity,
      product.minimumStockThreshold,
    );

    if (pendingRestockQueueItem) {
      pendingRestockQueueItem.currentStock = product.stockQuantity;
      pendingRestockQueueItem.minimumStockThreshold = product.minimumStockThreshold;
      pendingRestockQueueItem.priority = priority;
      pendingRestockQueueItem.status = "pending";
      pendingRestockQueueItem.resolvedAt = undefined;
      applySyncMetadata(pendingRestockQueueItem, {
        ...options,
        notes: normalizedNotes,
      });
      await pendingRestockQueueItem.save({ session: options.session });

      return pendingRestockQueueItem;
    }

    const [restockQueueItem] = await RestockQueue.create(
      [
        {
          product: product._id,
          currentStock: product.stockQuantity,
          minimumStockThreshold: product.minimumStockThreshold,
          priority,
          status: "pending",
          addedAt: new Date(),
          updatedBy: options.updatedBy,
          notes: normalizedNotes,
        },
      ],
      options.session ? { session: options.session } : {},
    );

    return restockQueueItem;
  }

  if (!pendingRestockQueueItem) {
    return null;
  }

  pendingRestockQueueItem.currentStock = product.stockQuantity;
  pendingRestockQueueItem.minimumStockThreshold = product.minimumStockThreshold;
  pendingRestockQueueItem.status = "restocked";
  pendingRestockQueueItem.resolvedAt = new Date();
  applySyncMetadata(pendingRestockQueueItem, {
    ...options,
    notes: normalizedNotes,
  });
  await pendingRestockQueueItem.save({ session: options.session });

  return pendingRestockQueueItem;
};

const syncRestockQueueForProducts = async (
  productIds: (string | Types.ObjectId)[],
  options: TSyncRestockQueueOptions = {},
) => {
  const uniqueProductIds = [
    ...new Set(productIds.map((productId) => productId.toString())),
  ];

  const syncedItems = [];

  for (const productId of uniqueProductIds) {
    const syncedItem = await syncRestockQueueForProduct(productId, options);

    if (syncedItem) {
      syncedItems.push(syncedItem);
    }
  }

  return syncedItems;
};

const getAllRestockQueueFromDB = async (filters: TRestockQueueFilters) => {
  const query: {
    isDeleted: boolean;
    status?: TRestockQueueStatus;
    priority?: TRestockQueuePriority;
  } = {
    isDeleted: false,
    status: "pending",
  };

  if (filters.status) {
    validateRestockQueueStatus(filters.status);
    query.status = filters.status as TRestockQueueStatus;
  }

  if (filters.priority) {
    validateRestockQueuePriority(filters.priority);
    query.priority = filters.priority as TRestockQueuePriority;
  }

  const restockQueueItems = await RestockQueue.find(query)
    .populate(restockQueuePopulate)
    .sort({ currentStock: 1, addedAt: 1 });

  return restockQueueItems;
};

const getSingleRestockQueueFromDB = async (id: string) => {
  const restockQueueItem = await getPopulatedRestockQueueItem(id);

  if (!restockQueueItem) {
    throw new AppError(httpStatus.NOT_FOUND, "Restock queue item not found");
  }

  return restockQueueItem;
};

const restockQueueItemIntoDB = async (
  id: string,
  payload: TRestockQueueRestockPayload,
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    await ensureUserExists(payload.updatedBy, session);

    const restockQueueItem = await getPendingRestockQueueItemById(id, session);

    if (!restockQueueItem) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Pending restock queue item not found",
      );
    }

    let productQuery = Product.findOne({
      _id: restockQueueItem.product,
      isDeleted: false,
    });

    productQuery = productQuery.session(session);

    const product = await productQuery;

    if (!product) {
      throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    product.stockQuantity = payload.stockQuantity;
    product.status = getProductStatus(payload.stockQuantity);
    await product.save({ session });

    await syncRestockQueueForProduct(product._id, {
      session,
      updatedBy: payload.updatedBy,
      notes: payload.notes,
    });

    await session.commitTransaction();

    const updatedRestockQueueItem = await getPopulatedRestockQueueItem(id);

    if (!updatedRestockQueueItem) {
      throw new AppError(httpStatus.NOT_FOUND, "Restock queue item not found");
    }

    return updatedRestockQueueItem;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const removeRestockQueueItemFromDB = async (
  id: string,
  payload: TRemoveRestockQueuePayload,
) => {
  await ensureUserExists(payload.updatedBy);

  const restockQueueItem = await RestockQueue.findOne({
    _id: id,
    isDeleted: false,
    status: "pending",
  }).populate(restockQueuePopulate);

  if (!restockQueueItem) {
    throw new AppError(httpStatus.NOT_FOUND, "Pending restock queue item not found");
  }

  restockQueueItem.status = "removed";
  restockQueueItem.resolvedAt = new Date();
  restockQueueItem.updatedBy = new mongoose.Types.ObjectId(payload.updatedBy);
  restockQueueItem.notes = normalizeNotes(payload.notes);
  await restockQueueItem.save();

  const updatedRestockQueueItem = await getPopulatedRestockQueueItem(id);

  if (!updatedRestockQueueItem) {
    throw new AppError(httpStatus.NOT_FOUND, "Restock queue item not found");
  }

  return updatedRestockQueueItem;
};

export const RestockQueueServices = {
  syncRestockQueueForProduct,
  syncRestockQueueForProducts,
  getAllRestockQueueFromDB,
  getSingleRestockQueueFromDB,
  restockQueueItemIntoDB,
  removeRestockQueueItemFromDB,
};
