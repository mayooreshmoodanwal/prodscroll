import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";
import { request } from "./client";
import { styles, colors, useAuth } from "./context";
import { Avatar, NativePost } from "./feed";
import type { Startup, Product, User, Post, Page } from "./types";
export function ExploreScreen() {
  const router = useRouter();
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [data, setData] = useState<{
      trending: Startup[];
      newProducts: Product[];
      categories: string[];
    } | null>(null),
    [result, setResult] = useState<{
      startups: Startup[];
      products: Product[];
      users: User[];
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    void request<typeof data>("/explore")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    let stopped = false;
    const timer = setTimeout(() => {
      if (!query && !category) {
        setResult(null);
        return;
      }
      void request<NonNullable<typeof result>>(
        `/search?q=${encodeURIComponent(query || category)}${category ? `&category=${encodeURIComponent(category)}` : ""}`,
      )
        .then((r) => {
          if (!stopped) setResult(r);
        })
        .catch((e) => setError(e.message));
    }, 300);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [query, category]);
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <View style={styles.section}>
        <Text style={styles.title}>Follow your curiosity.</Text>
        <Text style={[styles.subtitle, { marginTop: 10 }]}>
          Small teams. New ideas. Your next rabbit hole.
        </Text>
        <TextInput
          style={styles.input}
          accessibilityLabel="Search startups and people"
          placeholder="Startups, products, people…"
          value={query}
          onChangeText={setQuery}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 9, paddingTop: 16 }}
        >
          {["", ...(data?.categories || [])].map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, category === c && styles.selected]}
              onPress={() => setCategory(c)}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: category === c ? colors.accent : colors.muted,
                }}
              >
                {c || "All ideas"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.section}>
        <Text style={styles.h2}>
          {result ? "Your discoveries" : "On the rise"}
        </Text>
        {(result?.startups || data?.trending)?.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={{ marginTop: 24 }}
            onPress={() => router.push(`/startup/${s.slug}`)}
          >
            {s.coverUrl && (
              <Image
                source={{ uri: s.coverUrl }}
                style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 7 }}
              />
            )}
            <Text style={[styles.muted, { marginTop: 12 }]}>
              {s.category.toUpperCase()}
            </Text>
            <Text style={[styles.h2, { marginTop: 3 }]}>{s.name}</Text>
            <Text style={styles.muted}>{s.pitch}</Text>
          </TouchableOpacity>
        ))}
        {result?.users.map((u) => (
          <TouchableOpacity
            key={u.id}
            style={[styles.row, { paddingVertical: 18 }]}
            onPress={() => router.push(`/profile/${u.username}`)}
          >
            <Avatar user={u} />
            <View>
              <Text style={styles.body}>{u.displayName}</Text>
              <Text style={styles.muted}>@{u.username}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
export function ProfileScreen({ username }: { username?: string }) {
  const { user, requireAuth, logout } = useAuth();
  const router = useRouter();
  const name = username || user?.username;
  const [data, setData] = useState<{
      user: User;
      posts: Post[];
      startups: Startup[];
    } | null>(null),
    [error, setError] = useState("");
  const load = () => {
    if (name)
      void request<NonNullable<typeof data>>(`/users/${name}`)
        .then(setData)
        .catch((e) => setError(e.message));
  };
  useEffect(load, [name]);
  if (!name)
    return (
      <View style={[styles.page, styles.center]}>
        <Text style={styles.title}>Make it yours.</Text>
        <Text style={styles.subtitle}>
          Save good ideas and meet the people behind them.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requireAuth}>
          <Text style={styles.buttonText}>Join the conversation</Text>
        </TouchableOpacity>
      </View>
    );
  if (!data)
    return (
      <View style={styles.center}>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <ActivityIndicator color={colors.accent} />
        )}
      </View>
    );
  const own = user?.id === data.user.id;
  return (
    <FlatList
      style={styles.page}
      data={data.posts}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => <NativePost post={item} />}
      windowSize={5}
      ListHeaderComponent={
        <View style={styles.section}>
          <Avatar user={data.user} />
          <Text style={[styles.title, { marginTop: 15 }]}>
            {data.user.displayName}
          </Text>
          <Text style={styles.muted}>
            @{data.user.username} · {data.user.role.toLowerCase()}
          </Text>
          <Text style={[styles.body, { marginTop: 16 }]}>{data.user.bio}</Text>
          <Text style={[styles.muted, { marginTop: 15 }]}>
            {data.user.followerCount || 0} followers ·{" "}
            {data.user.followingCount || 0} following
          </Text>
          {own ? (
            <View style={{ gap: 8, marginTop: 20 }}>
              <TouchableOpacity onPress={() => router.push("/saved")}>
                <Text style={styles.link}>Saved products and posts ↗</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/notifications")}>
                <Text style={styles.link}>Your notifications ↗</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  void logout()
                    .then(() => setData(null))
                    .catch((e) => Alert.alert("Error", e.message))
                }
              >
                <Text style={styles.link}>Sign out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, { marginTop: 20 }]}
              onPress={() => {
                if (requireAuth())
                  void request(
                    `/users/${data.user.id}/follow`,
                    { following: true },
                    "PUT",
                  )
                    .then(() => {
                      load();
                      Alert.alert("Follow request saved");
                    })
                    .catch((e) => Alert.alert("Error", e.message));
              }}
            >
              <Text style={styles.buttonText}>Follow the journey</Text>
            </TouchableOpacity>
          )}
          {data.startups.map((s) => (
            <TouchableOpacity
              key={s.id}
              onPress={() => router.push(`/startup/${s.slug}`)}
            >
              <Text style={styles.link}>Building {s.name} ↗</Text>
            </TouchableOpacity>
          ))}
        </View>
      }
    />
  );
}
export function StartupScreen({ slug }: { slug: string }) {
  const { requireAuth } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<{ startup: Startup } | null>(null),
    [error, setError] = useState("");
  const load = () =>
    void request<{ startup: Startup }>(`/startups/${slug}`)
      .then(setData)
      .catch((e) => setError(e.message));
  useEffect(load, [slug]);
  if (!data)
    return (
      <View style={styles.center}>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <ActivityIndicator color={colors.accent} />
        )}
      </View>
    );
  const s = data.startup;
  return (
    <FlatList
      style={styles.page}
      data={s.posts}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => <NativePost post={item} />}
      windowSize={5}
      ListHeaderComponent={
        <>
          {s.coverUrl && (
            <Image
              source={{ uri: s.coverUrl }}
              style={{ width: "100%", aspectRatio: 4 / 3 }}
            />
          )}
          <View style={styles.section}>
            <Text style={styles.muted}>{s.category.toUpperCase()}</Text>
            <Text style={[styles.title, { marginTop: 8 }]}>{s.name}</Text>
            <Text style={[styles.subtitle, { marginTop: 8 }]}>{s.pitch}</Text>
            <Text style={styles.body}>{s.description}</Text>
            <TouchableOpacity
              style={[styles.button, { marginTop: 22 }]}
              onPress={() => {
                if (requireAuth())
                  void request(
                    `/startups/${s.id}/follow`,
                    { following: !s.following },
                    "PUT",
                  )
                    .then(load)
                    .catch((e) => Alert.alert("Error", e.message));
              }}
            >
              <Text style={styles.buttonText}>
                {s.following ? "Following" : "Follow the journey"} ·{" "}
                {s.followerCount}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.section}>
            <Text style={styles.h2}>What they’re building</Text>
            {s.products?.map((p) => (
              <View key={p.id} style={{ marginTop: 20 }}>
                <Text style={{ fontWeight: "600", color: colors.text }}>
                  {p.name}
                </Text>
                <Text style={styles.muted}>{p.description}</Text>
                <Text style={styles.muted}>{p.status.toLowerCase()}</Text>
              </View>
            ))}
          </View>
          <View style={styles.section}>
            <Text style={styles.h2}>The people behind it</Text>
            {s.team?.map((u) => (
              <TouchableOpacity
                style={[styles.row, { marginTop: 17 }]}
                key={u.id}
                onPress={() => router.push(`/profile/${u.username}`)}
              >
                <Avatar user={u} />
                <Text style={styles.body}>{u.displayName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      }
    />
  );
}
export function CreateScreen() {
  const { user, requireAuth } = useAuth();
  const [caption, setCaption] = useState(""),
    [kind, setKind] = useState("POST"),
    [startups, setStartups] = useState<Startup[]>([]),
    [startupId, setStartupId] = useState<string | undefined>(),
    [media, setMedia] = useState<{
      id: string;
      uri: string;
      ready: boolean;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState("");
  useEffect(() => {
    void AsyncStorage.getItem("ps.mobile.draft").then((value) => {
      if (value) setCaption(value);
    });
    if (user)
      void request<{ items: Startup[] }>("/founder/startups")
        .then((r) => setStartups(r.items))
        .catch(() => undefined);
  }, [user?.id]);
  async function pick() {
    if (!requireAuth()) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.9,
      videoMaxDuration: 180,
    });
    if (result.canceled) return;
    setBusy(true);
    setStatus("Uploading…");
    try {
      const asset = result.assets[0];
      const file = new File(asset.uri);
      const upload = await request<{
        assetId: string;
        uploadUrl: string;
        headers: Record<string, string>;
      }>("/media/upload-url", {
        filename: asset.fileName || "product-media",
        mimeType:
          asset.mimeType ||
          (asset.type === "video" ? "video/mp4" : "image/jpeg"),
        size: file.size,
      });
      setMedia({ id: upload.assetId, uri: asset.uri, ready: false });
      const response = await expoFetch(upload.uploadUrl, {
        method: "PUT",
        headers: upload.headers,
        body: file,
      });
      if (!response.ok) throw new Error("Upload failed. Your draft is safe.");
      await request(`/media/${upload.assetId}/complete`, {});
      setStatus("Processing in the background…");
      for (let attempt = 0; attempt < 240; attempt++) {
        const { media } = await request<{
          media: { processingStatus: string };
        }>(`/media/${upload.assetId}`);
        if (media.processingStatus === "READY") {
          setMedia({ id: upload.assetId, uri: asset.uri, ready: true });
          setStatus("Ready to publish");
          return;
        }
        if (media.processingStatus === "FAILED")
          throw new Error("Media processing failed. Choose a different file.");
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
      throw new Error("Processing is taking longer than expected.");
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    if (!requireAuth() || !caption.trim()) return;
    setBusy(true);
    try {
      await request("/posts", {
        caption,
        kind,
        startupId,
        mediaIds: media?.ready ? [media.id] : [],
        tags: [],
      });
      setCaption("");
      setMedia(null);
      setStatus("");
      await AsyncStorage.removeItem("ps.mobile.draft");
      Alert.alert("Your update is out in the world.");
    } catch (e) {
      Alert.alert("Could not publish", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.form}>
      <Text style={styles.title}>The work is worth sharing.</Text>
      <Text style={styles.subtitle}>
        A first sketch. A small win. Something ready for the world.
      </Text>
      <View style={styles.row}>
        {["POST", "REEL", "UPDATE"].map((k) => (
          <TouchableOpacity
            key={k}
            style={[styles.chip, kind === k && styles.selected]}
            onPress={() => setKind(k)}
          >
            <Text style={{ color: kind === k ? colors.accent : colors.muted }}>
              {k.toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        accessibilityLabel="Post caption"
        style={[styles.input, { minHeight: 160, textAlignVertical: "top" }]}
        value={caption}
        onChangeText={(text) => {
          setCaption(text);
          void AsyncStorage.setItem("ps.mobile.draft", text);
        }}
        multiline
        maxLength={5000}
        placeholder="Tell us what’s new. The messy middle is welcome, too."
      />
      <Text style={styles.muted}>Draft saved on this device.</Text>
      <TouchableOpacity
        style={[styles.chip, { alignItems: "center", padding: 25, gap: 10 }]}
        onPress={() => void pick()}
        disabled={busy}
      >
        <Ionicons name="cloud-upload-outline" size={32} color={colors.muted} />
        <Text style={styles.body}>
          {media ? "Replace media" : "Add an image or product demo"}
        </Text>
      </TouchableOpacity>
      {status && <Text style={styles.muted}>{status}</Text>}
      {startups.length > 0 && (
        <>
          <Text style={styles.body}>Post as</Text>
          <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>
            {[{ id: "", name: "Myself" }, ...startups].map((s) => (
              <TouchableOpacity
                style={[
                  styles.chip,
                  (startupId || "") === s.id && styles.selected,
                ]}
                key={s.id}
                onPress={() => setStartupId(s.id || undefined)}
              >
                <Text>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}
      <TouchableOpacity
        style={[styles.button, (busy || !caption) && { opacity: 0.5 }]}
        disabled={busy || !caption || (!!media && !media.ready)}
        onPress={() => void publish()}
      >
        <Text style={styles.buttonText}>
          {busy ? "One moment…" : "Publish update"}
        </Text>
      </TouchableOpacity>
      {!user && (
        <TouchableOpacity onPress={requireAuth}>
          <Text style={styles.link}>Sign in to share your work</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
export function NotificationsScreen() {
  const { user, requireAuth } = useAuth();
  const [items, setItems] = useState<
      { id: string; body: string; createdAt: string; readAt?: string }[]
    >([]),
    [error, setError] = useState("");
  useEffect(() => {
    if (user)
      void request<Page<(typeof items)[0]>>("/notifications")
        .then((r) => setItems(r.items))
        .catch((e) => setError(e.message));
  }, [user?.id]);
  if (!user)
    return (
      <View style={styles.center}>
        <TouchableOpacity onPress={requireAuth}>
          <Text style={styles.link}>Sign in for your notifications</Text>
        </TouchableOpacity>
      </View>
    );
  return (
    <FlatList
      style={styles.page}
      data={items}
      keyExtractor={(n) => n.id}
      ListHeaderComponent={
        <View style={styles.section}>
          <Text style={styles.title}>You’re part of something.</Text>
          <TouchableOpacity
            onPress={() =>
              void request("/notifications/read", {}, "PUT")
                .then(() =>
                  setItems((list) =>
                    list.map((n) => ({
                      ...n,
                      readAt: new Date().toISOString(),
                    })),
                  ),
                )
                .catch((e) => Alert.alert("Error", e.message))
            }
          >
            <Text style={styles.link}>Mark all read</Text>
          </TouchableOpacity>
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      }
      renderItem={({ item }) => (
        <View
          style={[
            styles.section,
            !item.readAt && { backgroundColor: colors.olive },
          ]}
        >
          <Text style={styles.body}>{item.body}</Text>
          <Text style={styles.muted}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      )}
      ListEmptyComponent={
        <Text style={[styles.muted, { padding: 25 }]}>
          All quiet for now. Your community updates will appear here.
        </Text>
      }
    />
  );
}
