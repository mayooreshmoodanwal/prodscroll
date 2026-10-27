import { createHmac } from "node:crypto";
import { storageConfig } from "@productscroll/config";
/** Sign only configured R2 delivery URLs; local/seed media keeps its own URL. */
export function mediaUrl(value: string | null | undefined) {
  if (!value) return value;
  const config = storageConfig();
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
