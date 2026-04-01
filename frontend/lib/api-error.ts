import { isApiClientError } from "@/services/http"

export function getErrorDetails(error: unknown, fallbackMessage: string) {
  if (!isApiClientError(error)) {
    return {
      path: "",
      message: fallbackMessage,
    }
  }

  return {
    path: String(error.errorSources[0]?.path ?? ""),
    message: error.errorSources[0]?.message ?? error.message,
  }
}
