"use client";
import { useMediaSource } from "../lib/media-source";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Play,
  ArrowUpRight,
  Check,
  Plus,
  Flag,
  EyeOff,
  Link2,
} from "lucide-react";
import type { Post, Page, Comment, Collection, Explore } from "../lib/types";
import { api, mutate, ago, track, safeUrl } from "../lib/api";
import { useResource } from "../lib/hooks";
import { useApp } from "../lib/context";
import {
  Avatar,
  Verified,
  Tag,
  Empty,
  Loading,
  ErrorState,
  Modal,
  Spinner,
} from "./ui";
export function Video({
  media,
  postId,
  onLike,
}: {
  media: Post["media"][0];
  postId: string;
  onLike: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false),
    [playing, setPlaying] = useState(false),
    [muted, setMuted] = useState(true);
  const source = useMediaSource(media, near);
  const progress = useRef(new Set<number>());
  useEffect(() => {
    setMuted(localStorage.getItem("ps-muted") !== "false");
  }, []);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const nearObserver = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      { rootMargin: "500px" },
    );
    const activeObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio > 0.65 && !document.hidden) {
          void video.play().catch(() => undefined);
          track("FEED_IMPRESSION", { postId });
        } else video.pause();
      },
      { threshold: [0, 0.65] },
    );
    nearObserver.observe(video);
    activeObserver.observe(video);
    const visibility = () => {
      if (document.hidden) video.pause();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      nearObserver.disconnect();
      activeObserver.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      video.pause();
    };
  }, [postId]);
  useEffect(() => {
    const video = ref.current;
    if (!video || !near) return;
    let destroyed = false;
    let hls: import("hls.js").default | undefined;
    if (
      source.split("?")[0].endsWith(".m3u8") &&
      !video.canPlayType("application/vnd.apple.mpegurl")
    ) {
      void import("hls.js").then(({ default: Hls }) => {
        if (destroyed || !Hls.isSupported()) return;
        hls = new Hls({
          maxBufferLength: 12,
          maxMaxBufferLength: 20,
          backBufferLength: 4,
          startLevel: 0,
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      });
    } else video.src = source;
    return () => {
      destroyed = true;
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [near, source]);
  return (
    <div className="video-frame" onDoubleClick={onLike}>
      <video
        ref={ref}
        loop
        playsInline
        muted={muted}
        preload="metadata"
        poster={safeUrl(media.thumbnailUrl)}
        onPlay={() => {
          setPlaying(true);
          track("VIDEO_START", { postId });
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => track("VIDEO_COMPLETE", { postId })}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          const percent = (v.currentTime / v.duration) * 100;
          for (const p of [25, 50, 75, 95] as const)
            if (percent >= p && !progress.current.has(p)) {
              progress.current.add(p);
              track(p === 95 ? "VIDEO_COMPLETE" : `VIDEO_${p}`, {
                postId,
                value: v.currentTime * 1000,
              });
            }
          if (v.currentTime < 0.2 && progress.current.has(95)) {
            progress.current.clear();
            track("VIDEO_REPLAY", { postId });
          }
        }}
        onClick={() => {
          const v = ref.current;
          if (v?.paused) void v.play();
          else v?.pause();
        }}
        aria-label="Product demonstration video"
      />
      {!playing && (
        <button
          className="video-play"
          aria-label="Play video"
          onClick={() => void ref.current?.play()}
        >
          <Play size={30} fill="currentColor" />
        </button>
      )}
      <span className="video-label">
        <Play size={11} fill="currentColor" />
        PRODUCT DEMO
      </span>
      <button
        className="mute-button"
        aria-label={muted ? "Unmute video" : "Mute video"}
        onClick={() => {
          setMuted(!muted);
          localStorage.setItem("ps-muted", String(!muted));
        }}
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  );
}
export function PostCard({
  post: initial,
  onRemove,
}: {
  post: Post;
  onRemove?: () => void;
}) {
  const [post, setPost] = useState(initial),
    [comments, setComments] = useState(false),
    [following, setFollowing] = useState(initial.startup?.following || false),
    [pending, setPending] = useState(false),
    [collectionModal, setCollectionModal] = useState(false),
    [slide, setSlide] = useState(0);
  const { requireAuth, user, toast } = useApp();
  useEffect(() => setPost(initial), [initial]);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          track("FEED_IMPRESSION", { postId: post.id });
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [post.id]);
  async function interaction(kind: "like" | "save", force?: boolean) {
    if (!requireAuth() || pending) return;
    const before = post;
    const target = force ?? !(kind === "like" ? post.liked : post.saved);
    if (kind === "like" && target === post.liked) return;
    setPost({
      ...post,
      ...(kind === "like"
        ? { liked: target, likeCount: post.likeCount + (target ? 1 : -1) }
        : { saved: target, saveCount: post.saveCount + (target ? 1 : -1) }),
    });
    setPending(true);
    try {
      const result = await mutate<Record<string, number | boolean>>(
        `/posts/${post.id}/${kind}`,
        { [kind === "like" ? "liked" : "saved"]: target },
        "PUT",
      );
      setPost((current) => ({ ...current, ...result }));
    } catch (e) {
      setPost(before);
      toast((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  async function follow() {
    if (!requireAuth() || !post.startup) return;
    const before = following;
    setFollowing(!before);
    try {
      const r = await mutate<{ following: boolean }>(
        `/startups/${post.startup.id}/follow`,
        { following: !before },
        "PUT",
      );
      setFollowing(r.following);
    } catch (e) {
      setFollowing(before);
      toast((e as Error).message);
    }
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${location.origin}/post/${post.id}`);
      track("SHARE", { postId: post.id });
      toast("Link copied. Pass it on.");
    } catch {
      toast("Copy this post’s URL from its page.");
    }
  }
  return (
    <article
      className={`post-card ${post.kind === "REEL" ? "reel-card" : ""}`}
      ref={ref}
    >
      <header className="post-header">
        <Link href={`/@${post.author.username}`}>
          <Avatar
            name={post.author.displayName}
            url={post.author.avatarUrl}
            size={42}
          />
        </Link>
        <div className="post-identity">
          <div>
            {post.startup ? (
              <Link
                href={`/startup/${post.startup.slug}`}
                className="post-name"
              >
                {post.startup.name}
              </Link>
            ) : (
              <Link className="post-name" href={`/@${post.author.username}`}>
                {post.author.displayName}
              </Link>
            )}
            {post.startup?.verified && <Verified />}
            <span className="post-time">· {ago(post.createdAt)}</span>
          </div>
          <span>
            <Link href={`/@${post.author.username}`}>
              {post.author.displayName}
            </Link>
            {post.startup && " · Founder"}
            {post.kind === "LAUNCH" && (
              <span className="launch-label">NEW LAUNCH</span>
            )}
          </span>
        </div>
        {post.startup && user?.id !== post.author.id && (
          <button
            className={`follow-inline ${following ? "is-following" : ""}`}
            onClick={() => void follow()}
          >
            {following ? (
              <>
                <Check size={13} />
                Following
              </>
            ) : (
              <>
                <Plus size={14} />
                Follow
              </>
            )}
          </button>
        )}
        <details className="post-menu">
          <summary className="icon-button" aria-label="Post options">
            <MoreHorizontal size={20} />
          </summary>
          <div className="dropdown-menu">
            <button onClick={() => void copyLink()}>
              <Link2 size={16} />
              Copy link
            </button>
            <button onClick={() => setCollectionModal(true)}>
              <Bookmark size={16} />
              Add to collection
            </button>
            <Link href={`/messages?share=${post.id}`}>
              <Send size={16} />
              Send in a message
            </Link>
            <button
              onClick={() => {
                if (requireAuth()) {
                  track("NOT_INTERESTED", { postId: post.id });
                  onRemove?.();
                  toast("We’ll use this to improve your feed.");
                }
              }}
            >
              <EyeOff size={16} />
              Not interested
            </button>
            <button
              onClick={() => {
                if (requireAuth())
                  void mutate("/reports", {
                    postId: post.id,
                    reason: "spam",
                    details: "Reported from feed.",
                  })
                    .then(() => toast("Report submitted for moderator review."))
                    .catch((e) => toast(e.message));
              }}
            >
              <Flag size={16} />
              Report spam
            </button>
          </div>
        </details>
      </header>
      <p className="post-caption">{post.caption}</p>
      {post.media.length > 0 && (
        <div className="post-media">
          {post.media[slide].mediaType === "VIDEO" ? (
            <Video
              media={post.media[slide]}
              postId={post.id}
              onLike={() => void interaction("like", true)}
            />
          ) : (
            <img
              src={safeUrl(post.media[slide].url)}
              width={1200}
              height={900}
              loading="lazy"
              alt={`${post.product?.name || post.startup?.name || "Product"} preview`}
              onDoubleClick={() => void interaction("like", true)}
            />
          )}{" "}
          {post.media.length > 1 && (
            <div className="carousel-controls">
              {post.media.map((m, i) => (
                <button
                  className={slide === i ? "active" : ""}
                  key={m.id}
                  onClick={() => setSlide(i)}
                  aria-label={`Show image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
      <div className="post-actions">
        <button
          className={post.liked ? "liked" : ""}
          onClick={() => void interaction("like")}
          aria-label={post.liked ? "Unlike post" : "Like post"}
          aria-pressed={post.liked}
        >
          <Heart size={22} fill={post.liked ? "currentColor" : "none"} />
          <span>{post.likeCount || ""}</span>
        </button>
        <button onClick={() => setComments(true)} aria-label="Open comments">
          <MessageCircle size={22} />
          <span>{post.commentCount || ""}</span>
        </button>
        <button onClick={() => void copyLink()} aria-label="Share post">
          <Send size={21} />
        </button>
        <span className="action-spacer" />
        {post.product && (
          <Link
            className="product-action"
            href={`/product/${post.product.slug}`}
          >
            Meet the product <ArrowUpRight size={14} />
          </Link>
        )}
        <button
          className={post.saved ? "saved" : ""}
          onClick={() => void interaction("save")}
          aria-label={post.saved ? "Unsave post" : "Save post"}
          aria-pressed={post.saved}
        >
          <Bookmark size={22} fill={post.saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="post-tags">
        {post.tags.slice(0, 3).map((t) => (
          <Tag key={t} name={t} />
        ))}
      </div>
      {post.commentCount > 0 && (
        <button className="view-comments" onClick={() => setComments(true)}>
          View {post.commentCount}{" "}
          {post.commentCount === 1 ? "comment" : "comments"}
        </button>
      )}
      {comments && (
        <Comments
          post={post}
          onClose={() => setComments(false)}
          onAdd={() =>
            setPost((p) => ({ ...p, commentCount: p.commentCount + 1 }))
          }
        />
      )}{" "}
      {collectionModal && (
        <CollectionPicker
          postId={post.id}
          onClose={() => setCollectionModal(false)}
        />
      )}
    </article>
  );
}
function CollectionPicker({
  postId,
  onClose,
}: {
  postId: string;
  onClose: () => void;
}) {
  const { user, requireAuth, toast } = useApp();
  const { data, load } = useResource<{ items: Collection[] }>(
    user ? "/collections" : null,
  );
  const [name, setName] = useState("");
  return (
    <Modal title="Save to a collection" onClose={onClose}>
      {!user ? (
        <button className="button primary" onClick={requireAuth}>
          Sign in to save
        </button>
      ) : (
        <>
          <div className="collection-list">
            {data?.items.map((c) => (
              <button
                key={c.id}
                onClick={() =>
                  void mutate(
                    `/collections/${c.id}/items`,
                    { postId, saved: true },
                    "PUT",
                  )
                    .then(() => {
                      toast(`Saved to ${c.name}.`);
                      onClose();
                    })
                    .catch((e) => toast(e.message))
                }
              >
                <Bookmark size={19} />
                {c.name}
                <Plus size={17} />
              </button>
            ))}
          </div>
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              void mutate("/collections", { name })
                .then(() => {
                  setName("");
                  return load();
                })
                .catch((e) => toast(e.message));
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New collection name"
              aria-label="Collection name"
              required
              maxLength={80}
            />
            <button className="button primary">Create</button>
          </form>
        </>
      )}
    </Modal>
  );
}
export function Comments({
  post,
  onClose,
  onAdd,
}: {
  post: Post;
  onClose: () => void;
  onAdd: () => void;
}) {
  const [sort, setSort] = useState("new");
  const { data, setData, error, loading, load } = useResource<Page<Comment>>(
    `/posts/${post.id}/comments?sort=${sort}`,
  );
  const [body, setBody] = useState(""),
    [reply, setReply] = useState<Comment | null>(null),
    [sending, setSending] = useState(false);
  const { user, requireAuth, toast } = useApp();
  useEffect(
    () => setBody(sessionStorage.getItem(`comment:${post.id}`) || ""),
    [post.id],
  );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!requireAuth()) return;
    setSending(true);
    try {
      const { comment } = await mutate<{ comment: Comment }>(
        `/posts/${post.id}/comments`,
        { body, parentId: reply?.id },
      );
      setData((d) => (d ? { ...d, items: [comment, ...d.items] } : null));
      setBody("");
      sessionStorage.removeItem(`comment:${post.id}`);
      setReply(null);
      onAdd();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setSending(false);
    }
  }
  return (
    <Modal title="The conversation" onClose={onClose}>
      <div className="tabs compact">
        <button
          className={sort === "new" ? "active" : ""}
          onClick={() => setSort("new")}
        >
          Newest
        </button>
        <button
          className={sort === "top" ? "active" : ""}
          onClick={() => setSort("top")}
        >
          Top
        </button>
      </div>
      {loading ? (
        <Loading cards={1} />
      ) : error ? (
        <ErrorState error={error} retry={() => void load()} />
      ) : !data?.items.length ? (
        <Empty
          title="Start the conversation"
          description="A good question can lead somewhere interesting."
        />
      ) : (
        <div className="comments-list">
          {data.items.map((c) => (
            <div
              className={`comment-row ${c.parentId ? "reply" : ""}`}
              key={c.id}
            >
              <Avatar
                name={c.author.displayName}
                url={c.author.avatarUrl}
                size={32}
              />
              <div>
                <strong>{c.author.displayName}</strong>
                <time>{ago(c.createdAt)}</time>
                <p>{c.body}</p>
                <button className="text-button" onClick={() => setReply(c)}>
                  Reply
                </button>
                <button
                  className="text-button"
                  onClick={() => {
                    if (requireAuth())
                      void mutate(
                        `/comments/${c.id}/like`,
                        { liked: true },
                        "PUT",
                      )
                        .then(load)
                        .catch((e) => toast(e.message));
                  }}
                >
                  Like {c.likeCount || ""}
                </button>
                {user?.id === c.author.id && (
                  <button
                    className="text-button"
                    onClick={() =>
                      void mutate(`/comments/${c.id}`, undefined, "DELETE")
                        .then(load)
                        .catch((e) => toast(e.message))
                    }
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
          {data.hasMore && (
            <button
              className="text-button"
              onClick={() =>
                void api<Page<Comment>>(
                  `/posts/${post.id}/comments?cursor=${data.nextCursor}&sort=${sort}`,
                )
                  .then((next) =>
                    setData({ ...next, items: [...data.items, ...next.items] }),
                  )
                  .catch((e) => toast(e.message))
              }
            >
              Load more comments
            </button>
          )}
        </div>
      )}
      {reply && (
        <div className="reply-notice">
          Replying to {reply.author.displayName}
          <button onClick={() => setReply(null)}>Cancel</button>
        </div>
      )}
      <form className="comment-form" onSubmit={submit}>
        <input
          placeholder="Add something thoughtful…"
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            sessionStorage.setItem(`comment:${post.id}`, e.target.value);
          }}
          aria-label="Comment"
          maxLength={2000}
          required
        />
        <button disabled={sending} aria-label="Send comment">
          {sending ? <Spinner /> : <Send size={20} />}
        </button>
      </form>
    </Modal>
  );
}
export function Feed({ mode }: { mode: string }) {
  const { user } = useApp();
  const [items, setItems] = useState<Post[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [hasMore, setMore] = useState(true),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const busy = useRef(false);
  const version = useRef(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const { data: explore } = useResource<Explore>("/explore");
  const load = useCallback(
    async (reset = false) => {
      if (busy.current && !reset) return;
      const current = reset ? ++version.current : version.current;
      busy.current = true;
      setLoading(true);
      setError("");
      try {
        const page = await api<Page<Post>>(
          `/feed?mode=${mode}${!reset && cursor ? `&cursor=${cursor}` : ""}`,
        );
        if (current !== version.current) return;
        setItems((previous) =>
          reset
            ? page.items
            : [
                ...previous,
                ...page.items.filter(
                  (p) => !previous.some((x) => x.id === p.id),
                ),
              ],
        );
        setCursor(page.nextCursor || null);
        setMore(page.hasMore);
      } catch (e) {
        if (current === version.current) setError((e as Error).message);
      } finally {
        if (current === version.current) {
          setLoading(false);
          busy.current = false;
        }
      }
    },
    [mode, cursor],
  );
  useEffect(() => {
    setItems([]);
    setCursor(null);
    setMore(true);
    void load(true);
  }, [mode, user?.id]);
  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasMore || loading || error) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void load();
      },
      { rootMargin: "300px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [load, hasMore, loading, error]);
  return (
    <>
      <header className="feed-heading">
        <div>
          <p className="eyebrow">
            A LITTLE CURIOSITY. A WORLD OF POSSIBILITIES.
          </p>
          <h1>
            {mode === "reels"
              ? "Ideas in motion."
              : mode === "following"
                ? "Your circle, in progress."
                : "The future, in progress."}
          </h1>
          <p>Discover what people are building.</p>
        </div>
        <Link
          className="header-explore"
          href="/explore"
          aria-label="Search products"
        >
          <SearchIcon />
        </Link>
      </header>
      <div className="tabs feed-tabs">
        <Link className={mode === "for-you" ? "active" : ""} href="/">
          For you
        </Link>
        <Link
          className={mode === "following" ? "active" : ""}
          href="/following"
        >
          Following
        </Link>
        <Link className={mode === "reels" ? "active" : ""} href="/reels">
          Product reels <span className="tiny-dot" />
        </Link>
        <span className="tabs-end">Built by people, discovered by you.</span>
      </div>
      {mode === "for-you" && (
        <section className="launch-strip">
          <div className="section-row">
            <h2>Fresh off the workbench</h2>
            <Link href="/explore">
              Explore all <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="launch-grid">
            {explore?.trending.slice(0, 3).map((s) => (
              <Link
                className="launch-tile"
                href={`/startup/${s.slug}`}
                key={s.id}
              >
                <div>
                  <img
                    src={safeUrl(s.coverUrl)}
                    alt={`${s.name} product preview`}
                    width={240}
                    height={180}
                  />
                  <span className="launch-arrow">
                    <ArrowUpRight size={16} />
                  </span>
                </div>
                <strong>{s.name}</strong>
                <small>
                  {s.category} · {s.pitch.split(".")[0]}
                </small>
              </Link>
            ))}
          </div>
        </section>
      )}
      <div className={mode === "reels" ? "reel-feed" : "feed-list"}>
        {items.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onRemove={() =>
              setItems((list) => list.filter((p) => p.id !== post.id))
            }
          />
        ))}
      </div>
      {error && (
        <ErrorState error={error} retry={() => void load(!items.length)} />
      )}{" "}
      {loading && <Loading />}
      {!loading && !error && !items.length && (
        <Empty
          title={
            mode === "following"
              ? "Your circle starts here."
              : "Nothing here just yet."
          }
          description={
            mode === "following"
              ? "Follow a startup or founder and their updates will appear here."
              : "Check back soon for something new."
          }
          action={
            <Link className="button secondary" href="/explore">
              Explore builders
            </Link>
          }
        />
      )}
      <div ref={sentinel} className="feed-sentinel" />
      {!hasMore && items.length > 0 && (
        <div className="feed-end">
          You’re all caught up. Good ideas take a little time.
          <button className="text-button" onClick={() => void load(true)}>
            Refresh discoveries
          </button>
        </div>
      )}
    </>
  );
}
function SearchIcon() {
  return <ArrowUpRight size={22} />;
}
export function PostPage({ id }: { id: string }) {
  const { data, error, loading, load } = useResource<{ post: Post }>(
    `/posts/${id}`,
  );
  return loading ? (
    <Loading />
  ) : error ? (
    <ErrorState error={error} retry={() => void load()} />
  ) : data ? (
    <PostCard post={data.post} />
  ) : null;
}
