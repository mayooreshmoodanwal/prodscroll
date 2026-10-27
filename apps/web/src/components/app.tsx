"use client";
import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Home,
  Compass,
  Users,
  Bookmark,
  MessageCircle,
  Bell,
  Plus,
  Settings,
  UserRound,
  Clapperboard,
  Shield,
  BriefcaseBusiness,
  Search,
} from "lucide-react";
import { API_URL } from "../lib/api";
import { useApp } from "../lib/context";
import { useResource } from "../lib/hooks";
import type { Explore } from "../lib/types";
import { Avatar, Loading } from "./ui";
import { AuthModal, Onboarding, TokenPage } from "./auth";
import { Reels } from "./reels";
import { Feed, PostPage } from "./feed";
import { ExplorePage, SavedPage } from "./explore";
import { ProfilePage, StartupPage, ProductPage } from "./profiles";
import { CreatePage, FounderPage } from "./create";
import { Inbox } from "./inbox";
import { NotificationsPage, SettingsPage, AdminPage } from "./account";
const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/following", label: "Following", icon: Users },
  { href: "/reels", label: "Product reels", icon: Clapperboard },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/notifications", label: "Notifications", icon: Bell },
];
function Route() {
  const path = usePathname();
  if (path === "/reels") return <Reels />;
  if (path === "/explore") return <ExplorePage />;
  if (path === "/saved") return <SavedPage />;
  if (path === "/messages") return <Inbox />;
  if (path === "/notifications") return <NotificationsPage />;
  if (path === "/create") return <CreatePage />;
  if (path === "/founder") return <FounderPage />;
  if (path === "/settings") return <SettingsPage />;
  if (path === "/admin") return <AdminPage />;
  if (path === "/verify" || path === "/reset")
    return <TokenPage kind={path.slice(1)} />;
  if (path.startsWith("/startup/") || path.startsWith("/app/startup/"))
    return <StartupPage slug={path.split("/").at(-1)!} />;
  if (path.startsWith("/product/") || path.startsWith("/app/product/"))
    return <ProductPage slug={path.split("/").at(-1)!} />;
  if (path.startsWith("/@") || path.startsWith("/app/@"))
    return <ProfilePage username={path.split("@")[1]} />;
  if (path.startsWith("/post/") || path.startsWith("/app/reel/"))
    return <PostPage id={path.split("/").at(-1)!} />;
  return (
    <Feed
      mode={
        path === "/following"
          ? "following"
          : path === "/reels"
            ? "reels"
            : "for-you"
      }
    />
  );
}
export function ProductScroll() {
  const path = usePathname();
  const { user, authOpen, setAuthOpen, unread } = useApp();
  const { data } = useResource<Explore>("/explore");
  const active = (href: string) => path === href;
  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <div className={`app-shell ${path === "/reels" ? "reels-shell" : ""}`}>
        <aside className="navigation">
          <Link className="brand" href="/" aria-label="ProductScroll home">
            <span className="brand-symbol">
              p<span>↗</span>
            </span>
            <span>
              productscroll<span className="brand-dot">.</span>
            </span>
          </Link>
          <div className="nav-caption">THE BUILDERS’ NETWORK</div>
          <nav aria-label="Main navigation">
            {nav.map((item) => (
              <Link
                key={item.href}
                aria-label={item.label}
                href={item.href}
                className={`nav-item ${active(item.href) ? "active" : ""}`}
              >
                <item.icon
                  size={21}
                  strokeWidth={active(item.href) ? 2.3 : 1.7}
                />
                <span>{item.label}</span>
                {item.label === "Notifications" && unread > 0 && (
                  <span className="count-dot">{unread}</span>
                )}
              </Link>
            ))}
            <Link className="create-button" href="/create">
              <Plus size={20} />
              Create a post
            </Link>
          </nav>
          <div className="nav-bottom">
            {user?.role === "FOUNDER" && (
              <Link className="nav-item small" href="/founder">
                <BriefcaseBusiness size={19} />
                Founder studio
              </Link>
            )}
            {(user?.role === "ADMIN" || user?.role === "MODERATOR") && (
              <Link className="nav-item small" href="/admin">
                <Shield size={19} />
                Moderation
              </Link>
            )}
            <Link className="nav-item small" href="/settings">
              <Settings size={19} />
              Settings
            </Link>
            {user ? (
              <Link className="account-chip" href={`/@${user.username}`}>
                <Avatar
                  name={user.displayName}
                  url={user.avatarUrl}
                  size={38}
                />
                <span>
                  <strong>{user.displayName}</strong>
                  <small>@{user.username}</small>
                </span>
                <ArrowUpRight size={17} />
              </Link>
            ) : (
              <button
                className="button primary full"
                onClick={() => setAuthOpen(true)}
              >
                Join the conversation
              </button>
            )}
            <p className="nav-footer">
              A little curiosity goes a long way.
              <br />
              ProductScroll · Demonstration data
            </p>
          </div>
        </aside>
        <div className="main-column">
          <header className="mobile-header">
            <Link className="brand" href="/">
              productscroll<span className="brand-dot">.</span>
            </Link>
            <Link
              className="icon-button"
              href="/notifications"
              aria-label="Notifications"
            >
              <Bell size={21} />
            </Link>
          </header>
          <main id="content">
            <Suspense fallback={<Loading />}>
              <Route />
            </Suspense>
          </main>
        </div>
        <aside className="discovery-sidebar">
          <Link className="search-prompt" href="/explore">
            <Search size={18} />
            <span>Find your next rabbit hole</span>
            <kbd>⌕</kbd>
          </Link>
          <section className="sidebar-section">
            <div className="section-row">
              <h2>Most followed</h2>
              <span className="live-label">
                <i />
                On ProductScroll
              </span>
            </div>
            <p className="muted sidebar-intro">
              Small teams. Big things in the making.
            </p>
            {data?.trending.slice(0, 5).map((s, i) => (
              <Link
                href={`/startup/${s.slug}`}
                className="trending-row"
                key={s.id}
              >
                <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                <span className={`startup-mark mark-${i % 5}`}>
                  {s.name.slice(0, 1)}
                </span>
                <span>
                  <strong>{s.name}</strong>
                  <small>{s.category}</small>
                </span>
                <ArrowUpRight size={15} />
              </Link>
            ))}
          </section>
          <section className="sidebar-section">
            <div className="section-row">
              <h2>People to know</h2>
              <Link href="/explore">See all</Link>
            </div>
            {data?.founders.slice(0, 3).map((f) => (
              <Link href={`/@${f.username}`} className="founder-row" key={f.id}>
                <Avatar name={f.displayName} url={f.avatarUrl} size={39} />
                <span>
                  <strong>{f.displayName}</strong>
                  <small>Founder · Building in public</small>
                </span>
                <Plus size={17} />
              </Link>
            ))}
          </section>
          <section className="curiosity-note">
            <span className="eyebrow">FOLLOW YOUR CURIOSITY</span>
            <h3>
              The next big thing
              <br />
              starts small.
            </h3>
            <p>Meet the people making it happen.</p>
            <Link href="/explore">
              Explore new ideas <ArrowUpRight size={17} />
            </Link>
            <div className="note-drawing" aria-hidden="true">
              ✳
            </div>
          </section>
          <div className="sidebar-section">
            <h2>Find your corner</h2>
            <div className="topic-list">
              {data?.categories.slice(0, 8).map((c) => (
                <Link
                  href={`/explore?category=${encodeURIComponent(c)}`}
                  key={c}
                >
                  {c}
                  <ArrowUpRight size={12} />
                </Link>
              ))}
            </div>
          </div>
          <footer className="sidebar-footer">
            <Link href="/settings">Privacy & account</Link>
            <a href={`${API_URL}/docs`} target="_blank" rel="noreferrer">
              API docs
            </a>
            <span>Made for people who build.</span>
          </footer>
        </aside>
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        <Link href="/" className={active("/") ? "active" : ""}>
          <Home size={22} />
          <span>Home</span>
        </Link>
        <Link href="/explore" className={active("/explore") ? "active" : ""}>
          <Compass size={22} />
          <span>Explore</span>
        </Link>
        <Link className="mobile-create" href="/create" aria-label="Create">
          <Plus size={25} />
        </Link>
        <Link href="/messages" className={active("/messages") ? "active" : ""}>
          <MessageCircle size={22} />
          <span>Messages</span>
        </Link>
        {user ? (
          <Link href={`/@${user.username}`}>
            <Avatar name={user.displayName} size={24} />
            <span>Profile</span>
          </Link>
        ) : (
          <button onClick={() => setAuthOpen(true)}>
            <UserRound size={22} />
            <span>Sign in</span>
          </button>
        )}
      </nav>
      {authOpen && <AuthModal />}
      {user && !user.onboarded && !authOpen && <Onboarding />}
    </>
  );
}
