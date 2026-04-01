import { ActivityLogServices } from "../ActivityLog/activityLog.service";
import { Order } from "../Order/order.model";
import { Product } from "../Product/product.model";
import type {
  IDashboardOverview,
  IDashboardProductSummaryItem,
} from "./dashboard.interface";

const getTodayRange = () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  return {
    startOfToday,
    endOfToday,
  };
};

const getInventoryState = (
  stockQuantity: number,
  minimumStockThreshold: number,
): IDashboardProductSummaryItem["inventoryState"] => {
  if (stockQuantity === 0) {
    return "Out of Stock";
  }

  if (stockQuantity <= minimumStockThreshold) {
    return "Low Stock";
  }

  return "OK";
};

const getProductPriorityScore = (
  stockQuantity: number,
  minimumStockThreshold: number,
) => {
  if (stockQuantity === 0) {
    return 0;
  }

  if (stockQuantity <= minimumStockThreshold) {
    return 1;
  }

  return 2;
};

const getDashboardOverviewFromDB = async (): Promise<IDashboardOverview> => {
  const { startOfToday, endOfToday } = getTodayRange();

  const [
    totalOrdersToday,
    pendingOrdersToday,
    completedOrdersToday,
    revenueAggregation,
    lowStockItemsCount,
    products,
    recentActivityLogs,
  ] = await Promise.all([
    Order.countDocuments({
      isDeleted: false,
      createdAt: {
        $gte: startOfToday,
        $lt: endOfToday,
      },
    }),
    Order.countDocuments({
      isDeleted: false,
      createdAt: {
        $gte: startOfToday,
        $lt: endOfToday,
      },
      status: {
        $in: ["Pending", "Confirmed", "Shipped"],
      },
    }),
    Order.countDocuments({
      isDeleted: false,
      createdAt: {
        $gte: startOfToday,
        $lt: endOfToday,
      },
      status: "Delivered",
    }),
    Order.aggregate<{ totalRevenue: number }>([
      {
        $match: {
          isDeleted: false,
          status: "Delivered",
          createdAt: {
            $gte: startOfToday,
            $lt: endOfToday,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]),
    Product.countDocuments({
      isDeleted: false,
      $expr: {
        $lte: ["$stockQuantity", "$minimumStockThreshold"],
      },
    }),
    Product.find({ isDeleted: false })
      .select("name stockQuantity minimumStockThreshold")
      .lean(),
    ActivityLogServices.getRecentActivityLogsFromDB(),
  ]);

  const productSummary = products
    .map((product) => ({
      _id: product._id.toString(),
      name: product.name,
      stockQuantity: product.stockQuantity,
      minimumStockThreshold: product.minimumStockThreshold,
      inventoryState: getInventoryState(
        product.stockQuantity,
        product.minimumStockThreshold,
      ),
    }))
    .sort((firstProduct, secondProduct) => {
      const firstPriority = getProductPriorityScore(
        firstProduct.stockQuantity,
        firstProduct.minimumStockThreshold,
      );
      const secondPriority = getProductPriorityScore(
        secondProduct.stockQuantity,
        secondProduct.minimumStockThreshold,
      );

      if (firstPriority !== secondPriority) {
        return firstPriority - secondPriority;
      }

      if (firstProduct.stockQuantity !== secondProduct.stockQuantity) {
        return firstProduct.stockQuantity - secondProduct.stockQuantity;
      }

      return firstProduct.name.localeCompare(secondProduct.name);
    })
    .slice(0, 5);

  return {
    totalOrdersToday,
    pendingOrdersToday,
    completedOrdersToday,
    revenueToday: revenueAggregation[0]?.totalRevenue ?? 0,
    lowStockItemsCount,
    productSummary,
    recentActivities: recentActivityLogs.map((activityLog) => ({
      _id: activityLog._id.toString(),
      type: activityLog.type,
      message: activityLog.message,
      actorName: activityLog.actorName ?? "System",
      entityType: activityLog.entityType,
      entityId: activityLog.entityId,
      createdAt: activityLog.createdAt,
    })),
  };
};

export const DashboardServices = {
  getDashboardOverviewFromDB,
};
