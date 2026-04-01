import { getAccessToken } from "@/services/auth-storage"
import { request } from "@/services/http"

export type Category = {
  _id: string
  name: string
  createdAt?: string
  updatedAt?: string
}

export type CategoryPayload = {
  name: string
}

function getRequestHeaders() {
  const accessToken = getAccessToken()

  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : undefined
}

async function getAllCategories() {
  return request<Category[]>("/categories", {
    method: "GET",
    headers: getRequestHeaders(),
    cache: "no-store",
  })
}

async function createCategory(payload: CategoryPayload) {
  return request<Category>("/categories", {
    method: "POST",
    headers: getRequestHeaders(),
    body: JSON.stringify(payload),
  })
}

async function updateCategory(id: string, payload: CategoryPayload) {
  return request<Category>(`/categories/${id}`, {
    method: "PATCH",
    headers: getRequestHeaders(),
    body: JSON.stringify(payload),
  })
}

async function deleteCategory(id: string) {
  return request<Category>(`/categories/${id}`, {
    method: "DELETE",
    headers: getRequestHeaders(),
  })
}

export const CategoryService = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
}
