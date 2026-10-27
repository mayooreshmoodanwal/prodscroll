import { useMediaSource } from "./media-source";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type ViewToken,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { request, track } from "./client";
import { colors, styles, useAuth } from "./context";
import type { Post, Page, Media, User } from "./types";
export function Avatar({ user }: { user: User }) {
  return (
    <View style={styles.avatar}>
      {user.avatarUrl ? (
        <Image
          source={{ uri: user.avatarUrl }}
          style={{ width: 39, height: 39, borderRadius: 20 }}
        />
      ) : (
        <Text style={styles.avatarText}>
          {user.displayName
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")}
        </Text>
      )}
    </View>
  );
}
function NativeVideo({
  media,
  active,
  postId,
}: {
  media: Media;
  active: boolean;
  postId: string;
}) {
  const source = useMediaSource(media, active);
  const player = useVideoPlayer(
    active
      ? { uri: source, useCaching: !source.split("?")[0].endsWith(".m3u8") }
      : null,
    (p) => {
      p.loop = true;
      p.muted = true;
      p.timeUpdateEventInterval = 1;
    },
  );
  useEffect(() => {
    if (active) {
      player.play();
      track("VIDEO_START", postId);
    } else player.pause();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") player.pause();
    });
    return () => subscription.remove();
  }, [active, player, postId]);
  useEffect(() => {
    const milestones = new Set<number>();
    const listener = player.addListener("timeUpdate", ({ currentTime }) => {
      if (!player.duration) return;
      for (const point of [25, 50, 75, 95] as const)
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
    });
    return () => listener.remove();
  }, [player, postId]);
  return active ? (
    <VideoView
      player={player}
      nativeControls
      contentFit="contain"
      style={{ width: "100%", aspectRatio: 4 / 3, backgroundColor: "#252925" }}
    />
  ) : (
    <Image
      source={{ uri: media.thumbnailUrl }}
      style={{ width: "100%", aspectRatio: 4 / 3 }}
    />
  );
}
interface Comment {
  id: string;
  body: string;
  author: User;
  parentId?: string;
}
export function NativePost({
  post: initial,
  active = false,
  reel = false,
}: {
  post: Post;
  active?: boolean;
  reel?: boolean;
}) {
  const [post, setPost] = useState(initial),
    [busy, setBusy] = useState(false),
    [comments, setComments] = useState<Comment[] | null>(null),
    [comment, setComment] = useState(""),
    [reply, setReply] = useState<string | undefined>();
  const { requireAuth } = useAuth();
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  async function toggle(kind: "like" | "save") {
    if (!requireAuth() || busy) return;
    const before = post;
    const value = kind === "like" ? !post.liked : !post.saved;
    setPost({
      ...post,
      ...(kind === "like"
        ? { liked: value, likeCount: post.likeCount + (value ? 1 : -1) }
        : { saved: value, saveCount: post.saveCount + (value ? 1 : -1) }),
    });
    setBusy(true);
    try {
      await request(
        `/posts/${post.id}/${kind}`,
        { [kind === "like" ? "liked" : "saved"]: value },
        "PUT",
      );
    } catch (e) {
      setPost(before);
      Alert.alert("Could not save that change", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <View
      style={[
        {
          borderBottomWidth: 1,
          borderColor: colors.border,
          paddingTop: 20,
          paddingBottom: 22,
        },
        reel && { minHeight: height - 140 },
      ]}
    >
      <View style={[styles.row, { paddingHorizontal: 20 }]}>
        <TouchableOpacity
          accessibilityLabel={`Open ${post.author.displayName} profile`}
          onPress={() => router.push(`/profile/${post.author.username}`)}
        >
          <Avatar user={post.author} />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() =>
            post.startup
              ? router.push(`/startup/${post.startup.slug}`)
              : router.push(`/profile/${post.author.username}`)
          }
        >
          <Text style={{ fontWeight: "600", fontSize: 14, color: colors.text }}>
            {post.startup?.name || post.author.displayName}
          </Text>
          <Text style={styles.muted}>{post.author.displayName} · Founder</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="Post options"
          onPress={() =>
            Alert.alert("This update", "Choose an action", [
              {
                text: "Not interested",
                onPress: () => {
                  if (requireAuth()) track("NOT_INTERESTED", post.id);
                },
              },
              {
                text: "Report spam",
                onPress: () => {
                  if (requireAuth())
                    void request("/reports", {
                      postId: post.id,
                      reason: "spam",
                    })
                      .then(() => Alert.alert("Report submitted"))
                      .catch((e) => Alert.alert("Error", e.message));
                },
              },
              { text: "Cancel", style: "cancel" },
            ])
          }
        >
          <Ionicons name="ellipsis-horizontal" size={22} />
        </TouchableOpacity>
      </View>
      <Text
        style={[styles.body, { padding: 20, paddingTop: 15, fontSize: 13 }]}
      >
        {post.caption}
      </Text>
      {post.media[0] &&
        (post.media[0].mediaType === "VIDEO" ? (
          <NativeVideo media={post.media[0]} active={active} postId={post.id} />
        ) : (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {post.media.map((m) => (
              <Image
                key={m.id}
                source={{ uri: m.url }}
                style={{ width: Math.min(width, 700), aspectRatio: 4 / 3 }}
              />
            ))}
          </ScrollView>
        ))}
      <View
        style={[styles.row, { paddingHorizontal: 20, paddingTop: 14, gap: 22 }]}
      >
        <TouchableOpacity
          style={styles.row}
          accessibilityLabel={post.liked ? "Unlike post" : "Like post"}
          onPress={() => void toggle("like")}
        >
          <Ionicons
            name={post.liked ? "heart" : "heart-outline"}
            color={post.liked ? "#c35d4b" : colors.text}
            size={25}
          />
          <Text style={styles.muted}>{post.likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          accessibilityLabel="Comments"
          onPress={() =>
            void request<Page<Comment>>(`/posts/${post.id}/comments`)
              .then((r) => setComments(r.items))
              .catch((e) => Alert.alert("Error", e.message))
          }
        >
          <Ionicons name="chatbubble-outline" size={23} color={colors.text} />
          <Text style={styles.muted}>{post.commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="Share post"
          onPress={() => {
            track("SHARE", post.id);
            void Share.share({
              message: `${post.caption}\n${process.env.EXPO_PUBLIC_WEB_URL || "http://localhost:3000"}/post/${post.id}`,
            });
          }}
        >
          <Ionicons name="paper-plane-outline" size={23} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          accessibilityLabel={post.saved ? "Unsave post" : "Save post"}
          onPress={() => void toggle("save")}
        >
          <Ionicons
            name={post.saved ? "bookmark" : "bookmark-outline"}
            size={24}
            color={post.saved ? colors.accent : colors.text}
          />
        </TouchableOpacity>
      </View>
      <View style={[styles.chips, { paddingHorizontal: 20, paddingTop: 14 }]}>
        {post.tags.map((t) => (
          <Text
            key={t}
            style={{
              fontSize: 10,
              color: colors.muted,
              backgroundColor: colors.olive,
              padding: 5,
              borderRadius: 3,
            }}
          >
            {t}
          </Text>
        ))}
      </View>
      <Modal
        visible={comments !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setComments(null)}
      >
        <View style={[styles.page, { padding: 23, paddingTop: 35 }]}>
          <View style={[styles.row, { justifyContent: "space-between" }]}>
            <Text style={styles.h2}>The conversation</Text>
            <TouchableOpacity onPress={() => setComments(null)}>
              <Text style={styles.link}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }}>
            {comments?.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={{
                  paddingVertical: 18,
                  paddingLeft: c.parentId ? 22 : 0,
                  borderBottomWidth: 1,
                  borderColor: colors.border,
                }}
                onPress={() => setReply(c.id)}
              >
                <Text style={{ fontWeight: "600", marginBottom: 5 }}>
                  {c.author.displayName}
                </Text>
                <Text style={styles.body}>{c.body}</Text>
                <Text style={styles.link}>Reply</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {reply && (
            <TouchableOpacity onPress={() => setReply(undefined)}>
              <Text style={styles.link}>Replying · Cancel</Text>
            </TouchableOpacity>
          )}
          <TextInput
            accessibilityLabel="Comment"
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="Add something thoughtful…"
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.button, { marginTop: 12 }]}
            onPress={() => {
              if (!requireAuth() || !comment.trim()) return;
              void request<{ comment: Comment }>(`/posts/${post.id}/comments`, {
                body: comment,
                parentId: reply,
              })
                .then((r) => {
                  setComments((list) => [r.comment, ...(list || [])]);
                  setComment("");
                  setReply(undefined);
                  setPost((p) => ({ ...p, commentCount: p.commentCount + 1 }));
                })
                .catch((e) => Alert.alert("Error", e.message));
            }}
          >
            <Text style={styles.buttonText}>Send comment</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
export function FeedScreen({
  initialMode = "for-you",
}: {
  initialMode?: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState(initialMode),
    [items, setItems] = useState<Post[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [more, setMore] = useState(true),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [activeId, setActiveId] = useState(""),
    [offline, setOffline] = useState(false);
  const busy = useRef(false);
  const cache = `ps.feed.${user?.id || "guest"}.${mode}`;
  const load = useCallback(
    async (reset = false) => {
      if (busy.current) return;
      busy.current = true;
      setLoading(true);
      setError("");
      try {
        const page = await request<Page<Post>>(
          `${mode === "saved" ? "/saves" : `/feed?mode=${mode}`}${!reset && cursor ? `${mode === "saved" ? "?" : "&"}cursor=${cursor}` : ""}`,
        );
        setItems((previous) =>
          reset
            ? page.items
            : [
                ...previous,
                ...page.items.filter(
                  (p) => !previous.some((i) => i.id === p.id),
                ),
              ],
        );
        setCursor(page.nextCursor);
        setMore(page.hasMore);
        setOffline(false);
        if (reset)
          await AsyncStorage.setItem(
            cache,
            JSON.stringify(page.items.slice(0, 15)),
          );
      } catch (e) {
        setError((e as Error).message);
        const cached = await AsyncStorage.getItem(cache);
        if (cached && reset) {
          setItems(JSON.parse(cached) as Post[]);
          setOffline(true);
        }
      } finally {
        busy.current = false;
        setLoading(false);
      }
    },
    [mode, cursor, cache],
  );
  useEffect(() => {
    setCursor(null);
    setItems([]);
    setMore(true);
    void load(true);
  }, [mode, user?.id]);
  const onViewable = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<Post>[] }) => {
      const first = viewableItems[0]?.item;
      if (first) {
        setActiveId(first.id);
        track("FEED_IMPRESSION", first.id);
      }
    },
  ).current;
  return (
    <View style={styles.page}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NativePost
            post={item}
            active={item.id === activeId}
            reel={mode === "reels"}
          />
        )}
        windowSize={5}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        removeClippedSubviews={true}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 65 }}
        onEndReached={() => {
          if (more && !loading && !error) void load();
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={loading && items.length > 0}
            onRefresh={() => void load(true)}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={
          <View style={styles.section}>
            <View style={[styles.row, { justifyContent: "space-between" }]}>
              <Text style={styles.title}>
                {mode === "reels"
                  ? "Ideas in motion."
                  : mode === "saved"
                    ? "Keep the good stuff."
                    : "The future, in progress."}
              </Text>
              <TouchableOpacity
                accessibilityLabel="Notifications"
                onPress={() => router.push("/notifications")}
              >
                <Ionicons name="notifications-outline" size={23} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.subtitle, { marginTop: 8 }]}>
              Discover what people are building.
            </Text>
            {initialMode === "for-you" && (
              <View style={[styles.row, { gap: 23 }]}>
                {[
                  ["for-you", "For you"],
                  ["following", "Following"],
                  ["reels", "Reels"],
                ].map(([value, label]) => (
                  <TouchableOpacity
                    key={value}
                    onPress={() =>
                      value === "reels" ? router.push("/reels") : setMode(value)
                    }
                  >
                    <Text
                      style={{
                        color: mode === value ? colors.accent : colors.muted,
                        fontWeight: mode === value ? "600" : "400",
                        paddingVertical: 8,
                      }}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {offline && (
              <Text style={styles.muted}>
                Offline · Showing your cached feed
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.center}>
              <Text style={styles.body}>
                {error ||
                  "Your circle starts here. Follow a startup to see their updates."}
              </Text>
              <TouchableOpacity onPress={() => void load(true)}>
                <Text style={styles.link}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading ? (
            <ActivityIndicator color={colors.accent} style={{ padding: 25 }} />
          ) : error && items.length > 0 ? (
            <TouchableOpacity onPress={() => void load(true)}>
              <Text style={styles.error}>{error} · Retry</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}
