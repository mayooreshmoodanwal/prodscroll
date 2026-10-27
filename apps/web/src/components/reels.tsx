"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  Check,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  ArrowUpRight,
} from "lucide-react";
import { api, mutate, track } from "../lib/api";
import { useApp } from "../lib/context";
import type { Page, Post } from "../lib/types";
import { Avatar, Verified, Spinner } from "./ui";
import { Comments } from "./feed";
import { ReelPlayer } from "./reel-player";

function ReelCard({
  post,
  active,
  preload,
  update,
  muted,
  onMute,
}: {
  post: Post;
  active: boolean;
  preload: boolean;
  update: (post: Post) => void;
  muted: boolean;
  onMute: (muted: boolean) => void;
}) {
  const [comments, setComments] = useState(false),
    [expanded, setExpanded] = useState(false);
  const following = post.startup?.following || false;
  const busy = useRef(false);
  const followBusy = useRef(false);
  const { requireAuth, toast, user } = useApp();
  const media = post.media.find((m) => m.mediaType === "VIDEO");
  async function toggle(kind: "like" | "save", force?: boolean) {
    if (!requireAuth() || busy.current) return;
    const before = post,
      value = force ?? !(kind === "like" ? post.liked : post.saved);
    if (kind === "like" && value === post.liked) return;
    busy.current = true;
    update({
      ...post,
      ...(kind === "like"
        ? { liked: value, likeCount: post.likeCount + (value ? 1 : -1) }
        : { saved: value }),
    });
    try {
      await mutate(
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
        { postId: post.id },
      );
    } catch (error) {
      update(before);
      toast((error as Error).message);
    } finally {
      busy.current = false;
    }
  }
  async function follow() {
    if (!requireAuth() || !post.startup || followBusy.current) return;
    const before = following;
    followBusy.current = true;
    update({ ...post, startup: { ...post.startup, following: !before } });
    try {
      await mutate(
        `/startups/${post.startup.id}/follow`,
        { following: !before },
        "PUT",
      );
      track(!before ? "FOLLOW" : "UNFOLLOW", {
        postId: post.id,
        startupId: post.startup.id,
      });
    } catch (error) {
      update({ ...post, startup: { ...post.startup, following: before } });
      toast((error as Error).message);
    } finally {
      followBusy.current = false;
    }
  }
  async function share() {
    const url = `${location.origin}/post/${post.id}`;
    try {
      if (navigator.share)
        await navigator.share({
          title: post.startup?.name || post.author.displayName,
          url,
        });
      else {
        await navigator.clipboard.writeText(url);
        toast("Reel link copied.");
      }
      track("SHARE", { postId: post.id });
    } catch (error) {
      if ((error as Error).name !== "AbortError")
        toast("Open this reel’s page to copy its link.");
    }
  }
  async function report() {
    if (!requireAuth()) return;
    try {
      await mutate("/reports", {
        postId: post.id,
        reason: "spam",
        details: "Reported from the reel viewer.",
      });
      toast("Report sent for review.");
    } catch (error) {
      toast((error as Error).message);
    }
  }
  return (
    <div className="reel-stage">
      <div className="reel-canvas">
        {media && (
          <ReelPlayer
            media={media}
            postId={post.id}
            active={active && !comments}
            preload={preload}
            onLike={() => void toggle("like", true)}
            muted={muted}
            onMute={onMute}
          />
        )}
        <div className="reel-topline">
          <span>Product reels</span>
          <span className="reel-for-you">For you</span>
        </div>
        <div className="reel-caption">
          <div className="reel-identity">
            <Link href={`/@${post.author.username}`}>
              <Avatar
                name={post.author.displayName}
                url={post.author.avatarUrl}
                size={36}
              />
            </Link>
            <Link
              href={
                post.startup
                  ? `/startup/${post.startup.slug}`
                  : `/@${post.author.username}`
              }
            >
              <strong>{post.startup?.name || post.author.displayName}</strong>
              {post.startup?.verified && <Verified />}
            </Link>
            {post.startup && post.author.id !== user?.id && (
              <button className="reel-follow" onClick={() => void follow()}>
                {following ? (
                  <>
                    <Check size={13} />
                    Following
                  </>
                ) : (
                  "Follow"
                )}
              </button>
            )}
          </div>
          <Link className="reel-founder" href={`/@${post.author.username}`}>
            Built by {post.author.displayName} ·{" "}
            {post.startup?.category || post.tags[0]}
          </Link>
          <button
            className={`reel-description ${expanded ? "expanded" : ""}`}
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label="Expand reel description"
          >
            {post.caption}
          </button>
          {post.product && (
            <Link
              className="reel-product"
              href={`/product/${post.product.slug}`}
            >
              {post.product.name}
              <ArrowUpRight size={15} />
            </Link>
          )}
        </div>
        <div className="reel-actions">
          <button
            aria-label={post.liked ? "Unlike reel" : "Like reel"}
            aria-pressed={post.liked}
            onClick={() => void toggle("like")}
          >
            <Heart
              size={27}
              fill={post.liked ? "#f16b76" : "none"}
              color={post.liked ? "#f16b76" : "currentColor"}
            />
            <span>{post.likeCount || "Like"}</span>
          </button>
          <button aria-label="Reel comments" onClick={() => setComments(true)}>
            <MessageCircle size={27} />
            <span>{post.commentCount || "Discuss"}</span>
          </button>
          <button
            aria-label={post.saved ? "Unsave reel" : "Save reel"}
            aria-pressed={post.saved}
            onClick={() => void toggle("save")}
          >
            <Bookmark size={26} fill={post.saved ? "currentColor" : "none"} />
            <span>{post.saved ? "Saved" : "Save"}</span>
          </button>
          <button aria-label="Share reel" onClick={() => void share()}>
            <Send size={25} />
            <span>Share</span>
          </button>
          <details className="reel-more">
            <summary aria-label="More reel actions">
              <MoreHorizontal size={25} />
            </summary>
            <div>
              <Link href={`/messages?share=${post.id}`}>Send in a message</Link>
              <button onClick={() => void report()}>Report spam</button>
              <Link href={`/post/${post.id}`}>Open reel page</Link>
            </div>
          </details>
        </div>
      </div>
      {comments && (
        <Comments
          post={post}
          onClose={() => setComments(false)}
          onAdd={() => update({ ...post, commentCount: post.commentCount + 1 })}
        />
      )}
    </div>
  );
}
export function Reels() {
  const { user, authLoading } = useApp();
  const [items, setItems] = useState<Post[]>([]),
    [active, setActive] = useState(0),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [muted, setMuted] = useState(true),
    [empty, setEmpty] = useState(false);
  useEffect(() => {
    setMuted(localStorage.getItem("ps-muted") !== "false");
  }, []);
  const onMute = (value: boolean) => {
    setMuted(value);
    localStorage.setItem("ps-muted", String(value));
  };
  const scroller = useRef<HTMLDivElement>(null),
    busy = useRef(false),
    version = useRef(0),
    itemsRef = useRef<Post[]>([]),
    frame = useRef<number | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const resize = new ResizeObserver(() => {
      el.scrollTo({
        top: activeRef.current * el.clientHeight,
        behavior: "instant",
      });
    });
    resize.observe(el);
    return () => resize.disconnect();
  }, []);
  const load = useCallback(async (reset = false) => {
    if (busy.current && !reset) return;
    const run = reset ? ++version.current : version.current;
    busy.current = true;
    setLoading(true);
    setError("");
    const seen = reset ? [] : itemsRef.current.slice(-40).map((p) => p.id);
    try {
      const batch = await api<Page<Post>>(
        `/reels${seen.length ? `?seen=${encodeURIComponent(seen.join(","))}` : ""}`,
      );
      if (run !== version.current) return;
      const next = reset ? batch.items : [...itemsRef.current, ...batch.items];
      itemsRef.current = next;
      setItems(next);
      setEmpty(next.length === 0);
      if (!batch.items.length && next.length)
        setError(
          "No more reels are available right now. Try again in a moment.",
        );
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
    if (authLoading) return;
    itemsRef.current = [];
    setItems([]);
    setActive(0);
    setEmpty(false);
    scroller.current?.scrollTo({ top: 0 });
    void load(true);
    return () => {
      version.current++;
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [user?.id, authLoading, load]);
  // Index 6 is reel seven: begin filling the next batch with three reels in reserve.
  useEffect(() => {
    if (items.length && active >= items.length - 4 && !loading && !error)
      void load();
  }, [active, items.length, loading, error, load]);
  function scrollTo(index: number) {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({
      top: Math.max(0, Math.min(index, items.length - 1)) * el.clientHeight,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  function update(post: Post) {
    itemsRef.current = itemsRef.current.map((item) =>
      item.id === post.id
        ? post
        : item.startup?.id === post.startup?.id && item.startup
          ? {
              ...item,
              startup: { ...item.startup, following: post.startup?.following },
            }
          : item,
    );
    setItems(itemsRef.current);
  }
  const first = Math.max(0, active - 2);
  const last = Math.min(items.length, active + 3);
  return (
    <section className="reels-view" aria-label="Product reels">
      <div
        className="reels-scroller"
        ref={scroller}
        tabIndex={0}
        role="region"
        aria-label="Reel player. Scroll for the next reel."
        data-testid="reels-scroller"
        data-active-index={active}
        data-loaded-count={items.length}
        onScroll={() => {
          if (frame.current) return;
          frame.current = requestAnimationFrame(() => {
            frame.current = null;
            const el = scroller.current;
            if (el)
              setActive(
                Math.max(
                  0,
                  Math.min(
                    itemsRef.current.length - 1,
                    Math.round(el.scrollTop / el.clientHeight),
                  ),
                ),
              );
          });
        }}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (["ArrowDown", "PageDown", "ArrowUp", "PageUp"].includes(e.key)) {
            e.preventDefault();
            scrollTo(
              active + (["ArrowDown", "PageDown"].includes(e.key) ? 1 : -1),
            );
          }
        }}
      >
        <div aria-hidden="true" style={{ height: `${first * 100}%` }} />
        {items.slice(first, last).map((post, offset) => {
          const index = first + offset;
          return (
            <article
              className="reel-slot"
              key={`${index}:${post.id}`}
              data-reel-index={index}
              aria-label={`Reel ${index + 1}`}
              aria-hidden={index !== active}
              inert={index !== active}
            >
              <ReelCard
                post={post}
                active={index === active}
                preload={index === active + 1}
                update={update}
                muted={muted}
                onMute={onMute}
              />
            </article>
          );
        })}
        <div
          aria-hidden="true"
          style={{ height: `${(items.length - last) * 100}%` }}
        />
        {!items.length && (
          <div className="reel-slot">
            <div className="reel-stage">
              <div className="reel-canvas reel-skeleton" aria-busy={loading}>
                <span>Product reels</span>
                <div>
                  {loading || authLoading ? (
                    <>
                      <Spinner />
                      <p>Finding your next discovery…</p>
                    </>
                  ) : (
                    <>
                      <p>
                        {error ||
                          (empty
                            ? "Product demos are on their way."
                            : "Your next discovery is here.")}
                      </p>
                      <button onClick={() => void load(true)}>Try again</button>
                    </>
                  )}
                </div>
                <div className="reel-skeleton-lines">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="reel-navigation">
        <button
          aria-label="Previous reel"
          disabled={active === 0}
          onClick={() => scrollTo(active - 1)}
        >
          <ArrowUp size={22} />
        </button>
        <button
          aria-label="Next reel"
          disabled={active >= items.length - 1}
          onClick={() => scrollTo(active + 1)}
        >
          <ArrowDown size={22} />
        </button>
        <span>Scroll to explore</span>
      </div>
      {items.length > 0 && loading && (
        <div className="reel-buffer-status" role="status">
          <Spinner />
          <span>Getting more reels…</span>
        </div>
      )}
      {items.length > 0 && error && (
        <button
          className="reel-buffer-status retry"
          onClick={() => void load()}
        >
          {error} Tap to retry.
        </button>
      )}
    </section>
  );
}
