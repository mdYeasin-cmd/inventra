export type ApiErrorSource = {
  path: string | number
  message: string
}

type ApiSuccessResponse<T> = {
  success: true
  message: string
  data: T
}

type ApiFailureResponse = {
  success: false
  message: string
  errorSources?: ApiErrorSource[]
}

export class ApiClientError extends Error {
  statusCode: number
  errorSources: ApiErrorSource[]

  constructor(
    message: string,
    statusCode = 500,
    errorSources: ApiErrorSource[] = []
  ) {
    super(message)
    this.name = "ApiClientError"
    this.statusCode = statusCode
    this.errorSources = errorSources
  }
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api/v1"
).replace(/\/$/, "")

function isJsonResponse(response: Response) {
  return response.headers.get("content-type")?.includes("application/json")
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError
}

export async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<{ message: string; data: T }> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    })

    const payload = isJsonResponse(response)
      ? ((await response.json()) as ApiSuccessResponse<T> | ApiFailureResponse)
      : null

    if (!response.ok) {
      throw new ApiClientError(
        payload?.message ?? "Request failed. Please try again.",
        response.status,
        payload && "errorSources" in payload ? (payload.errorSources ?? []) : []
      )
    }

    return {
      message: payload?.message ?? "Request successful",
      data: (payload as ApiSuccessResponse<T>).data,
    }
  } catch (error) {
    if (isApiClientError(error)) {
      throw error
    }

    throw new ApiClientError(
      "Unable to connect to the server right now. Please try again.",
      0
    )
  }
}
