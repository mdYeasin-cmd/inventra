import { getAccessToken } from "@/services/auth-storage"
import { request } from "@/services/http"

export type ProductCategory = {
  _id: string
  name: string
}

export type ProductStatus = "Active" | "Out of Stock"

export type Product = {
  _id: string
  name: string
  category: ProductCategory
  price: number
  stockQuantity: number
  minimumStockThreshold: number
  status: ProductStatus
  isLowStock: boolean
  createdAt?: string
  updatedAt?: string
}

export type ProductPayload = {
  name: string
  category: string
  price: number
  stockQuantity: number
  minimumStockThreshold: number
}

function getRequestHeaders() {
  const accessToken = getAccessToken()

  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : undefined
}

async function getAllProducts() {
  return request<Product[]>("/products", {
    method: "GET",
    headers: getRequestHeaders(),
    cache: "no-store",
  })
}

async function createProduct(payload: ProductPayload) {
  return request<Product>("/products", {
    method: "POST",
    headers: getRequestHeaders(),
    body: JSON.stringify(payload),
  })
}

async function updateProduct(id: string, payload: ProductPayload) {
  return request<Product>(`/products/${id}`, {
    method: "PATCH",
    headers: getRequestHeaders(),
    body: JSON.stringify(payload),
  })
}

async function deleteProduct(id: string) {
  return request<Product>(`/products/${id}`, {
    method: "DELETE",
    headers: getRequestHeaders(),
  })
}

export const ProductService = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
}
