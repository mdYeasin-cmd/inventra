export type TDashboardProductState = "Low Stock" | "Out of Stock" | "OK";

export interface IDashboardProductSummaryItem {
  _id: string;
  name: string;
  stockQuantity: number;
  minimumStockThreshold: number;
  inventoryState: TDashboardProductState;
}

export interface IDashboardRecentActivityItem {
  _id: string;
  type: string;
  message: string;
  actorName: string;
  entityType: string;
  entityId?: string;
  createdAt?: Date;
}

export interface IDashboardOverview {
  totalOrdersToday: number;
  pendingOrdersToday: number;
  completedOrdersToday: number;
  revenueToday: number;
  lowStockItemsCount: number;
  productSummary: IDashboardProductSummaryItem[];
  recentActivities: IDashboardRecentActivityItem[];
}
