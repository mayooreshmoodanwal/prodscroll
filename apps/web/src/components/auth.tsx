"use client";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { useApp } from "../lib/context";
import { mutate, API_URL } from "../lib/api";
import { useResource } from "../lib/hooks";
import type { User } from "../lib/types";
import { Modal, Spinner, PageHeading } from "./ui";
export function AuthModal() {
  const { setAuthOpen, setUser, toast } = useApp();
  const providers = useResource<{ google: boolean }>("/auth/providers");
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function login(email: string, password: string) {
    const result = await mutate<{ user: User }>("/auth/login", {
      email,
      password,
    });
    setUser(result.user);
    setAuthOpen(false);
    toast(`Welcome back, ${result.user.displayName.split(" ")[0]}.`);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(event.currentTarget);
    try {
      if (mode === "login")
        await login(String(f.get("email")), String(f.get("password")));
      else if (mode === "forgot") {
        await mutate("/auth/forgot-password", { email: f.get("email") });
        toast("If that account exists, a reset link has been sent.");
        setMode("login");
      } else {
        const result = await mutate<{ user: User }>("/auth/register", {
          email: f.get("email"),
          username: f.get("username"),
          displayName: f.get("displayName"),
          password: f.get("password"),
          role: f.get("role"),
        });
        setUser(result.user);
        setAuthOpen(false);
        toast("Account created. Check your email to verify your account.");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        mode === "login"
          ? "Good to see you."
          : mode === "register"
            ? "Stay curious. Join in."
            : "Reset your password"
      }
      onClose={() => setAuthOpen(false)}
    >
      <p className="muted">
        Discover the ideas and people building what comes next.
      </p>
      <form onSubmit={submit} className="form">
        {mode === "register" && (
          <>
            <label>
              Full name
              <input
                name="displayName"
                autoComplete="name"
                required
                minLength={2}
                maxLength={60}
              />
            </label>
            <label>
              Username
              <input
                name="username"
                autoComplete="username"
                required
                pattern="[a-z0-9_]{3,24}"
                placeholder="your_name"
              />
            </label>
            <label>
              I’m here as
              <select name="role">
                <option value="USER">A curious explorer</option>
                <option value="FOUNDER">A founder or builder</option>
              </select>
            </label>
          </>
        )}
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        {mode !== "forgot" && (
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={mode === "register" ? 12 : 1}
              maxLength={128}
            />
            {mode === "register" && <small>Use at least 12 characters.</small>}
          </label>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary full" disabled={busy}>
          {busy ? (
            <Spinner />
          ) : mode === "login" ? (
            "Sign in"
          ) : mode === "register" ? (
            "Create account"
          ) : (
            "Send reset link"
          )}
          <ArrowRight size={16} />
        </button>
      </form>
      {mode === "login" && (
        <>
          <button className="text-button" onClick={() => setMode("forgot")}>
            Forgot password?
          </button>
          <div className="divider">or</div>
          {providers.data?.google && (
            <a
              className="button secondary full"
              href={`${API_URL}/auth/google`}
            >
              Continue with Google
            </a>
          )}
          <button
            className="button secondary full demo-login"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void login("maya@productscroll.local", "BuildSomething!42")
                .catch((e) => setError(e.message))
                .finally(() => setBusy(false));
            }}
          >
            Explore with the demo account
          </button>
        </>
      )}
      <p className="auth-switch">
        {mode === "register"
          ? "Already part of the community?"
          : "New to ProductScroll?"}{" "}
        <button
          className="text-button"
          onClick={() => {
            setMode(mode === "register" ? "login" : "register");
            setError("");
          }}
        >
          {mode === "register" ? "Sign in" : "Create an account"}
        </button>
      </p>
    </Modal>
  );
}
export function Onboarding() {
  const { refreshUser, toast } = useApp();
  const { data } = useResource<{ items: string[] }>("/categories");
  const [selected, setSelected] = useState<string[]>([]),
    [busy, setBusy] = useState(false);
  return (
    <Modal title="What sparks your curiosity?" onClose={() => undefined}>
      <p className="muted">
        Pick 3–10 interests. Your feed will grow with you.
      </p>
      <div className="interest-grid">
        {data?.items.map((c) => (
          <button
            key={c}
            className={selected.includes(c) ? "selected" : ""}
            onClick={() =>
              setSelected((current) =>
                current.includes(c)
                  ? current.filter((x) => x !== c)
                  : current.length < 10
                    ? [...current, c]
                    : current,
              )
            }
          >
            {c}
            {selected.includes(c) && <Check size={14} />}
          </button>
        ))}
      </div>
      <button
        disabled={selected.length < 3 || busy}
        className="button primary full"
        onClick={() => {
          setBusy(true);
          void mutate("/users/me/onboarding", { interests: selected }, "PUT")
            .then(refreshUser)
            .catch((e) => toast(e.message))
            .finally(() => setBusy(false));
        }}
      >
        Build my feed <ArrowRight size={17} />
      </button>
    </Modal>
  );
}
export function TokenPage({ kind }: { kind: string }) {
  const params = useSearchParams();
  const { refreshUser } = useApp();
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const token = params.get("token");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const f = new FormData(event.currentTarget);
      await mutate(
        kind === "verify" ? "/auth/verify-email" : "/auth/reset-password",
        { token, ...(kind === "reset" ? { password: f.get("password") } : {}) },
      );
      setMessage(
        kind === "verify"
          ? "Your email is verified. You’re ready to join in."
          : "Password reset. Sign in with your new password.",
      );
      await refreshUser();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title={kind === "verify" ? "Verify your email" : "A fresh start"}
      />
      <form className="form padded" onSubmit={submit}>
        {kind === "reset" && (
          <label>
            New password
            <input
              required
              name="password"
              type="password"
              minLength={12}
              maxLength={128}
            />
          </label>
        )}
        <button disabled={busy || !token} className="button primary">
          {busy ? (
            <Spinner />
          ) : kind === "verify" ? (
            "Verify email"
          ) : (
            "Reset password"
          )}
        </button>
        <p role="status">
          {message || (!token ? "This link is missing its token." : "")}
        </p>
      </form>
    </>
  );
}
