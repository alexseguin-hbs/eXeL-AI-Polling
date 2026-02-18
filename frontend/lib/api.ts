import { API_BASE_URL } from "./constants";
import { handleMockRequest } from "./mock-data";
import type { ApiError } from "./types";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// Mock mode: enabled when backend is not available
// Set to false once the backend API is running
const MOCK_MODE = true;

interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
}

// Token getter — set by Auth0 provider after initialization
let getAccessToken: (() => Promise<string>) | null = null;

export function setTokenGetter(getter: () => Promise<string>) {
  getAccessToken = getter;
}

class ApiClientError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiClientError";
    this.status = status;
    this.detail = detail;
  }
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
}

async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, headers: customHeaders, params } = options;

  // ── Mock Mode ─────────────────────────────────────────────────
  if (MOCK_MODE) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));

    const result = handleMockRequest<T>(method, path, body);
    if (result === null) {
      throw new ApiClientError(404, "Session not found. Check the code and try again.");
    }
    return result;
  }

  // ── Live API Mode ─────────────────────────────────────────────
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  // Attach auth token if available
  if (getAccessToken) {
    try {
      const token = await getAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch {
      // Token not available — proceed without auth (public endpoints)
    }
  }

  const url = buildUrl(path, params);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiClientError(0, "Connection lost. Check your internet and try again.");
  }

  if (!response.ok) {
    let detail = "Something went wrong. Please try again.";

    try {
      const errorData = await response.json();
      if (typeof errorData.detail === "string") {
        detail = errorData.detail;
      }
    } catch {
      // Could not parse error response
    }

    // Map common status codes to user-friendly messages
    const errorMessages: Record<number, string> = {
      401: "Your session has expired. Please log in again.",
      404: "Session not found. Check the code and try again.",
      409: "This session is no longer accepting responses.",
      410: "This session has expired.",
      422: detail, // Use server-provided validation message
      500: "Something went wrong. Please try again.",
    };

    const message = errorMessages[response.status] || detail;
    throw new ApiClientError(response.status, message);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, options),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, options),

  // ── Convenience methods ──────────────────────────────────────
  submitTextResponse: (
    sessionId: string,
    questionId: string,
    participantId: string,
    text: string,
    languageCode: string = "en",
  ) =>
    request<import("./types").TextResponseRead>(
      "POST",
      `/sessions/${sessionId}/responses`,
      {
        body: {
          question_id: questionId,
          participant_id: participantId,
          raw_text: text,
          language_code: languageCode,
        },
      },
    ),

  getSessionQuestions: (sessionId: string) =>
    request<Array<{ id: string; question_text: string; question_number: number; is_active: boolean; created_at: string }>>(
      "GET",
      `/sessions/${sessionId}/questions`
    ),

  startTimeTracking: (sessionId: string, participantId: string) =>
    request<{ id: string }>("POST", `/time/start`, {
      body: { session_id: sessionId, participant_id: participantId, action_type: "responding" },
    }),

  stopTimeTracking: (timeEntryId: string) =>
    request<{ id: string }>("POST", `/time/${timeEntryId}/stop`),
};

export { ApiClientError };
export type { ApiError };
