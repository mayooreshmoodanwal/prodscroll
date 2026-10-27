import { decodeResponse } from "@productscroll/api-client";
import type { EventType } from "@productscroll/analytics";
import * as SecureStore from "expo-secure-store";
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api";
let access: string | null = null;
let refresh: string | null = null;
let refreshing: Promise<void> | null = null;
export async function restoreTokens() {
  access = await SecureStore.getItemAsync("ps.access");
  refresh = await SecureStore.getItemAsync("ps.refresh");
}
export async function saveTokens(tokens: {
  accessToken: string;
  refreshToken: string;
}) {
  access = tokens.accessToken;
  refresh = tokens.refreshToken;
  await SecureStore.setItemAsync("ps.access", access);
  await SecureStore.setItemAsync("ps.refresh", refresh);
}
export async function clearTokens() {
  access = null;
  refresh = null;
  await SecureStore.deleteItemAsync("ps.access");
  await SecureStore.deleteItemAsync("ps.refresh");
}
export async function request<T>(
  path: string,
  body?: unknown,
  method = body === undefined ? "GET" : "POST",
  retry = true,
): Promise<T> {
  const response = await fetch(API_URL + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (
    response.status === 401 &&
    refresh &&
    retry &&
    !path.startsWith("/auth/")
  ) {
    if (!refreshing)
      refreshing = (async () => {
        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: refresh }),
        });
        if (!response.ok) {
          await clearTokens();
          throw new Error("Please sign in again.");
        }
        await saveTokens(
          (await response.json()) as {
            accessToken: string;
            refreshToken: string;
          },
        );
      })().finally(() => {
        refreshing = null;
      });
    await refreshing;
    return request<T>(path, body, method, false);
  }
  return decodeResponse<T>(response);
}
export async function signOut() {
  try {
    await request("/auth/logout", { refreshToken: refresh });
  } finally {
    await clearTokens();
  }
}
export function track(type: EventType, postId: string, value?: number) {
  void request("/events", { events: [{ type, postId, value }] }).catch(
    () => undefined,
  );
}
