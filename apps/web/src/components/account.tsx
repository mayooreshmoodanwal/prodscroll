"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  LogOut,
  Monitor,
  Download,
  Shield,
  ArrowUpRight,
} from "lucide-react";
import { useResource } from "../lib/hooks";
import { useApp } from "../lib/context";
import { api, mutate, ago, API_URL } from "../lib/api";
import type { Notification, Page, User } from "../lib/types";
import { Avatar, PageHeading, Loading, Empty, ErrorState, Modal } from "./ui";
export function NotificationsPage() {
  const { user, requireAuth, setUnread, toast } = useApp();
  const { data, loading, error, load, setData } = useResource<
    Page<Notification>
  >(user ? "/notifications" : null);
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE NEWS FROM YOUR CIRCLE"
        title="You’re part of something."
        action={
          user && (
            <button
              className="text-button"
              onClick={() =>
                void mutate("/notifications/read", {}, "PUT")
                  .then(() => {
                    setUnread(0);
                    return load();
                  })
                  .catch((e) => toast(e.message))
              }
            >
              <Check size={16} />
              Mark all read
            </button>
          )
        }
      />
      {!user ? (
        <Empty
          title="Your community is waiting."
          action={
            <button className="button primary" onClick={requireAuth}>
              Sign in
            </button>
          }
        />
      ) : loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} retry={() => void load()} />
      ) : !data?.items.length ? (
        <Empty
          title="All quiet for now."
          description="Follows, replies and updates from your circle will appear here."
        />
      ) : (
        <div className="notifications-list">
          {data.items.map((n) => (
            <Link
              className={`notification-row ${!n.readAt ? "unread" : ""}`}
              key={n.id}
              href={
                n.postId
                  ? `/post/${n.postId}`
                  : n.type === "MESSAGE"
                    ? "/messages"
                    : n.actor
                      ? `/@${n.actor.username}`
                      : "/"
              }
              onClick={() => {
                void mutate("/notifications/read", { ids: [n.id] }, "PUT")
                  .then(load)
                  .catch(() => undefined);
              }}
            >
              {n.actor ? (
                <Avatar
                  name={n.actor.displayName}
                  url={n.actor.avatarUrl}
                  size={44}
                />
              ) : (
                <Bell size={24} />
              )}
              <div>
                <p>{n.body}</p>
                <time>{ago(n.createdAt)} ago</time>
              </div>
              {!n.readAt && <span className="unread-dot" />}
            </Link>
          ))}
          {data.hasMore && (
            <button
              className="text-button load-more"
              onClick={() =>
                void api<Page<Notification>>(
                  `/notifications?cursor=${data.nextCursor}`,
                )
                  .then((next) =>
                    setData({ ...next, items: [...data.items, ...next.items] }),
                  )
                  .catch((e) => toast(e.message))
              }
            >
              Load more
            </button>
          )}
        </div>
      )}
    </>
  );
}
interface Session {
  id: string;
  userAgent: string;
  createdAt: string;
  lastUsedAt: string;
}
export function SettingsPage() {
  const { user, requireAuth, refreshUser, setUser, toast } = useApp();
  const sessions = useResource<{ items: Session[] }>(
    user ? "/auth/sessions" : null,
  );
  const preferences = useResource<{
    inApp: boolean;
    push: boolean;
    email: boolean;
  }>(user ? "/notifications/preferences" : null);
  const requests = useResource<{ items: User[] }>(
    user ? "/users/me/follow-requests" : null,
  );
  const [theme, setTheme] = useState("light"),
    [deleting, setDeleting] = useState(false),
    [password, setPassword] = useState("");
  useEffect(() => {
    setTheme(localStorage.getItem("ps-theme") || "light");
  }, []);
  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    try {
      await mutate(
        "/users/me",
        {
          displayName: f.get("displayName"),
          bio: f.get("bio"),
          location: f.get("location"),
          website: f.get("website"),
          privateAccount: f.get("privateAccount") === "on",
          activityVisible: f.get("activityVisible") === "on",
          messageControl: f.get("messageControl"),
        },
        "PATCH",
      );
      await refreshUser();
      toast("Your profile has been updated.");
    } catch (e) {
      toast((e as Error).message);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="MAKE YOURSELF AT HOME"
        title="Your space. Your choices."
      />
      {!user ? (
        <Empty
          title="Make it yours."
          action={
            <button className="button primary" onClick={requireAuth}>
              Sign in
            </button>
          }
        />
      ) : (
        <div className="settings">
          <section>
            <h2>Profile</h2>
            <form className="form" onSubmit={updateProfile}>
              <label>
                Display name
                <input
                  name="displayName"
                  required
                  minLength={2}
                  maxLength={60}
                  defaultValue={user.displayName}
                />
              </label>
              <label>
                Bio
                <textarea
                  name="bio"
                  maxLength={300}
                  defaultValue={user.bio}
                  rows={3}
                />
              </label>
              <div className="form-columns">
                <label>
                  Location
                  <input
                    name="location"
                    maxLength={100}
                    defaultValue={user.location}
                  />
                </label>
                <label>
                  Website
                  <input
                    name="website"
                    type="url"
                    defaultValue={user.website}
                  />
                </label>
              </div>
              <label className="check-label">
                <input
                  type="checkbox"
                  name="privateAccount"
                  defaultChecked={user.privateAccount}
                />
                <span>
                  Private account
                  <small>Only accepted followers can see your posts.</small>
                </span>
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  name="activityVisible"
                  defaultChecked={user.activityVisible !== false}
                />
                <span>Show activity status</span>
              </label>
              <label>
                Who can message you?
                <select
                  name="messageControl"
                  defaultValue={user.messageControl || "EVERYONE"}
                >
                  <option value="EVERYONE">
                    Everyone, with message requests
                  </option>
                  <option value="FOLLOWING">People I follow</option>
                  <option value="NOBODY">Nobody</option>
                </select>
              </label>
              <button className="button primary">Save changes</button>
            </form>
            <small className="account-id">Account ID: {user.id}</small>
          </section>
          {!user.verified && (
            <section className="notice">
              <h2>Verify your email</h2>
              <p>
                Check your email to unlock posting, messaging and social
                interactions.
              </p>
              <button
                className="button secondary"
                onClick={() =>
                  void mutate("/auth/resend-verification", {})
                    .then(() => toast("Verification email sent."))
                    .catch((e) => toast(e.message))
                }
              >
                Resend verification email
              </button>
            </section>
          )}
          {!!requests.data?.items.length && (
            <section>
              <h2>Follow requests</h2>
              {requests.data.items.map((u) => (
                <div className="person-result" key={u.id}>
                  <Avatar name={u.displayName} />
                  <strong>{u.displayName}</strong>
                  <button
                    className="button secondary"
                    onClick={() =>
                      void mutate(
                        `/users/${u.id}/follow-request`,
                        { accepted: true },
                        "PUT",
                      )
                        .then(requests.load)
                        .catch((e) => toast(e.message))
                    }
                  >
                    Accept
                  </button>
                  <button
                    className="text-button"
                    onClick={() =>
                      void mutate(
                        `/users/${u.id}/follow-request`,
                        { accepted: false },
                        "PUT",
                      )
                        .then(requests.load)
                        .catch((e) => toast(e.message))
                    }
                  >
                    Decline
                  </button>
                </div>
              ))}
            </section>
          )}
          <section>
            <h2>Notifications</h2>
            {preferences.data &&
              (["inApp", "email", "push"] as const).map((key) => (
                <label className="check-label" key={key}>
                  <input
                    type="checkbox"
                    checked={preferences.data![key]}
                    onChange={async (e) => {
                      const willEnable = e.target.checked;
                      if (key === "push" && willEnable) {
                        if (
                          typeof window !== "undefined" &&
                          "Notification" in window
                        ) {
                          if (Notification.permission === "default") {
                            const res = await Notification.requestPermission();
                            if (res !== "granted") {
                              toast(
                                "Allow notification permissions in your browser to receive device alerts.",
                              );
                            } else {
                              toast("Device push notifications enabled!");
                            }
                          } else if (Notification.permission === "denied") {
                            toast(
                              "Notifications are blocked in your browser settings. Please allow notifications for this site.",
                            );
                          } else {
                            toast("Device push notifications enabled!");
                          }
                          if ("serviceWorker" in navigator) {
                            navigator.serviceWorker
                              .register("/sw.js")
                              .catch(() => {});
                          }
                        }
                      }
                      const next = {
                        inApp: preferences.data!.inApp,
                        email: preferences.data!.email,
                        push: preferences.data!.push,
                        [key]: willEnable,
                      };
                      void mutate("/notifications/preferences", next, "PUT")
                        .then(preferences.load)
                        .catch((e) => toast(e.message));
                    }}
                  />
                  <span>
                    {key === "inApp"
                      ? "In-app notifications"
                      : key === "email"
                        ? "Email notifications"
                        : "Push notifications"}
                    <small>
                      {key === "inApp"
                        ? "Notification bell and activity feed updates."
                        : key === "email"
                          ? "Direct emails when someone messages you or someone you follow posts."
                          : "Alerts delivered to your device notification panel and lock screen."}
                    </small>
                  </span>
                </label>
              ))}
          </section>
          <section>
            <h2>Appearance</h2>
            <div className="theme-choices">
              {["light", "dark"].map((value) => (
                <button
                  key={value}
                  className={`button ${theme === value ? "primary" : "secondary"}`}
                  onClick={() => {
                    setTheme(value);
                    localStorage.setItem("ps-theme", value);
                    document.documentElement.dataset.theme = value;
                  }}
                >
                  {value === "light" ? "Daylight" : "After hours"}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2>Your devices</h2>
            <p className="muted">Remove any device you don’t recognize.</p>
            {sessions.data?.items.map((s) => (
              <div className="session-row" key={s.id}>
                <Monitor size={22} />
                <div>
                  <strong>
                    {/iPhone|Android/.test(s.userAgent)
                      ? "Mobile device"
                      : "Browser session"}
                  </strong>
                  <small>Signed in {ago(s.createdAt)} ago</small>
                </div>
                <button
                  className="text-button"
                  onClick={() =>
                    void mutate(`/auth/sessions/${s.id}`, undefined, "DELETE")
                      .then(async () => {
                        await sessions.load();
                        await refreshUser();
                      })
                      .catch((e) => toast(e.message))
                  }
                >
                  Log out
                </button>
              </div>
            ))}
            <button
              className="button secondary"
              onClick={() =>
                void mutate("/auth/logout-all", {})
                  .then(() => setUser(null))
                  .catch((e) => toast(e.message))
              }
            >
              <LogOut size={16} />
              Log out of all devices
            </button>
          </section>
          <section>
            <h2>Your data belongs to you</h2>
            <a className="button secondary" href={`${API_URL}/users/me/export`}>
              <Download size={17} />
              Download account data
            </a>
            <button
              className="text-button danger"
              onClick={() => setDeleting(true)}
            >
              Delete account
            </button>
          </section>
          <button
            className="button secondary"
            onClick={() =>
              void mutate("/auth/logout", {})
                .then(() => setUser(null))
                .catch((e) => toast(e.message))
            }
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      )}
      {deleting && (
        <Modal title="Delete your account" onClose={() => setDeleting(false)}>
          <p>
            This permanently deletes your account, posts, saved items, and
            messages. Startup owners must transfer or delete their startups
            first.
          </p>
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              void mutate("/users/me", { password }, "DELETE")
                .then(() => {
                  setUser(null);
                  setDeleting(false);
                  toast("Your account has been deleted.");
                })
                .catch((e) => toast(e.message));
            }}
          >
            <label>
              Confirm your password
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="button danger">Delete permanently</button>
          </form>
        </Modal>
      )}
    </>
  );
}
interface Report {
  id: string;
  reason: string;
  details: string;
  status: string;
  createdAt: string;
  reporter: User;
  post?: { id: string; caption: string };
  user?: User;
}
interface Verification {
  id: string;
  evidence: string;
  status: string;
  startup: { name: string };
}
export function AdminPage() {
  const { user, toast } = useApp();
  const [tab, setTab] = useState("Overview"),
    [note, setNote] = useState(""),
    [query, setQuery] = useState("");
  const allowed = !!user && ["ADMIN", "MODERATOR"].includes(user.role);
  const stats = useResource<Record<string, number>>(
    allowed ? "/admin/stats" : null,
  );
  const reports = useResource<{ items: Report[] }>(
    allowed && tab === "Reports" ? "/admin/reports" : null,
  );
  const verification = useResource<{ items: Verification[] }>(
    allowed && tab === "Verification" ? "/admin/verifications" : null,
  );
  const flags = useResource<{ items: { key: string; enabled: boolean }[] }>(
    user?.role === "ADMIN" && tab === "Feature flags" ? "/admin/flags" : null,
  );
  const users = useResource<{ items: (User & { suspended: boolean })[] }>(
    user?.role === "ADMIN" && tab === "Users"
      ? `/admin/users?q=${encodeURIComponent(query)}`
      : null,
  );
  const audit = useResource<{
    items: { id: string; action: string; detail: string; createdAt: string }[];
  }>(allowed && tab === "Audit log" ? "/admin/audit" : null);
  const jobs = useResource<{
    items: { id: string; queue: string; reason: string; attempts: number }[];
  }>(user?.role === "ADMIN" && tab === "Jobs" ? "/admin/jobs" : null);
  return (
    <>
      <PageHeading
        eyebrow="COMMUNITY OPERATIONS"
        title="Keep the community healthy."
      />
      {!allowed ? (
        <Empty
          title="A protected workspace."
          description="A moderator or administrator account is required."
        />
      ) : (
        <>
          <div className="tabs admin-tabs">
            {[
              "Overview",
              "Reports",
              "Verification",
              "Audit log",
              ...(user?.role === "ADMIN"
                ? ["Users", "Feature flags", "Jobs"]
                : []),
            ].map((t) => (
              <button
                className={tab === t ? "active" : ""}
                key={t}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <section className="padded">
            {tab === "Overview" && (
              <>
                <div className="metrics operational">
                  {[
                    ["users", "Accounts"],
                    ["activeUsers", "Active users today"],
                    ["signupsToday", "Signups today"],
                    ["reels", "Published reels"],
                    ["openReports", "Open reports"],
                    ["failedJobs", "Failed jobs"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <strong>{stats.data?.[key] ?? "—"}</strong>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <p className="muted">
                  Operational counts are calculated from persisted records.
                  Refresh to see current state.
                </p>
                <button
                  className="button secondary"
                  onClick={() => void stats.load()}
                >
                  Refresh counts
                </button>
              </>
            )}
            {(tab === "Reports" || tab === "Verification") && (
              <label className="form">
                Review note
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  minLength={5}
                  placeholder="Record the reason for your decision."
                  rows={3}
                />
              </label>
            )}
            {tab === "Reports" &&
              (reports.data?.items.length ? (
                reports.data.items.map((r) => (
                  <article className="review-item" key={r.id}>
                    <div className="section-row">
                      <strong>{r.reason}</strong>
                      <span className="eyebrow">{r.status}</span>
                    </div>
                    <p>{r.post?.caption || r.user?.displayName || r.details}</p>
                    <small>Reported by {r.reporter.displayName}</small>
                    <div className="studio-actions">
                      {[
                        "DISMISS",
                        "WARN",
                        "REMOVE_CONTENT",
                        "SUSPEND_USER",
                      ].map((action) => (
                        <button
                          className="button secondary"
                          key={action}
                          disabled={
                            note.trim().length < 5 || r.status !== "OPEN"
                          }
                          onClick={() =>
                            void mutate(`/admin/reports/${r.id}/action`, {
                              action,
                              note,
                            })
                              .then(reports.load)
                              .catch((e) => toast(e.message))
                          }
                        >
                          {action.toLowerCase().replaceAll("_", " ")}
                        </button>
                      ))}
                    </div>
                  </article>
                ))
              ) : (
                <Empty title="No reports to review." />
              ))}
            {tab === "Verification" &&
              (verification.data?.items.length ? (
                verification.data.items.map((v) => (
                  <article className="review-item" key={v.id}>
                    <h3>{v.startup.name}</h3>
                    <p>{v.evidence}</p>
                    <span>{v.status}</span>
                    <div className="studio-actions">
                      {[true, false].map((approved) => (
                        <button
                          key={String(approved)}
                          className="button secondary"
                          disabled={note.length < 5}
                          onClick={() =>
                            void mutate(`/admin/verifications/${v.id}`, {
                              approved,
                              note,
                            })
                              .then(verification.load)
                              .catch((e) => toast(e.message))
                          }
                        >
                          {approved ? "Verify startup" : "Reject application"}
                        </button>
                      ))}
                    </div>
                  </article>
                ))
              ) : (
                <Empty title="No verification requests." />
              ))}
            {tab === "Feature flags" &&
              flags.data?.items.map((flag) => (
                <label className="check-label" key={flag.key}>
                  <input
                    type="checkbox"
                    checked={flag.enabled}
                    disabled={flag.key === "investment_module"}
                    onChange={(e) =>
                      void mutate(
                        `/admin/flags/${flag.key}`,
                        { enabled: e.target.checked },
                        "PUT",
                      )
                        .then(flags.load)
                        .catch((e) => toast(e.message))
                    }
                  />
                  <span>
                    {flag.key.replaceAll("_", " ")}
                    {flag.key === "investment_module" && (
                      <small>Reserved and disabled in this version.</small>
                    )}
                  </span>
                </label>
              ))}
            {tab === "Users" && (
              <>
                <div className="search-box modal-search">
                  <input
                    aria-label="Search accounts"
                    placeholder="Username prefix or exact email"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                {users.data?.items.map((u) => (
                  <div className="person-result" key={u.id}>
                    <Avatar name={u.displayName} />
                    <Link href={`/@${u.username}`}>
                      {u.displayName}
                      <small>@{u.username}</small>
                    </Link>
                    <button
                      className="button secondary"
                      disabled={u.id === user?.id}
                      onClick={() =>
                        void mutate(
                          `/admin/users/${u.id}`,
                          { suspended: !u.suspended },
                          "PATCH",
                        )
                          .then(users.load)
                          .catch((e) => toast(e.message))
                      }
                    >
                      {u.suspended ? "Restore" : "Suspend"}
                    </button>
                  </div>
                ))}
              </>
            )}
            {tab === "Audit log" &&
              audit.data?.items.map((a) => (
                <div className="review-item" key={a.id}>
                  <strong>{a.action}</strong>
                  <p>{a.detail}</p>
                  <small>{new Date(a.createdAt).toLocaleString()}</small>
                </div>
              ))}
            {tab === "Jobs" &&
              (jobs.data?.items.length ? (
                jobs.data.items.map((j) => (
                  <div className="review-item" key={j.id}>
                    <strong>{j.queue}</strong>
                    <p>{j.reason}</p>
                    <small>{j.attempts} attempts</small>
                    <button
                      className="button secondary"
                      onClick={() =>
                        void mutate(`/admin/jobs/${j.id}/retry`, {})
                          .then(jobs.load)
                          .catch((e) => toast(e.message))
                      }
                    >
                      Retry job
                    </button>
                  </div>
                ))
              ) : (
                <Empty title="No failed background jobs." />
              ))}
            <div className="admin-note">
              <Shield size={16} />
              Every operational action is authorized by the API and recorded in
              the audit log.
              <a href="http://localhost:4000/api/docs">
                API docs <ArrowUpRight size={12} />
              </a>
            </div>
          </section>
        </>
      )}
    </>
  );
}
