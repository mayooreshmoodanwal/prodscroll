import { useMediaSource } from "./media-source";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { track } from "./client";
import type { Media } from "./types";

export function NativeReelPlayer({
  media,
  postId,
  active,
  muted,
  onLike,
}: {
  media: Media;
  postId: string;
  active: boolean;
  muted: boolean;
  onLike: () => void;
}) {
  const source = useMediaSource(media, active);
  const player = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = true;
    p.timeUpdateEventInterval = 0.5;
    p.bufferOptions = { preferredForwardBufferDuration: 6 };
  });
  const [paused, setPaused] = useState(false),
    [error, setError] = useState(false),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0);
  const activeRef = useRef(active),
    manualPause = useRef(false),
    held = useRef(false),
    wasPlaying = useRef(false),
    lastTap = useRef(0);
  activeRef.current = active;
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    void player
      .replaceAsync({
        uri: source,
        useCaching: !source.split("?")[0].endsWith(".m3u8"),
      })
      .then(() => {
        if (cancelled) return;
        setLoading(false);
        if (activeRef.current && AppState.currentState === "active")
          player.play();
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [player, source, retry]);
  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);
  useEffect(() => {
    manualPause.current = false;
    if (active && AppState.currentState === "active") player.play();
    else player.pause();
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active" && activeRef.current && !manualPause.current)
        player.play();
      else player.pause();
    });
    if (active) track("FEED_IMPRESSION", postId);
    const started = Date.now();
    return () => {
      listener.remove();
      player.pause();
      if (active && Date.now() - started < 1200) track("SKIP", postId);
    };
  }, [active, player, postId]);
  useEffect(() => {
    const milestones = new Set<number>();
    const status = player.addListener("statusChange", (event) => {
      if (event.status === "error") setError(true);
    });
    const playing = player.addListener("playingChange", (event) => {
      setPaused(!event.isPlaying);
      if (event.isPlaying && activeRef.current && !milestones.has(0)) {
        milestones.add(0);
        track("VIDEO_START", postId);
      }
    });
    const time = player.addListener("timeUpdate", ({ currentTime }) => {
      if (!activeRef.current || !player.duration) return;
      for (const point of [25, 50, 75, 95] as const) {
        if (
          (currentTime / player.duration) * 100 >= point &&
          !milestones.has(point)
        ) {
          milestones.add(point);
          track(
            point === 95 ? "VIDEO_COMPLETE" : `VIDEO_${point}`,
            postId,
            currentTime * 1000,
          );
        }
      }
      if (currentTime < 0.6 && milestones.has(95)) {
        milestones.clear();
        track("VIDEO_REPLAY", postId);
      }
    });
    return () => {
      status.remove();
      playing.remove();
      time.remove();
    };
  }, [player, postId]);
  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView
        player={player}
        nativeControls={false}
        contentFit="contain"
        style={StyleSheet.absoluteFill}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={paused ? "Play reel" : "Pause reel"}
        style={[
          StyleSheet.absoluteFill,
          { alignItems: "center", justifyContent: "center" },
        ]}
        onPressIn={() => {
          held.current = false;
          wasPlaying.current = player.playing;
        }}
        delayLongPress={250}
        onLongPress={() => {
          held.current = true;
          player.pause();
        }}
        onPressOut={() => {
          if (held.current && wasPlaying.current && activeRef.current)
            player.play();
        }}
        onPress={() => {
          if (held.current) return;
          const now = Date.now();
          if (now - lastTap.current < 300) {
            onLike();
            manualPause.current = false;
            player.play();
          } else {
            manualPause.current = player.playing;
            if (player.playing) player.pause();
            else player.play();
          }
          lastTap.current = now;
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : paused && active && !error ? (
          <Ionicons name="play" color="white" size={55} />
        ) : null}
      </Pressable>
      {error && (
        <Pressable
          onPress={() => setRetry((n) => n + 1)}
          style={{
            position: "absolute",
            top: "45%",
            alignSelf: "center",
            backgroundColor: "#222",
            padding: 20,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "white" }}>
            Couldn’t load this reel · Tap to retry
          </Text>
        </Pressable>
      )}
    </View>
  );
}
