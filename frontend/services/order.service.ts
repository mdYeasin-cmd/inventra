import { getAccessToken } from "@/services/auth-storage"
import { request } from "@/services/http"

export const orderStatuses = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const

export type OrderStatus = (typeof orderStatuses)[number]

export type OrderItem = {
  product: string
  name: string
  quantity: number
  price: number
}

export type Order = {
  _id: string
  customerName: string
  products: OrderItem[]
  totalPrice: number
  status: OrderStatus
  createdAt?: string
  updatedAt?: string
}

export type CreateOrderPayload = {
  customerName: string
  products: Array<{
    product: string
    quantity: number
  }>
}

export type OrderFilters = {
  status?: string
  startDate?: string
  endDate?: string
}

function getRequestHeaders() {
  const accessToken = getAccessToken()

  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : undefined
}

function buildQueryString(filters: OrderFilters = {}) {
  const params = new URLSearchParams()

  if (filters.status) {
    params.set("status", filters.status)
  }

  if (filters.startDate) {
    params.set("startDate", filters.startDate)
  }

  if (filters.endDate) {
    params.set("endDate", filters.endDate)
  }

  const query = params.toString()

  return query ? `?${query}` : ""
}

async function getAllOrders(filters: OrderFilters = {}) {
  return request<Order[]>(`/orders${buildQueryString(filters)}`, {
    method: "GET",
    headers: getRequestHeaders(),
    cache: "no-store",
  })
}

async function getSingleOrder(id: string) {
  return request<Order>(`/orders/${id}`, {
    method: "GET",
    headers: getRequestHeaders(),
    cache: "no-store",
  })
}

async function createOrder(payload: CreateOrderPayload) {
  return request<Order>("/orders", {
    method: "POST",
    headers: getRequestHeaders(),
    body: JSON.stringify(payload),
  })
}

async function updateOrderStatus(id: string, payload: { status: OrderStatus }) {
  return request<Order>(`/orders/${id}/status`, {
    method: "PATCH",
    headers: getRequestHeaders(),
    body: JSON.stringify(payload),
  })
}

export const OrderService = {
  getAllOrders,
  getSingleOrder,
  createOrder,
  updateOrderStatus,
}
