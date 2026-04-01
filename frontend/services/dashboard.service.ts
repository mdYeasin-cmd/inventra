import { getAccessToken } from "@/services/auth-storage"
import { request } from "@/services/http"
import type { ActivityLogItem } from "@/services/activity-log.service"

export type DashboardProductSummaryItem = {
  _id: string
  name: string
  stockQuantity: number
  minimumStockThreshold: number
  inventoryState: "Low Stock" | "Out of Stock" | "OK"
}

export type DashboardOverview = {
  totalOrdersToday: number
  pendingOrdersToday: number
  completedOrdersToday: number
  revenueToday: number
  lowStockItemsCount: number
  productSummary: DashboardProductSummaryItem[]
  recentActivities: ActivityLogItem[]
}

function getRequestHeaders() {
  const accessToken = getAccessToken()

  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : undefined
}

async function getDashboardOverview() {
  return request<DashboardOverview>("/dashboard", {
    method: "GET",
    headers: getRequestHeaders(),
    cache: "no-store",
  })
}

export const DashboardService = {
  getDashboardOverview,
}
