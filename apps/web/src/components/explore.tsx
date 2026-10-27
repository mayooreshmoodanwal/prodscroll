"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Search, Bookmark, Plus, X } from "lucide-react";
import { useResource } from "../lib/hooks";
import { useApp } from "../lib/context";
import { api, mutate, safeUrl } from "../lib/api";
import type {
  Explore,
  Startup,
  Product,
  User,
  Post,
  Page,
  Collection,
} from "../lib/types";
import {
  PageHeading,
  Avatar,
  Verified,
  Loading,
  Empty,
  ErrorState,
  Modal,
} from "./ui";
import { PostCard } from "./feed";
export function StartupTile({ startup: s }: { startup: Startup }) {
  return (
    <Link className="startup-tile" href={`/startup/${s.slug}`}>
      <div className="startup-cover">
        {s.coverUrl ? (
          <img
            src={safeUrl(s.coverUrl)}
            alt={s.name}
            width={600}
            height={450}
            loading="lazy"
          />
        ) : (
          <span>{s.name.charAt(0)}</span>
        )}
        <ArrowUpRight size={20} />
      </div>
      <p className="eyebrow">{s.category}</p>
      <h3>
        {s.name}
        {s.verified && <Verified />}
      </h3>
      <p>{s.pitch}</p>
    </Link>
  );
}
export function ExplorePage() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || ""),
    [category, setCategory] = useState(params.get("category") || ""),
    [query, setQuery] = useState(""),
    [type, setType] = useState("all");
  const { user, toast } = useApp();
  const { data, error, loading, load } = useResource<Explore>("/explore");
  const result = useResource<{
    startups: Startup[];
    products: Product[];
    users: User[];
  }>(
    query
      ? `/search?q=${encodeURIComponent(query)}&type=${type}${category ? `&category=${encodeURIComponent(category)}` : ""}`
      : null,
  );
  const history = useResource<{ items: { id: string; query: string }[] }>(
    user ? "/search/history" : null,
  );
  useEffect(() => {
    setCategory(params.get("category") || "");
  }, [params]);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(q.trim() || category), 300);
    return () => clearTimeout(timer);
  }, [q, category]);
  return (
    <>
      <PageHeading
        eyebrow="GOOD IDEAS ARE EVERYWHERE"
        title="Follow your curiosity."
        description="Discover the small teams making a big difference."
      />
      <div className="search-box">
        <Search size={21} />
        <input
          aria-label="Search startups, products and people"
          placeholder="Startups, products, people, possibilities…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button
            className="icon-button"
            aria-label="Clear search"
            onClick={() => setQ("")}
          >
            <X size={17} />
          </button>
        )}
      </div>
      <div className="category-scroll">
        <button
          className={!category ? "active" : ""}
          onClick={() => setCategory("")}
        >
          For the curious
        </button>
        {data?.categories.map((c) => (
          <button
            key={c}
            className={category === c ? "active" : ""}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      {query ? (
        <section className="padded">
          <div className="tabs compact">
            {["all", "startups", "products", "people"].map((t) => (
              <button
                className={type === t ? "active" : ""}
                key={t}
                onClick={() => setType(t)}
              >
                {t}
              </button>
            ))}
          </div>
          {result.loading ? (
            <Loading />
          ) : result.error ? (
            <ErrorState error={result.error} retry={() => void result.load()} />
          ) : (
            result.data && (
              <>
                <div className="explore-grid">
                  {result.data.startups.map((s) => (
                    <StartupTile key={s.id} startup={s} />
                  ))}
                </div>
                {result.data.products.map((p) => (
                  <ProductRow key={p.id} product={p} />
                ))}
                {result.data.users.map((u) => (
                  <Link
                    className="person-result"
                    href={`/@${u.username}`}
                    key={u.id}
                  >
                    <Avatar name={u.displayName} url={u.avatarUrl} />
                    <span>
                      <strong>{u.displayName}</strong>
                      <small>@{u.username}</small>
                    </span>
                    <ArrowUpRight size={18} />
                  </Link>
                ))}
                {!result.data.startups.length &&
                  !result.data.products.length &&
                  !result.data.users.length && (
                    <Empty
                      title="No discoveries yet."
                      description="Try another name, category or a shorter search."
                    />
                  )}
              </>
            )
          )}
        </section>
      ) : loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} retry={() => void load()} />
      ) : (
        <>
          {!!history.data?.items.length && (
            <section className="recent-searches">
              <span>Recent</span>
              {history.data.items.slice(0, 5).map((h) => (
                <button key={h.id} onClick={() => setQ(h.query)}>
                  {h.query}
                </button>
              ))}
              <button
                className="text-button"
                onClick={() =>
                  void mutate("/search/history", undefined, "DELETE")
                    .then(history.load)
                    .catch((e) => toast(e.message))
                }
              >
                Clear
              </button>
            </section>
          )}
          <section className="explore-section">
            <div className="section-row">
              <div>
                <p className="eyebrow">WORTH A CLOSER LOOK</p>
                <h2>On the rise</h2>
              </div>
              <span className="editorial-number">01—</span>
            </div>
            <div className="explore-grid">
              {data?.trending.slice(0, 6).map((s) => (
                <StartupTile key={s.id} startup={s} />
              ))}
            </div>
          </section>
          <section className="explore-section">
            <div className="section-row">
              <div>
                <p className="eyebrow">FRESH IDEAS, FIRST LOOKS</p>
                <h2>New on the workbench</h2>
              </div>
              <span className="editorial-number">02—</span>
            </div>
            {data?.newProducts.map((p) => (
              <ProductRow key={p.id} product={p} />
            ))}
          </section>
          <section className="explore-section">
            <p className="eyebrow">THE PEOPLE BEHIND THE PRODUCTS</p>
            <h2>Meet the builders</h2>
            <div className="people-grid">
              {data?.founders.map((u) => (
                <Link href={`/@${u.username}`} key={u.id}>
                  <Avatar name={u.displayName} url={u.avatarUrl} size={52} />
                  <h3>{u.displayName}</h3>
                  <p>{u.bio}</p>
                  <span>
                    Meet the founder <ArrowUpRight size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
export function ProductRow({ product: p }: { product: Product }) {
  return (
    <Link className="product-row" href={`/product/${p.slug}`}>
      {p.imageUrl ? (
        <img
          src={safeUrl(p.imageUrl)}
          alt=""
          width={80}
          height={64}
          loading="lazy"
        />
      ) : (
        <span className="startup-mark">{p.name[0]}</span>
      )}
      <div>
        <strong>{p.name}</strong>
        <p>{p.description}</p>
        <small>
          {p.category} · {p.status.toLowerCase()}
        </small>
      </div>
      <ArrowUpRight size={18} />
    </Link>
  );
}
export function SavedPage() {
  const { user, requireAuth, toast } = useApp();
  const { data, error, loading, load, setData } = useResource<Page<Post>>(
    user ? "/saves" : null,
  );
  const collections = useResource<{ items: Collection[] }>(
    user ? "/collections" : null,
  );
  const [selected, setSelected] = useState<string | null>(null),
    [show, setShow] = useState(false),
    [name, setName] = useState("");
  const collection = useResource<{ collection: Collection }>(
    selected ? `/collections/${selected}` : null,
  );
  const posts = selected ? collection.data?.collection.items : data?.items;
  return (
    <>
      <PageHeading
        eyebrow="THE GOOD STUFF, KEPT CLOSE"
        title="Your little collection."
        description="Ideas to come back to. Products to try."
        action={
          user && (
            <button
              className="icon-button"
              onClick={() => setShow(true)}
              aria-label="Create collection"
            >
              <Plus size={22} />
            </button>
          )
        }
      />
      {!user ? (
        <Empty
          title="Keep what catches your eye."
          description="Sign in to save products and organize your discoveries."
          action={
            <button className="button primary" onClick={requireAuth}>
              Sign in
            </button>
          }
        />
      ) : (
        <>
          <div className="category-scroll">
            <button
              className={!selected ? "active" : ""}
              onClick={() => setSelected(null)}
            >
              <Bookmark size={15} />
              All saves
            </button>
            {collections.data?.items.map((c) => (
              <button
                className={selected === c.id ? "active" : ""}
                key={c.id}
                onClick={() => setSelected(c.id)}
              >
                {c.name} <span>{c.itemCount}</span>
              </button>
            ))}
          </div>
          {loading || collection.loading ? (
            <Loading />
          ) : error ? (
            <ErrorState error={error} retry={() => void load()} />
          ) : posts?.length ? (
            posts.map((p) => <PostCard key={p.id} post={p} />)
          ) : (
            <Empty
              title="Make room for a good idea."
              description="Products you save will appear here."
            />
          )}
          {!selected && data?.hasMore && (
            <button
              className="button secondary load-more"
              onClick={() =>
                void api<Page<Post>>(`/saves?cursor=${data.nextCursor}`)
                  .then((next) =>
                    setData({ ...next, items: [...data.items, ...next.items] }),
                  )
                  .catch((e) => toast(e.message))
              }
            >
              Load more saves
            </button>
          )}
        </>
      )}
      {show && (
        <Modal title="A new collection" onClose={() => setShow(false)}>
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              void mutate("/collections", { name })
                .then(() => {
                  setShow(false);
                  setName("");
                  return collections.load();
                })
                .catch((e) => toast(e.message));
            }}
          >
            <label>
              Name
              <input
                required
                maxLength={80}
                placeholder="Products to try"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button className="button primary">Create collection</button>
          </form>
        </Modal>
      )}
    </>
  );
}
