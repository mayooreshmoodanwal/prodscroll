import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { request, API_URL } from "./client";
import { styles, colors, useAuth } from "./context";
import { Avatar } from "./feed";
import type { Conversation, Message, Page, User } from "./types";
export function MessagesScreen() {
  const { user, requireAuth } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]),
    [selected, setSelected] = useState<Conversation | null>(null),
    [messages, setMessages] = useState<Message[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [body, setBody] = useState(""),
    [search, setSearch] = useState(""),
    [people, setPeople] = useState<User[]>([]),
    [error, setError] = useState(""),
    [sending, setSending] = useState(false);
  const socket = useRef<WebSocket | null>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const load = () =>
    void request<{ items: Conversation[] }>("/conversations")
      .then((r) => setConversations(r.items))
      .catch((e) => setError(e.message));
  useEffect(() => {
    if (!user) return;
    load();
    let stop = false;
    let reconnect: ReturnType<typeof setTimeout>;
    const connect = async () => {
      try {
        const { ticket } = await request<{ ticket: string }>(
          "/auth/ws-ticket",
          {},
        );
        if (stop) return;
        const ws = new WebSocket(
          `${API_URL.replace(/^http/, "ws")}/ws?ticket=${ticket}`,
        );
        socket.current = ws;
        ws.onmessage = (event) => {
          const data = JSON.parse(String(event.data)) as {
            type: string;
            conversationId?: string;
            message?: Message;
            userId?: string;
          };
          if (data.type === "message" && data.message) {
            load();
            if (selectedRef.current?.id === data.conversationId) {
              const message = data.message;
              setMessages((list) => [
                message,
                ...list.filter((m) => m.id !== message.id),
              ]);
              void request(
                `/conversations/${data.conversationId}/read`,
                {},
              ).catch(() => undefined);
            }
          }
          if (
            data.type === "read" &&
            data.userId &&
            selectedRef.current?.id === data.conversationId
          ) {
            const id = data.userId;
            setMessages((list) =>
              list.map((m) => ({
                ...m,
                readBy: [...new Set([...m.readBy, id])],
              })),
            );
          }
        };
        ws.onclose = () => {
          if (!stop) reconnect = setTimeout(() => void connect(), 3000);
        };
      } catch {
        if (!stop) reconnect = setTimeout(() => void connect(), 10000);
      }
    };
    void connect();
    return () => {
      stop = true;
      clearTimeout(reconnect);
      socket.current?.close();
    };
  }, [user?.id]);
  useEffect(() => {
    if (!selected) return;
    setMessages([]);
    void request<Page<Message>>(`/conversations/${selected.id}/messages`)
      .then((r) => {
        setMessages(r.items);
        setCursor(r.nextCursor);
        return request(`/conversations/${selected.id}/read`, {});
      })
      .catch((e) => setError(e.message));
  }, [selected?.id]);
  useEffect(() => {
    if (search.length < 2) {
      setPeople([]);
      return;
    }
    const timer = setTimeout(
      () =>
        void request<{ users: User[] }>(
          `/search?q=${encodeURIComponent(search)}&type=people`,
        )
          .then((r) => setPeople(r.users.filter((u) => u.id !== user?.id)))
          .catch((e) => setError(e.message)),
      300,
    );
    return () => clearTimeout(timer);
  }, [search]);
  async function send() {
    if (!selected || !body.trim()) return;
    setSending(true);
    try {
      const { message } = await request<{ message: Message }>(
        `/conversations/${selected.id}/messages`,
        { body },
      );
      setMessages((list) => [
        message,
        ...list.filter((m) => m.id !== message.id),
      ]);
      setBody("");
      setError("");
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }
  if (!user)
    return (
      <View style={[styles.page, styles.center]}>
        <Text style={styles.title}>Say hello.</Text>
        <Text style={styles.subtitle}>
          Start a conversation with a founder or builder.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requireAuth}>
          <Text style={styles.buttonText}>Sign in</Text>
        </TouchableOpacity>
      </View>
    );
  return selected ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={95}
      style={styles.page}
    >
      <View style={[styles.section, styles.row]}>
        <TouchableOpacity
          accessibilityLabel="Back to conversations"
          onPress={() => setSelected(null)}
        >
          <Ionicons name="arrow-back" size={23} />
        </TouchableOpacity>
        <Text style={styles.h2}>
          {selected.title ||
            selected.members.find((m) => m.id !== user.id)?.displayName}
        </Text>
      </View>
      {selected.isRequest && (
        <TouchableOpacity
          style={[styles.button, { margin: 16 }]}
          onPress={() =>
            void request(`/conversations/${selected.id}/accept`, {})
              .then(() => setSelected({ ...selected, isRequest: false }))
              .catch((e) => Alert.alert("Error", e.message))
          }
        >
          <Text style={styles.buttonText}>Accept message request</Text>
        </TouchableOpacity>
      )}
      <FlatList
        inverted
        style={{ flex: 1 }}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <View
            style={{
              alignSelf: item.sender.id === user.id ? "flex-end" : "flex-start",
              maxWidth: "85%",
              marginVertical: 9,
            }}
          >
            <View
              style={{
                padding: 13,
                borderRadius: 9,
                backgroundColor:
                  item.sender.id === user.id ? colors.accent : colors.olive,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 22,
                  color: item.sender.id === user.id ? "white" : colors.text,
                }}
              >
                {item.body}
              </Text>
            </View>
            <Text style={[styles.muted, { fontSize: 10 }]}>
              {item.sender.id === user.id
                ? item.readBy.length > 1
                  ? "Read"
                  : "Sent"
                : ""}
            </Text>
          </View>
        )}
        onEndReached={() => {
          if (cursor) {
            const value = cursor;
            setCursor(null);
            void request<Page<Message>>(
              `/conversations/${selected.id}/messages?cursor=${value}`,
            )
              .then((r) => {
                setMessages((list) => [...list, ...r.items]);
                setCursor(r.nextCursor);
              })
              .catch((e) => setError(e.message));
          }
        }}
      />
      {error && (
        <TouchableOpacity onPress={() => void send()}>
          <Text style={styles.error}>{error} · Tap to retry</Text>
        </TouchableOpacity>
      )}
      <View
        style={[
          styles.row,
          { padding: 15, borderTopWidth: 1, borderColor: colors.border },
        ]}
      >
        <TextInput
          accessibilityLabel="Message"
          style={[styles.input, { flex: 1 }]}
          value={body}
          onChangeText={(text) => {
            setBody(text);
            if (socket.current?.readyState === 1)
              socket.current.send(
                JSON.stringify({
                  type: "typing",
                  conversationId: selected.id,
                  typing: !!text,
                }),
              );
          }}
          placeholder="Start with a hello…"
          maxLength={5000}
        />
        <TouchableOpacity
          accessibilityLabel="Send message"
          style={styles.button}
          disabled={sending || !body.trim() || selected.isRequest}
          onPress={() => void send()}
        >
          {sending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Ionicons name="send" size={19} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  ) : (
    <FlatList
      style={styles.page}
      data={conversations}
      keyExtractor={(c) => c.id}
      ListHeaderComponent={
        <View style={styles.section}>
          <Text style={styles.title}>Your corner of the internet.</Text>
          <TextInput
            style={[styles.input, { marginTop: 20 }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Find someone to message…"
            accessibilityLabel="Find a builder"
          />
          {people.map((person) => (
            <TouchableOpacity
              key={person.id}
              style={[styles.row, { marginTop: 16 }]}
              onPress={() =>
                void request<{ conversation: Conversation }>("/conversations", {
                  memberIds: [person.id],
                })
                  .then((r) => {
                    setSelected(r.conversation);
                    setSearch("");
                    load();
                  })
                  .catch((e) => setError(e.message))
              }
            >
              <Avatar user={person} />
              <Text style={styles.body}>{person.displayName}</Text>
            </TouchableOpacity>
          ))}
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      }
      renderItem={({ item }) => {
        const person = item.members.find((m) => m.id !== user.id);
        return (
          <TouchableOpacity
            style={[styles.section, styles.row]}
            onPress={() => setSelected(item)}
          >
            {person && <Avatar user={person} />}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600" }}>
                {item.title || person?.displayName}
                {item.isRequest ? " · Request" : ""}
              </Text>
              <Text style={styles.muted} numberOfLines={1}>
                {item.lastMessage?.body || "Start the conversation."}
              </Text>
            </View>
            {item.unreadCount > 0 && (
              <Text style={{ color: colors.accent }}>{item.unreadCount}</Text>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}
