"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Plus,
  CheckCheck,
  Search,
  MessageCircle,
  MoreHorizontal,
} from "lucide-react";
import { useResource } from "../lib/hooks";
import { useApp } from "../lib/context";
import { api, mutate, ago } from "../lib/api";
import type { Conversation, Message, Page, User } from "../lib/types";
import {
  Avatar,
  PageHeading,
  Modal,
  Empty,
  Loading,
  ErrorState,
  Spinner,
} from "./ui";
export function Inbox() {
  const { user, requireAuth, toast, socket, socketEvent } = useApp();
  const params = useSearchParams();
  const router = useRouter();
  const [selected, setSelected] = useState(params.get("conversation") || ""),
    [body, setBody] = useState(""),
    [sending, setSending] = useState(false),
    [failed, setFailed] = useState(""),
    [showNew, setShowNew] = useState(false),
    [query, setQuery] = useState(""),
    [typing, setTyping] = useState(false);
  const share = params.get("share");
  const conversations = useResource<{ items: Conversation[] }>(
    user ? "/conversations" : null,
  );
  const messages = useResource<Page<Message>>(
    user && selected ? `/conversations/${selected}/messages` : null,
  );
  const search = useResource<{ users: User[] }>(
    showNew && query.length >= 2
      ? `/search?q=${encodeURIComponent(query)}&type=people`
      : null,
  );
  const end = useRef<HTMLDivElement>(null);
  const current = conversations.data?.items.find((c) => c.id === selected);
  const recipient = current?.members.find((m) => m.id !== user?.id);
  useEffect(() => {
    if (params.get("conversation")) setSelected(params.get("conversation")!);
  }, [params]);
  useEffect(() => {
    if (selected && user) {
      setBody(sessionStorage.getItem(`dm:${selected}`) || "");
      void mutate(`/conversations/${selected}/read`, {}).catch(() => undefined);
    }
  }, [selected, user?.id]);
  useEffect(() => {
    if (socketEvent?.type === "message") {
      void conversations.load();
      if (socketEvent.conversationId === selected && socketEvent.message) {
        const message = socketEvent.message;
        messages.setData((previous) =>
          previous
            ? {
                ...previous,
                items: [
                  message,
                  ...previous.items.filter((m) => m.id !== message.id),
                ],
              }
            : null,
        );
        void mutate(`/conversations/${selected}/read`, {}).catch(
          () => undefined,
        );
      }
    }
    if (
      socketEvent?.type === "read" &&
      socketEvent.conversationId === selected &&
      socketEvent.userId
    ) {
      const id = socketEvent.userId;
      messages.setData((previous) =>
        previous
          ? {
              ...previous,
              items: previous.items.map((m) => ({
                ...m,
                readBy: [...new Set([...m.readBy, id])],
              })),
            }
          : null,
      );
    }
    if (
      socketEvent?.type === "typing" &&
      socketEvent.conversationId === selected
    ) {
      setTyping(!!socketEvent.typing);
      const timer = setTimeout(() => setTyping(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [socketEvent]);
  useEffect(
    () => end.current?.scrollIntoView({ block: "nearest" }),
    [messages.data?.items.length],
  );
  async function send() {
    if (!user || !selected || (!body.trim() && !share)) return;
    setSending(true);
    setFailed("");
    try {
      const { message } = await mutate<{ message: Message }>(
        `/conversations/${selected}/messages`,
        { body, sharedPostId: share || undefined },
      );
      messages.setData((previous) =>
        previous
          ? {
              ...previous,
              items: [
                message,
                ...previous.items.filter((m) => m.id !== message.id),
              ],
            }
          : null,
      );
      setBody("");
      sessionStorage.removeItem(`dm:${selected}`);
      await conversations.load();
      if (share) router.replace(`/messages?conversation=${selected}`);
    } catch (e) {
      setFailed((e as Error).message);
    } finally {
      setSending(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="GOOD THINGS START WITH A CONVERSATION"
        title="Your corner of the internet."
        action={
          <button
            className="icon-button"
            aria-label="New message"
            onClick={() => {
              if (requireAuth()) setShowNew(true);
            }}
          >
            <Plus size={23} />
          </button>
        }
      />
      {!user ? (
        <Empty
          title="Say hello to a builder."
          description="Sign in to start a conversation."
          action={
            <button className="button primary" onClick={requireAuth}>
              Sign in
            </button>
          }
        />
      ) : !selected ? (
        <section className="conversation-list">
          {share && (
            <div className="notice">
              Choose a conversation or start a new one to share this post.
            </div>
          )}
          {conversations.loading ? (
            <Loading />
          ) : conversations.error ? (
            <ErrorState
              error={conversations.error}
              retry={() => void conversations.load()}
            />
          ) : !conversations.data?.items.length ? (
            <Empty
              title="A good conversation starts somewhere."
              description="Start a conversation with a founder or builder."
              action={
                <button
                  className="button primary"
                  onClick={() => setShowNew(true)}
                >
                  Say hello
                </button>
              }
            />
          ) : (
            conversations.data.items.map((c) => {
              const person = c.members.find((m) => m.id !== user.id);
              return (
                <button
                  className="conversation-row"
                  key={c.id}
                  onClick={() => {
                    setSelected(c.id);
                    setFailed("");
                  }}
                >
                  <Avatar
                    name={person?.displayName || c.title || "Conversation"}
                    url={person?.avatarUrl}
                    size={48}
                  />
                  <div>
                    <strong>
                      {c.title || person?.displayName}
                      {c.isRequest && (
                        <span className="request-badge">Request</span>
                      )}
                    </strong>
                    <p>{c.lastMessage?.body || "Start the conversation."}</p>
                  </div>
                  <span className="conversation-time">
                    {c.lastMessage && ago(c.lastMessage.createdAt)}
                    {c.unreadCount > 0 && <b>{c.unreadCount}</b>}
                  </span>
                </button>
              );
            })
          )}
        </section>
      ) : (
        <section className="chat">
          <header className="chat-header">
            <button
              className="icon-button"
              aria-label="Back to conversations"
              onClick={() => {
                setSelected("");
                router.replace("/messages");
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <Avatar
              name={recipient?.displayName || "Conversation"}
              url={recipient?.avatarUrl}
              size={38}
            />
            <div>
              <strong>
                {current?.title || recipient?.displayName || "Conversation"}
              </strong>
              <small>
                {typing ? "Typing…" : socket ? "Connected" : "Reconnecting…"}
              </small>
            </div>
            <details className="post-menu">
              <summary
                className="icon-button"
                aria-label="Conversation options"
              >
                <MoreHorizontal size={20} />
              </summary>
              <div className="dropdown-menu">
                <button
                  onClick={() =>
                    void mutate(
                      `/conversations/${selected}/mute`,
                      { muted: true },
                      "PUT",
                    )
                      .then(() => toast("Conversation muted."))
                      .catch((e) => toast(e.message))
                  }
                >
                  Mute conversation
                </button>
                {recipient && (
                  <button
                    onClick={() =>
                      void mutate(`/users/${recipient.id}/block`, {})
                        .then(() => {
                          toast("Account blocked.");
                          setSelected("");
                        })
                        .catch((e) => toast(e.message))
                    }
                  >
                    Block account
                  </button>
                )}
              </div>
            </details>
          </header>
          {current?.isRequest && (
            <div className="message-request">
              <p>{recipient?.displayName} would like to connect.</p>
              <button
                className="button primary"
                onClick={() =>
                  void mutate(`/conversations/${selected}/accept`, {})
                    .then(conversations.load)
                    .catch((e) => toast(e.message))
                }
              >
                Accept request
              </button>
            </div>
          )}
          <div className="message-history">
            {messages.loading ? (
              <Loading cards={1} />
            ) : messages.error ? (
              <ErrorState
                error={messages.error}
                retry={() => void messages.load()}
              />
            ) : (
              <>
                {messages.data?.hasMore && (
                  <button
                    className="text-button load-more"
                    onClick={() =>
                      void api<Page<Message>>(
                        `/conversations/${selected}/messages?cursor=${messages.data?.nextCursor}`,
                      )
                        .then((next) =>
                          messages.setData((previous) =>
                            previous
                              ? {
                                  ...next,
                                  items: [...previous.items, ...next.items],
                                }
                              : next,
                          ),
                        )
                        .catch((e) => toast(e.message))
                    }
                  >
                    Earlier messages
                  </button>
                )}
                {[...(messages.data?.items || [])].reverse().map((m) => (
                  <div
                    className={`message ${m.sender.id === user.id ? "own" : ""}`}
                    key={m.id}
                  >
                    {m.sender.id !== user.id && (
                      <Avatar name={m.sender.displayName} size={27} />
                    )}
                    <div>
                      <div className="message-bubble">
                        {m.unsent ? (
                          <em>Message unsent</em>
                        ) : (
                          <>
                            {m.body}
                            {m.sharedPost && (
                              <Link
                                className="shared-post"
                                href={`/post/${m.sharedPost.id}`}
                              >
                                <MessageCircle size={17} />
                                {m.sharedPost.caption?.slice(0, 100) ||
                                  "Shared product update"}
                              </Link>
                            )}
                          </>
                        )}
                      </div>
                      <small>
                        {ago(m.createdAt)}
                        {m.sender.id === user.id && (
                          <>
                            <CheckCheck size={12} />
                            {m.readBy.length > 1 ? "Read" : "Sent"}
                          </>
                        )}
                      </small>
                      {m.sender.id === user.id && !m.unsent && (
                        <button
                          className="unsend-button"
                          onClick={() =>
                            void mutate(
                              `/messages/${m.id}?scope=everyone`,
                              undefined,
                              "DELETE",
                            )
                              .then(messages.load)
                              .catch((e) => toast(e.message))
                          }
                        >
                          Unsend
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
            <div ref={end} />
          </div>
          {share && (
            <div className="notice">
              A product post will be shared with your message.
            </div>
          )}
          {failed && (
            <div className="form-error">
              {failed}
              <button className="text-button" onClick={() => void send()}>
                Retry
              </button>
            </div>
          )}
          <form
            className="message-compose"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <input
              aria-label="Message"
              placeholder="Start with a hello…"
              value={body}
              maxLength={5000}
              onChange={(e) => {
                setBody(e.target.value);
                sessionStorage.setItem(`dm:${selected}`, e.target.value);
                if (socket?.readyState === 1)
                  socket.send(
                    JSON.stringify({
                      type: "typing",
                      conversationId: selected,
                      typing: !!e.target.value,
                    }),
                  );
              }}
            />
            <button
              className="button primary"
              disabled={
                sending || (!body.trim() && !share) || !!current?.isRequest
              }
              aria-label="Send message"
            >
              {sending ? <Spinner /> : <Send size={19} />}
            </button>
          </form>
        </section>
      )}
      {showNew && (
        <Modal title="Start a conversation" onClose={() => setShowNew(false)}>
          <div className="search-box modal-search">
            <Search size={18} />
            <input
              aria-label="Find a builder"
              placeholder="Find a founder or builder…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {search.data?.users
            .filter((u) => u.id !== user?.id)
            .map((u) => (
              <button
                className="person-result full"
                key={u.id}
                onClick={() =>
                  void mutate<{ conversation: Conversation }>(
                    "/conversations",
                    { memberIds: [u.id] },
                  )
                    .then(async (r) => {
                      await conversations.load();
                      setSelected(r.conversation.id);
                      setShowNew(false);
                    })
                    .catch((e) => toast(e.message))
                }
              >
                <Avatar name={u.displayName} url={u.avatarUrl} />
                <span>
                  <strong>{u.displayName}</strong>
                  <small>@{u.username}</small>
                </span>
                <Plus size={17} />
              </button>
            ))}
          {query.length < 2 && (
            <p className="muted padded">Search by name or username.</p>
          )}
        </Modal>
      )}
    </>
  );
}
