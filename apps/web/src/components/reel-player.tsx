"use client";
import { useMediaSource } from "../lib/media-source";
import { useEffect, useRef, useState } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";
import { safeUrl, track } from "../lib/api";
import type { Media } from "../lib/types";
export function ReelPlayer({
  media,
  postId,
  active,
  preload,
  onLike,
  muted,
  onMute,
}: {
  media: Media;
  postId: string;
  active: boolean;
  preload: boolean;
  onLike: () => void;
  muted: boolean;
  onMute: (muted: boolean) => void;
}) {
  const source = useMediaSource(media, active || preload);
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const hlsRef = useRef<import("hls.js").default | null>(null);
  const [paused, setPaused] = useState(false),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0);
  const manualPause = useRef(false),
    milestones = useRef(new Set<number>()),
    held = useRef(false),
    wasPlaying = useRef(false),
    holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resume = () => {
    if (activeRef.current && !document.hidden && !manualPause.current)
      void videoRef.current?.play().catch(() => setPaused(true));
  };
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    setError(false);
    if (
      source.split("?")[0].endsWith(".m3u8") &&
      !video.canPlayType("application/vnd.apple.mpegurl")
    ) {
      void import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) {
          setError(true);
          return;
        }
        const hls = new Hls({
          maxBufferLength: 6,
          maxMaxBufferLength: 10,
          backBufferLength: 2,
          startLevel: 0,
          autoStartLoad: false,
        });
        hlsRef.current = hls;
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (activeRef.current || preload) hls.startLoad();
          resume();
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) setError(true);
        });
      });
    } else {
      video.src = source;
      video.load();
    }
    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.pause();
      video.removeAttribute("src");
      video.load();
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, [source, retry]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) {
      manualPause.current = false;
      hlsRef.current?.startLoad();
      resume();
    } else {
      video.pause();
      if (!preload) hlsRef.current?.stopLoad();
    }
    const visibility = () => {
      if (document.hidden) video.pause();
      else resume();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      video.pause();
    };
  }, [active, preload]);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);
  useEffect(() => {
    if (!active) return;
    track("FEED_IMPRESSION", { postId });
    const started = Date.now();
    return () => {
      if (Date.now() - started < 1200) track("SKIP", { postId });
    };
  }, [active, postId]);
  const releaseHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (held.current && wasPlaying.current) {
      manualPause.current = false;
      resume();
    }
  };
  return (
    <div className="reel-player" onDoubleClick={onLike}>
      <video
        ref={videoRef}
        playsInline
        loop
        muted={muted}
        preload={preload || active ? "auto" : "metadata"}
        poster={safeUrl(media.thumbnailUrl)}
        aria-label="Product reel video"
        onCanPlay={resume}
        onPlay={() => {
          setPaused(false);
          if (!milestones.current.has(0)) {
            milestones.current.add(0);
            track("VIDEO_START", { postId });
          }
        }}
        onPause={() => setPaused(true)}
        onError={() => {
          if (retry < 2) {
            setRetry((r) => r + 1);
          } else {
            setError(true);
          }
        }}
        onPointerDown={() => {
          held.current = false;
          wasPlaying.current = !videoRef.current?.paused;
          holdTimer.current = setTimeout(() => {
            held.current = true;
            videoRef.current?.pause();
          }, 250);
        }}
        onPointerUp={releaseHold}
        onPointerCancel={releaseHold}
        onClick={() => {
          if (held.current) {
            held.current = false;
            return;
          }
          const video = videoRef.current;
          if (!video) return;
          manualPause.current = !video.paused;
          if (video.paused) void video.play().catch(() => setPaused(true));
          else video.pause();
        }}
        onTimeUpdate={(e) => {
          if (!active) return;
          const v = e.currentTarget;
          for (const point of [25, 50, 75, 95] as const)
            if (
              (v.currentTime / v.duration) * 100 >= point &&
              !milestones.current.has(point)
            ) {
              milestones.current.add(point);
              track(point === 95 ? "VIDEO_COMPLETE" : `VIDEO_${point}`, {
                postId,
                value: v.currentTime * 1000,
              });
            }
          if (v.currentTime < 0.2 && milestones.current.has(95)) {
            milestones.current.clear();
            track("VIDEO_REPLAY", { postId });
          }
        }}
      />
      {paused && active && !error && (
        <button
          className="reel-play-toggle"
          aria-label="Play reel"
          onClick={() => {
            manualPause.current = false;
            resume();
          }}
        >
          <Play size={38} fill="currentColor" />
        </button>
      )}
      {error && (
        <div className="reel-video-error">
          <p>This reel couldn’t load.</p>
          <button onClick={() => setRetry((n) => n + 1)}>Retry video</button>
        </div>
      )}
      <button
        className="reel-sound"
        aria-label={muted ? "Unmute reel" : "Mute reel"}
        onClick={() => {
          onMute(!muted);
        }}
      >
        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </div>
  );
}
