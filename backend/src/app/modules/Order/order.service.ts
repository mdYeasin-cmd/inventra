import httpStatus from "http-status";
import mongoose from "mongoose";
import AppError from "../../errors/AppError";
import { Product } from "../Product/product.model";
import {
  orderStatuses,
  type TCreateOrderPayload,
  type TOrderFilters,
  type TOrderStatus,
  type TUpdateOrderStatusPayload,
} from "./order.interface";
import { Order } from "./order.model";

const orderStatusTransitions: Record<TOrderStatus, TOrderStatus[]> = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

const getProductStatus = (stockQuantity: number) => {
  return stockQuantity === 0 ? "Out of Stock" : "Active";
};

const parseDate = (dateString: string, isEndDate = false) => {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid date format");
  }

  if (!dateString.includes("T")) {
    if (isEndDate) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }
  }

  return date;
};

const validateOrderStatus = (status: string) => {
  if (!orderStatuses.includes(status as TOrderStatus)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid order status");
  }
};

const createOrderIntoDB = async (payload: TCreateOrderPayload) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const productIds = payload.products.map((item) => item.product);
    const uniqueProductIds = [...new Set(productIds)];

    if (uniqueProductIds.length !== productIds.length) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Duplicate products are not allowed in an order",
      );
    }

    const products = await Product.find({
      _id: { $in: uniqueProductIds },
      isDeleted: false,
    }).session(session);

    if (products.length !== uniqueProductIds.length) {
      throw new AppError(httpStatus.BAD_REQUEST, "One or more products not found");
    }

    const productMap = new Map(
      products.map((product) => [product._id.toString(), product]),
    );

    const orderProducts = payload.products.map((item) => {
      const product = productMap.get(item.product);

      if (!product) {
        throw new AppError(httpStatus.BAD_REQUEST, "Product not found");
      }

      if (item.quantity > product.stockQuantity) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `${product.name} does not have enough stock`,
        );
      }

      return {
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
      };
    });

    const totalPrice = orderProducts.reduce((total, item) => {
      return total + item.quantity * item.price;
    }, 0);

    for (const item of payload.products) {
      const product = productMap.get(item.product);

      if (!product) {
        throw new AppError(httpStatus.BAD_REQUEST, "Product not found");
      }

      product.stockQuantity -= item.quantity;
      product.status = getProductStatus(product.stockQuantity);

      await product.save({ session });
    }

    const [order] = await Order.create(
      [
        {
          customerName: payload.customerName.trim(),
          products: orderProducts,
          totalPrice,
          status: "Pending",
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const getAllOrdersFromDB = async (filters: TOrderFilters) => {
  const query: {
    isDeleted: boolean;
    status?: TOrderStatus;
    createdAt?: {
      $gte?: Date;
      $lte?: Date;
    };
  } = {
    isDeleted: false,
  };

  if (filters.status) {
    validateOrderStatus(filters.status);
    query.status = filters.status as TOrderStatus;
  }

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};

    if (filters.startDate) {
      query.createdAt.$gte = parseDate(filters.startDate);
    }

    if (filters.endDate) {
      query.createdAt.$lte = parseDate(filters.endDate, true);
    }

    if (
      query.createdAt.$gte &&
      query.createdAt.$lte &&
      query.createdAt.$gte > query.createdAt.$lte
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Start date cannot be greater than end date",
      );
    }
  }

  const orders = await Order.find(query).sort({ createdAt: -1 });

  return orders;
};

const getSingleOrderFromDB = async (id: string) => {
  const order = await Order.findOne({ _id: id, isDeleted: false });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  return order;
};

const updateOrderStatusIntoDB = async (
  id: string,
  payload: TUpdateOrderStatusPayload,
) => {
  const existingOrder = await Order.findOne({ _id: id, isDeleted: false });

  if (!existingOrder) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  if (existingOrder.status === payload.status) {
    throw new AppError(httpStatus.BAD_REQUEST, "Order status is already updated");
  }

  const allowedStatuses = orderStatusTransitions[existingOrder.status];

  if (!allowedStatuses.includes(payload.status)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid order status transition");
  }

  if (payload.status !== "Cancelled") {
    existingOrder.status = payload.status;
    await existingOrder.save();

    return existingOrder;
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const orderToCancel = await Order.findOne({ _id: id, isDeleted: false }).session(
      session,
    );

    if (!orderToCancel) {
      throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    const productIds = orderToCancel.products.map((item) => item.product.toString());
    const products = await Product.find({ _id: { $in: productIds } }).session(session);

    if (products.length !== productIds.length) {
      throw new AppError(httpStatus.BAD_REQUEST, "One or more ordered products not found");
    }

    const productMap = new Map(
      products.map((product) => [product._id.toString(), product]),
    );

    for (const item of orderToCancel.products) {
      const product = productMap.get(item.product.toString());

      if (!product) {
        throw new AppError(httpStatus.BAD_REQUEST, "Product not found");
      }

      product.stockQuantity += item.quantity;
      product.status = getProductStatus(product.stockQuantity);

      await product.save({ session });
    }

    orderToCancel.status = "Cancelled";
    await orderToCancel.save({ session });

    await session.commitTransaction();

    return orderToCancel;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const OrderServices = {
  createOrderIntoDB,
  getAllOrdersFromDB,
  getSingleOrderFromDB,
  updateOrderStatusIntoDB,
};
