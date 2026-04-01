import { getAccessToken } from "@/services/auth-storage"
import { request } from "@/services/http"

export const activityLogTypes = [
  "category_created",
  "category_updated",
  "category_deleted",
  "product_created",
  "product_updated",
  "product_deleted",
  "order_created",
  "order_status_changed",
  "restock_queue_added",
  "restock_completed",
  "restock_removed",
] as const

export type ActivityLogType = (typeof activityLogTypes)[number]
export type ActivityLogEntityType = "category" | "product" | "order" | "restockQueue"

export type ActivityLogItem = {
  _id: string
  type: ActivityLogType
  message: string
  actorName: string
  entityType: ActivityLogEntityType
  entityId?: string
  metadata?: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

export type ActivityLogFilters = {
  type?: string
  page?: number
  limit?: number
}

export type ActivityLogListResponse = {
  items: ActivityLogItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

function getRequestHeaders() {
  const accessToken = getAccessToken()

  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : undefined
}

function buildQueryString(filters: ActivityLogFilters = {}) {
  const params = new URLSearchParams()

  if (filters.type) {
    params.set("type", filters.type)
  }

  if (filters.page) {
    params.set("page", String(filters.page))
  }

  if (filters.limit) {
    params.set("limit", String(filters.limit))
  }

  const query = params.toString()

  return query ? `?${query}` : ""
}

async function getActivityLogs(filters: ActivityLogFilters = {}) {
  return request<ActivityLogListResponse>(`/activity-logs${buildQueryString(filters)}`, {
    method: "GET",
    headers: getRequestHeaders(),
    cache: "no-store",
  })
}

export const ActivityLogService = {
  getActivityLogs,
}
