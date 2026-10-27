"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  ArrowUpRight,
  MessageCircle,
  Check,
  Plus,
  Share2,
  Flag,
} from "lucide-react";
import { useResource } from "../lib/hooks";
import { useApp } from "../lib/context";
import { mutate, safeUrl, track } from "../lib/api";
import type { Startup, Product, User, Post } from "../lib/types";
import {
  Avatar,
  Verified,
  ExternalLink,
  Loading,
  ErrorState,
  Empty,
} from "./ui";
import { PostCard } from "./feed";
import { ProductRow, StartupTile } from "./explore";
export function ProfilePage({ username }: { username: string }) {
  const { user, requireAuth, toast } = useApp();
  const { data, error, loading, load } = useResource<{
    user: User;
    posts: Post[];
    startups: Startup[];
  }>(`/users/${username}`);
  const [tab, setTab] = useState("Posts");
  const router = useRouter();
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} retry={() => void load()} />;
  if (!data) return null;
  const person = data.user,
    own = person.id === user?.id;
  return (
    <>
      <div className="profile-banner">
        <span>IDEAS DON’T BUILD THEMSELVES.</span>
        <span className="profile-asterisk">✳</span>
      </div>
      <section className="profile-header">
        <div className="profile-avatar-row">
          <Avatar name={person.displayName} url={person.avatarUrl} size={88} />
          <div>
            {own ? (
              <Link className="button secondary" href="/settings">
                Edit profile
              </Link>
            ) : (
              <>
                <button
                  className="button secondary"
                  onClick={() => {
                    if (requireAuth())
                      void mutate<{ conversation: { id: string } }>(
                        "/conversations",
                        { memberIds: [person.id] },
                      )
                        .then((r) =>
                          router.push(
                            `/messages?conversation=${r.conversation.id}`,
                          ),
                        )
                        .catch((e) => toast(e.message));
                  }}
                >
                  <MessageCircle size={17} />
                  Message
                </button>
                <button
                  className={`button ${person.following ? "secondary" : "primary"}`}
                  onClick={() => {
                    if (requireAuth())
                      void mutate(
                        `/users/${person.id}/follow`,
                        { following: !person.following },
                        "PUT",
                      )
                        .then(load)
                        .catch((e) => toast(e.message));
                  }}
                >
                  {person.following ? <Check size={16} /> : <Plus size={16} />}{" "}
                  {person.following ? "Following" : "Follow"}
                </button>
              </>
            )}
          </div>
        </div>
        <h1>
          {person.displayName}
          {person.verified && <Verified />}
        </h1>
        <p className="username">
          @{person.username} <span>· {person.role.toLowerCase()}</span>
        </p>
        <p className="profile-bio">
          {person.bio || "A curious mind, building something new."}
        </p>
        <div className="profile-meta">
          {person.location && (
            <span>
              <MapPin size={15} />
              {person.location}
            </span>
          )}
          <ExternalLink href={person.website}>Website</ExternalLink>
        </div>
        <div className="profile-counts">
          <span>
            <strong>{person.postCount || 0}</strong> posts
          </span>
          <span>
            <strong>{person.followerCount || 0}</strong> followers
          </span>
          <span>
            <strong>{person.followingCount || 0}</strong> following
          </span>
        </div>
        {!own && user && (
          <details className="profile-options">
            <summary>Profile options</summary>
            <button
              onClick={() =>
                void mutate(`/users/${person.id}/block`, {})
                  .then(() => {
                    toast("Account blocked.");
                    router.push("/");
                  })
                  .catch((e) => toast(e.message))
              }
            >
              Block account
            </button>
            <button
              onClick={() =>
                void mutate("/reports", {
                  userId: person.id,
                  reason: "other",
                  details: "Profile reported for review.",
                })
                  .then(() => toast("Report sent to moderators."))
                  .catch((e) => toast(e.message))
              }
            >
              <Flag size={14} />
              Report account
            </button>
          </details>
        )}
      </section>
      <div className="tabs profile-tabs">
        {[
          "Posts",
          "Reels",
          ...(person.role === "FOUNDER" ? ["Startups"] : []),
        ].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
        {own && <Link href="/saved">Saved & collections</Link>}
      </div>
      {tab === "Startups" ? (
        <div className="explore-grid padded">
          {data.startups.map((s) => (
            <StartupTile key={s.id} startup={s} />
          ))}
        </div>
      ) : data.posts.filter((p) =>
          tab === "Reels" ? p.kind === "REEL" : p.kind !== "REEL",
        ).length ? (
        data.posts
          .filter((p) =>
            tab === "Reels" ? p.kind === "REEL" : p.kind !== "REEL",
          )
          .map((p) => <PostCard key={p.id} post={p} />)
      ) : (
        <Empty
          title={
            person.privateAccount && !own && !person.following
              ? "This is a private profile."
              : "The story is just beginning."
          }
          description="New updates will appear here."
        />
      )}
    </>
  );
}
export function StartupPage({ slug }: { slug: string }) {
  const { user, requireAuth, toast } = useApp();
  const { data, error, loading, load } = useResource<{ startup: Startup }>(
    `/startups/${slug}`,
  );
  const [tab, setTab] = useState("Overview");
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} retry={() => void load()} />;
  if (!data) return null;
  const s = data.startup;
  return (
    <>
      <div className="startup-hero">
        {s.coverUrl ? (
          <img
            src={safeUrl(s.coverUrl)}
            alt={`${s.name} product preview`}
            width={1200}
            height={900}
          />
        ) : (
          <span>{s.name}</span>
        )}
      </div>
      <section className="startup-header">
        <div className="section-row">
          <span className="eyebrow">
            {s.category} · BUILDING THE NEXT CHAPTER
          </span>
          <button
            className="icon-button"
            aria-label="Share startup"
            onClick={() =>
              void navigator.clipboard
                .writeText(location.href)
                .then(() => toast("Startup link copied."))
                .catch(() => toast("Copy the URL to share."))
            }
          >
            <Share2 size={18} />
          </button>
        </div>
        <h1>
          {s.name}
          {s.verified && <Verified />}
        </h1>
        <p className="startup-pitch">{s.pitch}</p>
        <div className="profile-meta">
          {s.location && (
            <span>
              <MapPin size={15} />
              {s.location}
            </span>
          )}
          {s.foundingYear && <span>Founded {s.foundingYear}</span>}
          <span>{s.followerCount} followers</span>
        </div>
        <div className="startup-buttons">
          <button
            className={`button ${s.following ? "secondary" : "primary"}`}
            onClick={() => {
              if (requireAuth())
                void mutate(
                  `/startups/${s.id}/follow`,
                  { following: !s.following },
                  "PUT",
                )
                  .then(load)
                  .catch((e) => toast(e.message));
            }}
          >
            {s.following ? <Check size={16} /> : <Plus size={17} />}{" "}
            {s.following ? "Following" : "Follow the journey"}
          </button>
          <ExternalLink href={s.website}>Visit website</ExternalLink>
          {user?.id === s.ownerId && (
            <Link className="text-button" href="/founder">
              Manage startup <ArrowUpRight size={14} />
            </Link>
          )}
        </div>
      </section>
      <div className="tabs profile-tabs">
        {["Overview", "Posts", "Products", "Updates", "Team", "About"].map(
          (t) => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => {
                setTab(t);
                track("STARTUP_OPEN", { startupId: s.id });
              }}
            >
              {t}
            </button>
          ),
        )}
      </div>
      {tab === "Overview" ? (
        <>
          <section className="about-block">
            <p className="eyebrow">THE IDEA</p>
            <h2>Meet {s.name}.</h2>
            <p>{s.description}</p>
          </section>
          <section className="padded">
            <h2>What they’re building</h2>
            {s.products?.map((p) => (
              <ProductRow key={p.id} product={p} />
            ))}
          </section>
          {s.posts?.slice(0, 3).map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </>
      ) : tab === "Products" ? (
        <section className="padded">
          {s.products?.length ? (
            s.products.map((p) => <ProductRow key={p.id} product={p} />)
          ) : (
            <Empty
              title="Something is taking shape."
              description="Products will appear here when the team is ready."
            />
          )}
        </section>
      ) : tab === "Team" ? (
        <section className="padded">
          {s.team?.map((u) => (
            <Link className="person-result" key={u.id} href={`/@${u.username}`}>
              <Avatar name={u.displayName} url={u.avatarUrl} />
              <span>
                <strong>{u.displayName}</strong>
                <small>Building {s.name}</small>
              </span>
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </section>
      ) : tab === "About" ? (
        <section className="about-block">
          <h2>A little more about {s.name}</h2>
          <p>{s.description}</p>
          <ExternalLink href={s.website}>Visit the website</ExternalLink>
        </section>
      ) : s.posts?.filter((p) =>
          tab === "Updates" ? p.kind === "UPDATE" || p.kind === "LAUNCH" : true,
        ).length ? (
        s.posts
          .filter((p) =>
            tab === "Updates"
              ? p.kind === "UPDATE" || p.kind === "LAUNCH"
              : true,
          )
          .map((p) => <PostCard key={p.id} post={p} />)
      ) : (
        <Empty title="This startup hasn’t published an update yet." />
      )}
    </>
  );
}
export function ProductPage({ slug }: { slug: string }) {
  const { data, error, loading, load } = useResource<{
    product: Product;
    posts: Post[];
  }>(`/products/${slug}`);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} retry={() => void load()} />;
  if (!data) return null;
  const p = data.product;
  return (
    <>
      {p.imageUrl && (
        <div className="startup-hero">
          <img
            src={safeUrl(p.imageUrl)}
            width={1200}
            height={900}
            alt={`${p.name} preview`}
          />
        </div>
      )}
      <section className="startup-header">
        <span className="eyebrow">
          {p.category} · {p.status}
        </span>
        <h1>{p.name}</h1>
        <Link className="product-maker" href={`/startup/${p.startup.slug}`}>
          Made by {p.startup.name} <ArrowUpRight size={15} />
        </Link>
        <p className="profile-bio">{p.description}</p>
        <ExternalLink href={p.website}>Try the product</ExternalLink>
      </section>
      <div className="section-row padded">
        <h2>From the people behind it</h2>
      </div>
      {data.posts.length ? (
        data.posts.map((post) => <PostCard key={post.id} post={post} />)
      ) : (
        <Empty title="A new product story starts here." />
      )}
    </>
  );
}
