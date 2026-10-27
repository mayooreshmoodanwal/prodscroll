import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewToken,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { request, track } from "./client";
import { styles, useAuth } from "./context";
import { NativeReelPlayer } from "./reel-player";
import type { Comment, Page, Post } from "./types";

function ReelComments({
  post,
  close,
  onAdd,
}: {
  post: Post;
  close: () => void;
  onAdd: () => void;
}) {
  const [items, setItems] = useState<Comment[]>([]),
    [body, setBody] = useState(""),
    [reply, setReply] = useState<string>(),
    [cursor, setCursor] = useState<string | null>(null),
    [more, setMore] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const { requireAuth } = useAuth();
  async function load(reset = false) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await request<Page<Comment>>(
        `/posts/${post.id}/comments${!reset && cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
      );
      setItems((old) => (reset ? result.items : [...old, ...result.items]));
      setCursor(result.nextCursor);
      setMore(result.hasMore);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    void load(true);
  }, [post.id]);
  async function send() {
    if (!requireAuth() || !body.trim() || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const result = await request<{ comment: Comment }>(
        `/posts/${post.id}/comments`,
        { body, parentId: reply },
      );
      setItems((old) => [result.comment, ...old]);
      setBody("");
      setReply(undefined);
      onAdd();
      track("COMMENT", post.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <View
        style={[
          styles.page,
          { padding: 22, paddingTop: 35, paddingBottom: 30 },
        ]}
      >
        <View
          style={[
            styles.row,
            { justifyContent: "space-between", marginBottom: 16 },
          ]}
        >
          <Text style={styles.h2}>The conversation</Text>
          <Pressable accessibilityRole="button" onPress={close}>
            <Text style={styles.link}>Close</Text>
          </Pressable>
        </View>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setReply(item.id)}
              style={{
                paddingVertical: 16,
                paddingLeft: item.parentId ? 20 : 0,
              }}
            >
              <Text style={{ fontWeight: "600" }}>
                {item.author.displayName}
              </Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.link}>Reply</Text>
            </Pressable>
          )}
          onEndReached={() => {
            if (more && !busy && !error) void load();
          }}
          ListEmptyComponent={
            !busy ? (
              <Text style={styles.muted}>Start a thoughtful conversation.</Text>
            ) : null
          }
        />
        {busy && <ActivityIndicator />}
        {!!error && (
          <Pressable onPress={() => void load(items.length === 0)}>
            <Text style={styles.error}>{error} · Retry</Text>
          </Pressable>
        )}
        {reply && (
          <Pressable onPress={() => setReply(undefined)}>
            <Text style={styles.link}>Replying · Cancel</Text>
          </Pressable>
        )}
        <TextInput
          accessibilityLabel="Comment"
          value={body}
          onChangeText={setBody}
          placeholder="Add something thoughtful…"
          maxLength={2000}
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          disabled={busy || !body.trim()}
          onPress={() => void send()}
          style={[styles.button, { marginTop: 12 }]}
        >
          <Text style={styles.buttonText}>Send comment</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function Reel({
  post,
  height,
  active,
  nearby,
  muted,
  onMute,
  update,
}: {
  post: Post;
  height: number;
  active: boolean;
  nearby: boolean;
  muted: boolean;
  onMute: () => void;
  update: (post: Post) => void;
}) {
  const [comments, setComments] = useState(false),
    [expanded, setExpanded] = useState(false);
  const busy = useRef(false);
  const { requireAuth, user } = useAuth();
  const router = useRouter();
  const media = post.media.find((m) => m.mediaType === "VIDEO");
  async function toggle(kind: "like" | "save", force?: boolean) {
    if (!requireAuth() || busy.current) return;
    const value = force ?? !(kind === "like" ? post.liked : post.saved);
    if (kind === "like" && value === post.liked) return;
    busy.current = true;
    update({
      ...post,
      ...(kind === "like"
        ? { liked: value, likeCount: post.likeCount + (value ? 1 : -1) }
        : { saved: value }),
    });
    try {
      await request(
        `/posts/${post.id}/${kind}`,
        { [kind === "like" ? "liked" : "saved"]: value },
        "PUT",
      );
      track(
        kind === "like"
          ? value
            ? "LIKE"
            : "UNLIKE"
          : value
            ? "SAVE"
            : "UNSAVE",
        post.id,
      );
    } catch (e) {
      update(post);
      Alert.alert("Could not save change", (e as Error).message);
    } finally {
      busy.current = false;
    }
  }
  async function follow() {
    if (!post.startup || !requireAuth() || busy.current) return;
    busy.current = true;
    const following = !post.startup.following;
    update({ ...post, startup: { ...post.startup, following } });
    try {
      await request(
        `/startups/${post.startup.id}/follow`,
        { following },
        "PUT",
      );
      track(following ? "FOLLOW" : "UNFOLLOW", post.id);
    } catch (e) {
      update(post);
      Alert.alert("Could not follow", (e as Error).message);
    } finally {
      busy.current = false;
    }
  }
  return (
    <View
      style={{ height, backgroundColor: "#171b19" }}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? "auto" : "no-hide-descendants"}
    >
      {media && nearby ? (
        <NativeReelPlayer
          media={media}
          postId={post.id}
          active={active && !comments}
          muted={muted}
          onLike={() => void toggle("like", true)}
        />
      ) : media?.thumbnailUrl ? (
        <Image
          source={{ uri: media.thumbnailUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
        />
      ) : null}
      <View pointerEvents="box-none" style={s.top}>
        <Text style={s.white}>Product reels · For you</Text>
        <Pressable
          accessibilityLabel={muted ? "Unmute reel" : "Mute reel"}
          onPress={onMute}
          style={s.sound}
        >
          <Ionicons
            color="white"
            name={muted ? "volume-mute" : "volume-high"}
            size={22}
          />
        </Pressable>
      </View>
      <View style={s.caption}>
        <View style={[styles.row, { flexWrap: "wrap", gap: 10 }]}>
          <Pressable
            onPress={() =>
              router.push(
                post.startup
                  ? `/startup/${post.startup.slug}`
                  : `/profile/${post.author.username}`,
              )
            }
          >
            <Text style={[s.white, { fontWeight: "700" }]}>
              {post.startup?.name || post.author.displayName}
              {post.startup?.verified ? " ✓" : ""}
            </Text>
          </Pressable>
          {post.startup && post.author.id !== user?.id && (
            <Pressable onPress={() => void follow()} style={s.follow}>
              <Text style={[s.white, { fontSize: 12 }]}>
                {post.startup.following ? "Following" : "Follow"}
              </Text>
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={() => router.push(`/profile/${post.author.username}`)}
        >
          <Text style={s.small}>
            Built by {post.author.displayName} ·{" "}
            {post.startup?.category || post.tags[0]}
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Expand reel description"
          onPress={() => setExpanded(!expanded)}
        >
          <Text
            numberOfLines={expanded ? 8 : 3}
            style={[s.white, { fontSize: 13, lineHeight: 20 }]}
          >
            {post.caption}
          </Text>
        </Pressable>
        {post.product && (
          <Pressable
            onPress={() => router.push(`/product/${post.product!.slug}`)}
            style={s.product}
          >
            <Text style={[s.white, { fontSize: 12 }]}>
              {post.product.name} ↗
            </Text>
          </Pressable>
        )}
      </View>
      <View style={s.actions}>
        <Pressable
          accessibilityLabel={post.liked ? "Unlike reel" : "Like reel"}
          onPress={() => void toggle("like")}
          style={s.action}
        >
          <Ionicons
            name={post.liked ? "heart" : "heart-outline"}
            color={post.liked ? "#f16b76" : "white"}
            size={29}
          />
          <Text style={s.count}>{post.likeCount || "Like"}</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Reel comments"
          onPress={() => setComments(true)}
          style={s.action}
        >
          <Ionicons name="chatbubble-outline" color="white" size={27} />
          <Text style={s.count}>{post.commentCount || "Discuss"}</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={post.saved ? "Unsave reel" : "Save reel"}
          onPress={() => void toggle("save")}
          style={s.action}
        >
          <Ionicons
            name={post.saved ? "bookmark" : "bookmark-outline"}
            color="white"
            size={27}
          />
          <Text style={s.count}>{post.saved ? "Saved" : "Save"}</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Share reel"
          style={s.action}
          onPress={() => {
            void Share.share({
              message: `${process.env.EXPO_PUBLIC_WEB_URL || "http://localhost:3000"}/post/${post.id}`,
            })
              .then((r) => {
                if (r.action === Share.sharedAction) track("SHARE", post.id);
              })
              .catch((e) => Alert.alert("Could not share", e.message));
          }}
        >
          <Ionicons name="paper-plane-outline" color="white" size={27} />
          <Text style={s.count}>Share</Text>
        </Pressable>
      </View>
      {comments && (
        <ReelComments
          post={post}
          close={() => setComments(false)}
          onAdd={() => update({ ...post, commentCount: post.commentCount + 1 })}
        />
      )}
    </View>
  );
}

export function ReelsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<Post[]>([]),
    [active, setActive] = useState(0),
    [height, setHeight] = useState(0),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [muted, setMuted] = useState(true),
    [focused, setFocused] = useState(true);
  const itemsRef = useRef<Post[]>([]),
    busy = useRef(false),
    version = useRef(0),
    list = useRef<FlatList<Post>>(null);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  useEffect(() => {
    void AsyncStorage.getItem("ps.reels.muted").then((value) =>
      setMuted(value !== "false"),
    );
  }, []);
  const load = useCallback(async (reset = false) => {
    if (busy.current && !reset) return;
    const run = reset ? ++version.current : version.current;
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      const seen = reset ? [] : itemsRef.current.slice(-40).map((p) => p.id);
      const batch = await request<Page<Post>>(
        `/reels${seen.length ? `?seen=${encodeURIComponent(seen.join(","))}` : ""}`,
      );
      if (run !== version.current) return;
      itemsRef.current = reset
        ? batch.items
        : [...itemsRef.current, ...batch.items];
      setItems(itemsRef.current);
      if (!batch.items.length)
        setError("No reels are available right now. Tap to retry.");
    } catch (e) {
      if (run === version.current) setError((e as Error).message);
    } finally {
      if (run === version.current) {
        busy.current = false;
        setLoading(false);
      }
    }
  }, []);
  useEffect(() => {
    itemsRef.current = [];
    setItems([]);
    setActive(0);
    list.current?.scrollToOffset({ offset: 0, animated: false });
    void load(true);
    return () => {
      version.current++;
    };
  }, [user?.id, load]);
  useEffect(() => {
    if (items.length && active >= items.length - 4 && !loading && !error)
      void load();
  }, [active, items.length, loading, error, load]);
  const onViewable = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<Post>[] }) => {
      const index = viewableItems[0]?.index;
      if (index !== null && index !== undefined) setActive(index);
    },
  ).current;
  function update(post: Post) {
    itemsRef.current = itemsRef.current.map((item) =>
      item.id === post.id
        ? post
        : item.startup && item.startup.id === post.startup?.id
          ? {
              ...item,
              startup: { ...item.startup, following: post.startup.following },
            }
          : item,
    );
    setItems(itemsRef.current);
  }
  return (
    <View
      style={{ flex: 1, backgroundColor: "#171b19" }}
      onLayout={(event) => {
        const next = event.nativeEvent.layout.height;
        setHeight(next);
        list.current?.scrollToOffset({
          offset: active * next,
          animated: false,
        });
      }}
    >
      {height > 0 && (
        <FlatList
          ref={list}
          data={items}
          extraData={{ active, muted, focused, height }}
          keyExtractor={(item, index) => `${index}:${item.id}`}
          renderItem={({ item, index }) => (
            <Reel
              post={item}
              height={height}
              active={index === active && focused}
              nearby={Math.abs(index - active) <= 1}
              muted={muted}
              update={update}
              onMute={() => {
                setMuted(!muted);
                void AsyncStorage.setItem("ps.reels.muted", String(!muted));
              }}
            />
          )}
          pagingEnabled
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          showsVerticalScrollIndicator={false}
          windowSize={5}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          removeClippedSubviews
          getItemLayout={(_, index) => ({
            length: height,
            offset: height * index,
            index,
          })}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          ListEmptyComponent={
            <View
              style={{
                height,
                alignItems: "center",
                justifyContent: "center",
                padding: 30,
              }}
            >
              <Text style={s.white}>Product reels</Text>
              {loading ? (
                <ActivityIndicator color="white" style={{ marginTop: 20 }} />
              ) : (
                <Pressable onPress={() => void load(true)}>
                  <Text style={[s.white, { marginTop: 20 }]}>
                    {error || "Find your next discovery · Tap to retry"}
                  </Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}
      {items.length > 0 && (loading || error) && (
        <Pressable
          disabled={loading}
          onPress={() => void load()}
          style={{
            position: "absolute",
            top: 68,
            alignSelf: "center",
            padding: 10,
            backgroundColor: "#242923dd",
            borderRadius: 6,
          }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={s.white}>{error} · Retry</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  white: { color: "white" },
  top: {
    position: "absolute",
    top: 18,
    left: 18,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sound: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: "#0005",
  },
  caption: {
    position: "absolute",
    bottom: 22,
    left: 16,
    right: 75,
    backgroundColor: "#0006",
    padding: 10,
    borderRadius: 8,
  },
  small: { color: "#ffffffb0", fontSize: 11, marginVertical: 9 },
  follow: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#ffffffaa",
    borderRadius: 4,
  },
  product: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "#ffffff22",
    padding: 8,
    borderRadius: 5,
  },
  actions: { position: "absolute", right: 12, bottom: 25, gap: 18 },
  action: {
    width: 45,
    minHeight: 49,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  count: { color: "white", fontSize: 10, fontWeight: "600" },
});
