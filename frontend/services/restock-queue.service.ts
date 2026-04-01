import { getAccessToken } from "@/services/auth-storage"
import { request } from "@/services/http"

export const restockQueuePriorities = ["high", "medium", "low"] as const
export type RestockQueuePriority = (typeof restockQueuePriorities)[number]

export const restockQueueStatuses = ["pending", "restocked", "removed"] as const
export type RestockQueueStatus = (typeof restockQueueStatuses)[number]

export type RestockQueueProduct = {
  _id: string
  name: string
  price: number
  stockQuantity: number
  minimumStockThreshold: number
  status: "Active" | "Out of Stock"
  category?: {
    _id: string
    name: string
  }
}

export type RestockQueueUpdatedBy = {
  _id: string
  name: string
  email: string
  role: string
}

export type RestockQueueItem = {
  _id: string
  product: RestockQueueProduct
  currentStock: number
  minimumStockThreshold: number
  priority: RestockQueuePriority
  status: RestockQueueStatus
  addedAt: string
  resolvedAt?: string
  updatedBy?: RestockQueueUpdatedBy
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export type RestockQueueFilters = {
  status?: string
  priority?: string
}

export type RestockQueueRestockPayload = {
  stockQuantity: number
  updatedBy: string
  notes?: string
}

export type RemoveRestockQueueItemPayload = {
  updatedBy: string
  notes?: string
}

function getRequestHeaders() {
  const accessToken = getAccessToken()

  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : undefined
}

function buildQueryString(filters: RestockQueueFilters = {}) {
  const params = new URLSearchParams()

  if (filters.status) {
    params.set("status", filters.status)
  }

  if (filters.priority) {
    params.set("priority", filters.priority)
  }

  const query = params.toString()

  return query ? `?${query}` : ""
}

async function getAllRestockQueue(filters: RestockQueueFilters = {}) {
  return request<RestockQueueItem[]>(`/restock-queue${buildQueryString(filters)}`, {
    method: "GET",
    headers: getRequestHeaders(),
    cache: "no-store",
  })
}

async function getSingleRestockQueueItem(id: string) {
  return request<RestockQueueItem>(`/restock-queue/${id}`, {
    method: "GET",
    headers: getRequestHeaders(),
    cache: "no-store",
  })
}

async function restockQueueItem(id: string, payload: RestockQueueRestockPayload) {
  return request<RestockQueueItem>(`/restock-queue/${id}/restock`, {
    method: "PATCH",
    headers: getRequestHeaders(),
    body: JSON.stringify(payload),
  })
}

async function removeRestockQueueItem(id: string, payload: RemoveRestockQueueItemPayload) {
  return request<RestockQueueItem>(`/restock-queue/${id}/remove`, {
    method: "PATCH",
    headers: getRequestHeaders(),
    body: JSON.stringify(payload),
  })
}

export const RestockQueueService = {
  getAllRestockQueue,
  getSingleRestockQueueItem,
  restockQueueItem,
  removeRestockQueueItem,
}
