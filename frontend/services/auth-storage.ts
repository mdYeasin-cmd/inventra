export type StoredSession = {
  accessToken: string
  refreshToken: string
  userId?: string
  name?: string
  role?: string
  exp?: number
}

type TokenPayload = {
  userId?: string
  name?: string
  role?: string
  exp?: number
}

const ACCESS_TOKEN_KEY = "inventra.accessToken"
const REFRESH_TOKEN_KEY = "inventra.refreshToken"
const AUTH_STORAGE_EVENT = "inventra-auth-change"

let cachedAccessToken: string | null = null
let cachedRefreshToken: string | null = null
let cachedSession: StoredSession | null = null

function canUseStorage() {
  return typeof window !== "undefined"
}

function decodeTokenPayload(token: string): TokenPayload | null {
  try {
    const payload = token.split(".")[1]

    if (!payload) {
      return null
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = atob(normalizedPayload)

    return JSON.parse(jsonPayload) as TokenPayload
  } catch {
    return null
  }
}

function buildStoredSession(
  accessToken: string | null,
  refreshToken: string | null
): StoredSession | null {
  if (!accessToken || !refreshToken) {
    return null
  }

  const payload = decodeTokenPayload(accessToken)

  return {
    accessToken,
    refreshToken,
    userId: payload?.userId,
    name: payload?.name,
    role: payload?.role,
    exp: payload?.exp,
  }
}

function notifyAuthStoreChange() {
  if (!canUseStorage()) {
    return
  }

  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT))
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  notifyAuthStoreChange()
}

export function getAccessToken() {
  if (!canUseStorage()) {
    return null
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  if (!canUseStorage()) {
    return null
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function clearAuthTokens() {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  notifyAuthStoreChange()
}

export function getSessionSnapshot(): StoredSession | null {
  const accessToken = getAccessToken()
  const refreshToken = getRefreshToken()

  if (
    accessToken === cachedAccessToken &&
    refreshToken === cachedRefreshToken
  ) {
    return cachedSession
  }

  cachedAccessToken = accessToken
  cachedRefreshToken = refreshToken
  cachedSession = buildStoredSession(accessToken, refreshToken)

  return cachedSession
}

export function subscribeToSessionStore(listener: () => void) {
  if (!canUseStorage()) {
    return () => {}
  }

  function handleStorageChange(event: StorageEvent) {
    if (
      event.key !== null &&
      event.key !== ACCESS_TOKEN_KEY &&
      event.key !== REFRESH_TOKEN_KEY
    ) {
      return
    }

    listener()
  }

  window.addEventListener("storage", handleStorageChange)
  window.addEventListener(AUTH_STORAGE_EVENT, listener)

  return () => {
    window.removeEventListener("storage", handleStorageChange)
    window.removeEventListener(AUTH_STORAGE_EVENT, listener)
  }
}

export function getStoredSession(): StoredSession | null {
  return getSessionSnapshot()
}
