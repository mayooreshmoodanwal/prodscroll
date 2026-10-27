import { useEffect, useState } from "react";
import type { Media } from "./types";
import { request } from "./client";
/** Renew private R2 access while a video is near/inside the viewport. */
export function useMediaSource(media: Media, enabled: boolean) {
  const [url, setUrl] = useState(media.url);
  useEffect(() => {
    let cancelled = false,
      busy = false;
    let current = media.url;
    setUrl(current);
    if (!enabled) return;
    const refresh = async () => {
      const expires = Number(new URL(current).searchParams.get("expires"));
      if (!expires || expires * 1000 > Date.now() + 60000 || busy) return;
      busy = true;
      try {
        const result = await request<{ url: string }>(
          `/media/${media.id}/playback`,
        );
        if (!cancelled) {
          current = result.url;
          setUrl(result.url);
        }
      } catch {
        /* The player retains its error/retry UI; never block scrolling. */
      } finally {
        busy = false;
      }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [media.id, media.url, enabled]);
  return url;
}
