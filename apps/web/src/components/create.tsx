"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ImagePlus,
  UploadCloud,
  X,
  Check,
  Plus,
  ArrowUpRight,
  RotateCcw,
} from "lucide-react";
import { useResource } from "../lib/hooks";
import { useApp } from "../lib/context";
import { api, mutate } from "../lib/api";
import type { Startup, Post, Media } from "../lib/types";
import { PageHeading, Empty, Spinner, Modal, ErrorState } from "./ui";
interface Upload {
  key: string;
  file: File;
  progress: number;
  status: "waiting" | "uploading" | "processing" | "ready" | "failed";
  assetId?: string;
  error?: string;
}
export function CreatePage() {
  const { user, requireAuth, toast } = useApp();
  const router = useRouter();
  const startups = useResource<{ items: Startup[] }>(
    user ? "/founder/startups" : null,
  );
  const drafts = useResource<{ items: Post[] }>(user ? "/drafts" : null);
  const [caption, setCaption] = useState(""),
    [kind, setKind] = useState("POST"),
    [startupId, setStartupId] = useState(""),
    [productId, setProductId] = useState(""),
    [tags, setTags] = useState(""),
    [uploads, setUploads] = useState<Upload[]>([]),
    [saving, setSaving] = useState(false),
    [preview, setPreview] = useState(false);
  const requests = useRef(new Map<string, XMLHttpRequest>());
  const stopped = useRef(false);
  const selected = startups.data?.items.find((s) => s.id === startupId);
  const detail = useResource<{ startup: Startup }>(
    selected ? `/startups/${selected.slug}` : null,
  );
  useEffect(() => {
    setCaption(localStorage.getItem("ps-post-draft") || "");
    stopped.current = false;
    return () => {
      stopped.current = true;
      for (const xhr of requests.current.values()) xhr.abort();
    };
  }, []);
  function update(key: string, changes: Partial<Upload>) {
    if (!stopped.current)
      setUploads((list) =>
        list.map((u) => (u.key === key ? { ...u, ...changes } : u)),
      );
  }
  async function upload(item: Upload) {
    update(item.key, { status: "uploading", error: undefined });
    try {
      const spec = await mutate<{
        assetId: string;
        uploadUrl: string;
        headers: Record<string, string>;
      }>("/media/upload-url", {
        filename: item.file.name,
        mimeType: item.file.type,
        size: item.file.size,
      });
      update(item.key, { assetId: spec.assetId });
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        requests.current.set(item.key, xhr);
        xhr.open("PUT", spec.uploadUrl);
        for (const [name, value] of Object.entries(spec.headers))
          xhr.setRequestHeader(name, value);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable)
            update(item.key, {
              progress: Math.round((e.loaded / e.total) * 100),
            });
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error("The upload failed. Your draft is safe."));
        xhr.onerror = () =>
          reject(new Error("Connection lost. Retry when you’re ready."));
        xhr.onabort = () => reject(new Error("Upload cancelled."));
        xhr.send(item.file);
      });
      requests.current.delete(item.key);
      update(item.key, { status: "processing", progress: 100 });
      await mutate(`/media/${spec.assetId}/complete`, {});
      for (let i = 0; i < 240 && !stopped.current; i++) {
        const { media } = await api<{ media: Media }>(`/media/${spec.assetId}`);
        if (media.processingStatus === "READY") {
          update(item.key, { status: "ready" });
          return;
        }
        if (media.processingStatus === "FAILED")
          throw new Error(
            "This file could not be processed. Try another file.",
          );
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
      if (!stopped.current)
        throw new Error(
          "Processing is taking longer than expected. Check again shortly.",
        );
    } catch (e) {
      update(item.key, { status: "failed", error: (e as Error).message });
    }
  }
  async function publish(draft = false) {
    if (!requireAuth()) return;
    setSaving(true);
    try {
      const { post } = await mutate<{ post: Post }>("/posts", {
        caption,
        kind,
        startupId: startupId || undefined,
        productId: productId || undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        mediaIds: uploads
          .filter((u) => u.status === "ready")
          .map((u) => u.assetId),
        draft,
      });
      localStorage.removeItem("ps-post-draft");
      setCaption("");
      toast(
        draft
          ? "Draft saved. Pick it up whenever you’re ready."
          : "Your update is out in the world.",
      );
      if (draft) await drafts.load();
      else router.push(`/post/${post.id}`);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="THE WORK IS WORTH SHARING"
        title="What are you building?"
        description="A first sketch. A small win. Something ready for the world."
      />
      {!user ? (
        <Empty
          title="Your next chapter starts here."
          description="Sign in to share your work with curious people."
          action={
            <button className="button primary" onClick={requireAuth}>
              Sign in to create
            </button>
          }
        />
      ) : (
        <div className="padded">
          <div className="tabs creation-types">
            {[
              ["POST", "Post"],
              ["REEL", "Product reel"],
              ["UPDATE", "Update"],
              ...(user.role === "FOUNDER" ? [["LAUNCH", "Launch"]] : []),
            ].map(([value, label]) => (
              <button
                key={value}
                className={kind === value ? "active" : ""}
                onClick={() => setKind(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <form
            className="form create-form"
            onSubmit={(e) => {
              e.preventDefault();
              void publish();
            }}
          >
            <label className="caption-label">
              The story
              <textarea
                placeholder="Tell us what’s new. The messy middle is welcome, too."
                rows={6}
                required
                maxLength={5000}
                value={caption}
                onChange={(e) => {
                  setCaption(e.target.value);
                  localStorage.setItem("ps-post-draft", e.target.value);
                }}
              />
              <small>{caption.length}/5,000 · Draft saved on this device</small>
            </label>
            <label className="upload-zone">
              <ImagePlus size={30} />
              <strong>Give your idea a little context.</strong>
              <span>Add images or a product demo</span>
              <small>
                JPG, PNG, WebP up to 15 MB · MP4, MOV, WebM up to 100 MB
              </small>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []).slice(
                    0,
                    10 - uploads.length,
                  );
                  const newUploads = files.map((file) => ({
                    key: crypto.randomUUID(),
                    file,
                    progress: 0,
                    status: "waiting" as const,
                  }));
                  setUploads((list) => [...list, ...newUploads]);
                  for (const item of newUploads) void upload(item);
                  e.target.value = "";
                }}
              />
            </label>
            {uploads.map((u) => (
              <div className="upload-row" key={u.key}>
                <UploadCloud size={22} />
                <div>
                  <strong>{u.file.name}</strong>
                  <small>
                    {u.status === "ready"
                      ? "Ready to publish"
                      : u.status === "processing"
                        ? "Processing media in the background…"
                        : u.error || `${u.progress}% uploaded`}
                  </small>
                  <progress
                    value={u.status === "ready" ? 100 : u.progress}
                    max={100}
                  />
                </div>
                {u.status === "ready" ? (
                  <Check size={20} />
                ) : u.status === "failed" ? (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Retry upload"
                    onClick={() => void upload(u)}
                  >
                    <RotateCcw size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Cancel upload"
                    onClick={() => {
                      requests.current.get(u.key)?.abort();
                      setUploads((list) =>
                        list.filter((item) => item.key !== u.key),
                      );
                    }}
                  >
                    <X size={19} />
                  </button>
                )}
              </div>
            ))}
            {!!startups.data?.items.length && (
              <>
                <label>
                  Startup
                  <select
                    value={startupId}
                    onChange={(e) => {
                      setStartupId(e.target.value);
                      setProductId("");
                    }}
                  >
                    <option value="">A personal update</option>
                    {startups.data.items.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                {startupId && (
                  <label>
                    Product
                    <select
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                    >
                      <option value="">No specific product</option>
                      {detail.data?.startup.products?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </>
            )}
            <label>
              Tags
              <input
                placeholder="Design, Building in public"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <small>Separate with commas. Up to 10 tags.</small>
            </label>
            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setPreview(true)}
              >
                Preview
              </button>
              <button
                type="button"
                className="text-button"
                disabled={!caption || saving}
                onClick={() => void publish(true)}
              >
                Save draft
              </button>
              <button
                className="button primary"
                disabled={
                  saving ||
                  uploads.some((u) => u.status !== "ready") ||
                  !caption
                }
              >
                {saving ? <Spinner /> : "Publish update"}
                <ArrowUpRight size={17} />
              </button>
            </div>
          </form>
          {!!drafts.data?.items.length && (
            <section className="draft-list">
              <h2>Pick up where you left off</h2>
              {drafts.data.items.map((p) => (
                <div key={p.id}>
                  <p>{p.caption}</p>
                  <button
                    className="button secondary"
                    onClick={() =>
                      void mutate(`/posts/${p.id}/publish`, {})
                        .then(() => {
                          toast("Draft published.");
                          return drafts.load();
                        })
                        .catch((e) => toast(e.message))
                    }
                  >
                    Publish draft
                  </button>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
      {preview && (
        <Modal
          title="Your update, at a glance"
          onClose={() => setPreview(false)}
        >
          <p className="eyebrow">{kind}</p>
          <p className="preview-caption">
            {caption || "Your story goes here."}
          </p>
          <p className="muted">
            {uploads.filter((u) => u.status === "ready").length} media files
            ready · {selected?.name || user?.displayName}
          </p>
        </Modal>
      )}
    </>
  );
}
export function FounderPage() {
  const { user, requireAuth, toast } = useApp();
  const { data, error, load } = useResource<{ items: Startup[] }>(
    user ? "/founder/startups" : null,
  );
  const [show, setShow] = useState<
      "startup" | "product" | "verify" | "member" | null
    >(null),
    [selected, setSelected] = useState("");
  const categories = useResource<{ items: string[] }>("/categories");
  const current = data?.items.find((s) => s.id === selected) || data?.items[0];
  const analytics = useResource<{
    followers: number;
    profileVisits: number;
    uniqueViewers: number;
    saves: number;
    completionRate: number;
    posts: {
      id: string;
      caption: string;
      likeCount: number;
      commentCount: number;
      saveCount: number;
    }[];
  }>(current ? `/startups/${current.id}/analytics` : null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      if (show === "startup") await mutate("/startups", f);
      else if (show === "product")
        await mutate(`/startups/${current?.id}/products`, f);
      else if (show === "verify")
        await mutate(`/startups/${current?.id}/verification`, f);
      else if (show === "member")
        await mutate(`/startups/${current?.id}/members`, f, "PUT");
      setShow(null);
      toast("Your changes have been saved.");
      await load();
    } catch (e) {
      toast((e as Error).message);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="BEHIND THE BUILD"
        title="Founder studio."
        description="A home for your work, your team, and the people following along."
        action={
          <button
            className="button primary"
            onClick={() => {
              if (requireAuth()) setShow("startup");
            }}
          >
            <Plus size={17} />
            New startup
          </button>
        }
      />
      {!user ? (
        <Empty
          title="Build something worth following."
          action={
            <button className="button primary" onClick={requireAuth}>
              Sign in
            </button>
          }
        />
      ) : error ? (
        <ErrorState error={error} retry={() => void load()} />
      ) : !current ? (
        <Empty
          title="Your first startup starts here."
          description="Create your startup profile, then share the journey."
        />
      ) : (
        <div className="padded">
          <label className="form">
            Your startup
            <select
              value={current.id}
              onChange={(e) => setSelected(e.target.value)}
            >
              {data?.items.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <section className="studio-startup">
            <div>
              <h2>{current.name}</h2>
              <p>{current.pitch}</p>
            </div>
            <Link
              href={`/startup/${current.slug}`}
              className="button secondary"
            >
              View page <ArrowUpRight size={16} />
            </Link>
          </section>
          <div className="studio-actions">
            <button
              className="button secondary"
              onClick={() => setShow("product")}
            >
              Add product
            </button>
            <button
              className="button secondary"
              onClick={() => setShow("member")}
            >
              Add teammate
            </button>
            <button
              className="button secondary"
              onClick={() => setShow("verify")}
            >
              {current.verified
                ? "Verification details"
                : "Request verification"}
            </button>
            <Link className="button primary" href="/create">
              Share an update
            </Link>
          </div>
          <section className="founder-analytics">
            <p className="eyebrow">YOUR LAST 30 DAYS</p>
            <h2>A little perspective on your progress.</h2>
            <div className="metrics">
              <div>
                <strong>{analytics.data?.profileVisits || 0}</strong>
                <span>Profile visits</span>
              </div>
              <div>
                <strong>{analytics.data?.uniqueViewers || 0}</strong>
                <span>Unique reel viewers</span>
              </div>
              <div>
                <strong>{analytics.data?.saves || 0}</strong>
                <span>Post saves</span>
              </div>
              <div>
                <strong>{current.followerCount}</strong>
                <span>Followers</span>
              </div>
            </div>
            <p className="muted">
              Views are based on recorded activity. No individual audience
              identities are shared.
            </p>
            {analytics.data?.posts.slice(0, 10).map((p) => (
              <Link
                className="performance-row"
                key={p.id}
                href={`/post/${p.id}`}
              >
                <span>{p.caption.slice(0, 85)}</span>
                <small>
                  {p.likeCount} likes · {p.saveCount} saves
                </small>
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </section>
        </div>
      )}
      {show && (
        <Modal
          title={
            show === "startup"
              ? "Introduce your startup"
              : show === "product"
                ? "What are you building?"
                : show === "member"
                  ? "Bring your team along"
                  : "Request startup verification"
          }
          onClose={() => setShow(null)}
        >
          <form className="form" onSubmit={submit}>
            {show === "startup" || show === "product" ? (
              <>
                <label>
                  Name
                  <input name="name" required minLength={2} maxLength={80} />
                </label>
                <label>
                  URL slug
                  <input
                    name="slug"
                    required
                    pattern="[a-z0-9-]+"
                    placeholder="your-startup"
                    maxLength={80}
                  />
                </label>
                {show === "startup" && (
                  <label>
                    One-line pitch
                    <input
                      name="pitch"
                      required
                      minLength={5}
                      maxLength={160}
                    />
                  </label>
                )}
                <label>
                  Description
                  <textarea
                    name="description"
                    required
                    minLength={5}
                    maxLength={5000}
                    rows={4}
                  />
                </label>
                <label>
                  Category
                  <select name="category">
                    {categories.data?.items.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                {show === "product" && (
                  <label>
                    Status
                    <select name="status">
                      {[
                        "CONCEPT",
                        "PROTOTYPE",
                        "BETA",
                        "LAUNCHED",
                        "DISCONTINUED",
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                )}
              </>
            ) : show === "member" ? (
              <>
                <label>
                  Teammate’s account ID
                  <input name="userId" required />
                  <small>
                    Use their ProductScroll account ID from their account
                    settings.
                  </small>
                </label>
                <label>
                  Role
                  <select name="role">
                    <option value="CONTENT_MANAGER">Content manager</option>
                    <option value="ANALYST">Analyst</option>
                    <option value="ADMIN">Startup admin</option>
                  </select>
                </label>
              </>
            ) : (
              <>
                <p className="muted">
                  A moderator reviews your evidence. Verification is never
                  granted automatically.
                </p>
                <label>
                  Official website and evidence
                  <textarea
                    name="evidence"
                    required
                    minLength={20}
                    maxLength={3000}
                    rows={5}
                  />
                </label>
              </>
            )}
            <button className="button primary">
              {show === "verify" ? "Submit for review" : "Save"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
