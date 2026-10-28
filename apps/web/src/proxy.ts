import { NextRequest, NextResponse } from "next/server";
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const api = new URL(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
    request.url,
  ).origin;
  const socket =
    process.env.NEXT_PUBLIC_SOCKET_URL || api.replace(/^http/, "ws");
  const development = process.env.NODE_ENV !== "production";
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' https: http: data: blob:",
    "media-src 'self' https: http: blob:",
    `connect-src 'self' ${api} ${socket} https://productscroll-api.onrender.com wss://productscroll-api.onrender.com https://*.onrender.com wss://*.onrender.com https://*.r2.cloudflarestorage.com https://*.cloudflare.com blob: ${process.env.NEXT_PUBLIC_UPLOAD_ORIGINS || ""}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
