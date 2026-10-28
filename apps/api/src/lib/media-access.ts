import { createHmac } from "node:crypto";
import { storageConfig } from "@productscroll/config";
export function mediaUrl(value: string | null | undefined) {
  if (!value) return value;
  const config = storageConfig();
  if (value.startsWith("http://localhost:4000/media") || value.startsWith("http://localhost:4180/media")) {
    const publicMedia =
      process.env.MEDIA_PUBLIC_URL ||
      (process.env.PUBLIC_API_URL
        ? `${process.env.PUBLIC_API_URL.replace(/\/api\/?$/, "")}/media`
        : "https://productscroll-api.onrender.com/media");
    value = value.replace(/^http:\/\/localhost:\d+\/media/, publicMedia);
  }
  if (config.driver !== "r2" || !value.startsWith(`${config.deliveryUrl}/`))
    return value;
  const url = new URL(value);
  const asset = url.pathname.split("/")[1];
  const expires = Math.floor(Date.now() / 1000) + 900;
  url.searchParams.set("expires", String(expires));
  url.searchParams.set(
    "signature",
    createHmac("sha256", config.deliverySecret)
      .update(`${asset}:${expires}`)
      .digest("hex"),
  );
  return url.toString();
}
