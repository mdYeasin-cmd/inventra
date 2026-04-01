export type TDashboardProductState = "Low Stock" | "Out of Stock" | "OK";

export interface IDashboardProductSummaryItem {
  _id: string;
  name: string;
  stockQuantity: number;
  minimumStockThreshold: number;
  inventoryState: TDashboardProductState;
}

export interface IDashboardOverview {
  totalOrdersToday: number;
  pendingOrdersToday: number;
  completedOrdersToday: number;
  revenueToday: number;
  lowStockItemsCount: number;
  productSummary: IDashboardProductSummaryItem[];
}
