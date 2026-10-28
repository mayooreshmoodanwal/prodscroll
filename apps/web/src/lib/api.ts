export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || API_URL.replace(/^http/, "ws");
import { ApiError, decodeResponse } from "@productscroll/api-client";
export { ApiError };
import type { EventType } from "@productscroll/analytics";
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "We couldn’t reach ProductScroll. Check your connection and try again.",
      0,
    );
  }
  return decodeResponse<T>(response);
}
export const mutate = <T>(path: string, body?: unknown, method = "POST") =>
  api<T>(path, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
export function track(
  type: EventType,
  fields: { postId?: string; startupId?: string; value?: number } = {},
) {
  void mutate("/events", { events: [{ type, ...fields }] }).catch(
    () => undefined,
  );
}
export function ago(value: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60000),
  );
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  if (minutes < 10080) return `${Math.floor(minutes / 1440)}d`;
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
export function safeUrl(value?: string) {
  if (!value) return undefined;
  try {
    if (value.startsWith("http://localhost:4000/media") || value.startsWith("http://localhost:4180/media")) {
      return value.replace(/^http:\/\/localhost:\d+\/media/, "https://productscroll-api.onrender.com/media");
    }
    const url = new URL(value, API_URL);
    return ["http:", "https:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
