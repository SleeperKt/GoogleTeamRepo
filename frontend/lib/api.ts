/*
  Simple API helper for ProjectHub front-end.
  All requests are sent to the backend specified in the NEXT_PUBLIC_API_BASE_URL env variable.
  If no env variable is set we fallback to http://localhost:8080 which is the default ASP.NET port in docker-compose.
*/

/* eslint-disable @typescript-eslint/consistent-type-definitions */
declare const process: {
  env: Record<string, string | undefined>
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:7001";

interface RequestOptions extends RequestInit {
  /**
   * When true (default) the Authorization header with the stored JWT token
   * will be attached to the request if one is present in localStorage.
   */
  auth?: boolean;
  /**
   * Request timeout in milliseconds (default: 30000ms/30s)
   */
  timeout?: number;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  { auth = true, timeout = 30000, headers, ...options }: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getAuthToken();
    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Try to read server error message
      let message = `Request failed with ${response.status}`;
      try {
        const json = await response.json();
        if (json && typeof json === "object" && "message" in json) {
          message = (json as any).message as string;
        }
      } catch {
        /* ignore JSON parse error */
      }
      throw new Error(message);
    }

    // If server responds with no content
    if (response.status === 204) return undefined as T;

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return (await response.json()) as T;
    }

    // Fallback to text for non-JSON responses
    return (await response.text()) as unknown as T;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    
    throw error;
  }
} 