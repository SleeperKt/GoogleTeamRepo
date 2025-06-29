/*
  Simple API helper for ProjectHub front-end.
  All requests are sent to the backend specified in the NEXT_PUBLIC_API_BASE_URL env variable.
  If no env variable is set we fallback to http://localhost:8080 which is the default ASP.NET port in docker-compose.
*/

import type { ProjectInvitation, CreateInvitationRequest, InvitationStatus } from './types';

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
      
      // Clone the response so we can read it multiple times if needed
      const responseClone = response.clone();
      
      try {
        const json = await response.json();
        console.log("Server error response:", json);
        if (json && typeof json === "object") {
            if ("code" in json && "message" in json) {
                message = `${(json as { code: string; message: string }).code}: ${(json as { message: string }).message}`;
                if ((json as { details?: unknown }).details) {
                    try {
                        message += ` - ${JSON.stringify((json as { details?: unknown }).details)}`;
                    } catch {
                        /* ignore stringify errors */
                    }
                }
            } else if ("message" in json && typeof (json as { message: unknown }).message === 'string') {
                message = (json as { message: string }).message;
            } else {
                message = JSON.stringify((json as { errors?: unknown }).errors || json);
            }
        } else if (typeof json === 'string') {
            message = json;
        }
      } catch {
        // If JSON parsing fails, try reading as text from the cloned response
        try {
          const text = await responseClone.text();
          console.log("Server error response (text):", text);
          if(text) message = text;
        } catch {
          // If both fail, keep the default message
          console.log("Could not read response body");
        }
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

// User Profile API functions
export const profileApi = {
  // Get current user profile
  getCurrentUser: async () => {
    return apiRequest<{
      userId: string;
      userName: string;
      email: string;
      bio?: string;
    }>('/api/user/me');
  },

  // Update current user profile
  updateProfile: async (profileData: {
    userName: string;
    email: string;
    bio?: string;
  }) => {
    return apiRequest<{
      userId: string;
      userName: string;
      email: string;
      bio?: string;
    }>('/api/user/me', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }
};

// Invitation API functions
export const invitationApi = {
  // Get received invitations
  getReceivedInvitations: async (status?: number) => {
    const queryParam = status !== undefined ? `?status=${status}` : '';
    return apiRequest<ProjectInvitation[]>(`/api/invitations/received${queryParam}`);
  },

  // Get sent invitations
  getSentInvitations: async (status?: number) => {
    const queryParam = status !== undefined ? `?status=${status}` : '';
    return apiRequest<ProjectInvitation[]>(`/api/invitations/sent${queryParam}`);
  },

  // Get invitation details
  getInvitation: async (id: number) => {
    return apiRequest<ProjectInvitation>(`/api/invitations/${id}`);
  },

  // Respond to invitation (accept/decline)
  respondToInvitation: async (id: number, status: InvitationStatus) => {
    return apiRequest(`/api/invitations/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  },

  // Cancel invitation
  cancelInvitation: async (id: number) => {
    return apiRequest(`/api/invitations/${id}/cancel`, {
      method: 'DELETE'
    });
  },

  // Create invitation for a project
  createProjectInvitation: async (projectId: number, request: CreateInvitationRequest) => {
    try {
      console.log("Attempting to create invitation with data:", { projectId, request });
      const result = await apiRequest(`/api/projects/${projectId}/invitations`, {
        method: 'POST',
        body: JSON.stringify(request)
      });
      console.log("Invitation creation successful:", result);
      return result;
    } catch (error) {
      console.error("Error creating project invitation:", error);
      throw error;
    }
  },

  // Get project invitations
  getProjectInvitations: async (projectId: number) => {
    return apiRequest<ProjectInvitation[]>(`/api/projects/${projectId}/invitations`);
  }
}; 