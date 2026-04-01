import { request } from "@/services/http"

export type SignupPayload = {
  name: string
  email: string
  password: string
}

export type SignupResult = {
  _id: string
  name: string
  email: string
  role: string
  createdAt?: string
  updatedAt?: string
}

export type LoginPayload = {
  email: string
  password: string
}

export type LoginResult = {
  accessToken: string
  refreshToken: string
}

async function signupUser(payload: SignupPayload) {
  return request<SignupResult>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

async function loginUser(payload: LoginPayload) {
  return request<LoginResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export const AuthService = {
  signupUser,
  loginUser,
}
