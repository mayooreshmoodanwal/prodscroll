"use client";
import { useState, type FormEvent, type ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff, RotateCw } from "lucide-react";
import { useApp } from "../lib/context";
import { mutate, API_URL } from "../lib/api";
import { useResource } from "../lib/hooks";
import type { User } from "../lib/types";
import { Modal, Spinner, PageHeading } from "./ui";

function PasswordField({
  name,
  placeholder,
  autoComplete,
  minLength = 8,
  required = true,
  id,
}: {
  name: string;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  id?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-input-wrapper">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        maxLength={128}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export function AuthModal() {
  const { setAuthOpen, setUser, toast } = useApp();
  const providers = useResource<{ google: boolean }>("/auth/providers");
  const [mode, setMode] = useState<
    "login" | "register" | "verify-otp" | "forgot" | "reset-otp"
  >("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [resetEmail, setResetEmail] = useState("");

  async function login(email: string, password: string) {
    const result = await mutate<{ user: User }>("/auth/login", {
      email,
      password,
    });
    setUser(result.user);
    setAuthOpen(false);
    toast(`Welcome back, ${result.user.displayName.split(" ")[0]}.`);
  }

  async function resendOtp(purpose: "VERIFY" | "RESET") {
    const targetEmail = purpose === "VERIFY" ? pendingEmail : resetEmail;
    if (!targetEmail) return;
    setBusy(true);
    setError("");
    try {
      await mutate("/auth/resend-otp", { email: targetEmail, purpose });
      toast(`A new 6-digit verification code has been sent to ${targetEmail}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(event.currentTarget);
    try {
      if (mode === "login") {
        await login(String(f.get("email")), String(f.get("password")));
      } else if (mode === "register") {
        const passwordVal = String(f.get("password") || "");
        const confirmVal = String(f.get("confirmPassword") || "");
        if (passwordVal.length < 8) {
          setError("Password must be at least 8 characters long.");
          setBusy(false);
          return;
        }
        if (passwordVal !== confirmVal) {
          setError("Passwords do not match. Please verify both password fields.");
          setBusy(false);
          return;
        }
        const userEmail = String(f.get("email")).toLowerCase().trim();
        const result = await mutate<{
          user: User;
          email: string;
          verificationRequired?: boolean;
        }>("/auth/register", {
          email: userEmail,
          username: f.get("username"),
          displayName: f.get("displayName"),
          password: passwordVal,
          role: f.get("role"),
        });
        setPendingEmail(userEmail);
        setMode("verify-otp");
        toast(`Verification code sent to ${userEmail}`);
      } else if (mode === "verify-otp") {
        const otpVal = String(f.get("otp")).trim();
        if (!/^\d{6}$/.test(otpVal)) {
          setError("Please enter the 6-digit numeric verification code.");
          setBusy(false);
          return;
        }
        const result = await mutate<{ user: User }>("/auth/verify-otp", {
          email: pendingEmail,
          otp: otpVal,
        });
        setUser(result.user);
        setAuthOpen(false);
        toast("Email verified! Welcome to Prodgram.");
      } else if (mode === "forgot") {
        const emailVal = String(f.get("email")).toLowerCase().trim();
        await mutate("/auth/forgot-password", { email: emailVal });
        setResetEmail(emailVal);
        setMode("reset-otp");
        toast(`A 6-digit reset code has been sent to ${emailVal}`);
      } else if (mode === "reset-otp") {
        const otpVal = String(f.get("otp")).trim();
        const passwordVal = String(f.get("password") || "");
        const confirmVal = String(f.get("confirmPassword") || "");
        if (!/^\d{6}$/.test(otpVal)) {
          setError("Please enter the 6-digit numeric verification code.");
          setBusy(false);
          return;
        }
        if (passwordVal.length < 8) {
          setError("New password must be at least 8 characters long.");
          setBusy(false);
          return;
        }
        if (passwordVal !== confirmVal) {
          setError("Passwords do not match. Please verify both password fields.");
          setBusy(false);
          return;
        }
        await mutate("/auth/reset-password", {
          email: resetEmail,
          otp: otpVal,
          password: passwordVal,
        });
        toast("Password updated successfully! Please sign in with your new password.");
        setMode("login");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const modalTitle =
    mode === "login"
      ? "Good to see you."
      : mode === "register"
        ? "Stay curious. Join in."
        : mode === "verify-otp"
          ? "Verify your email"
          : mode === "forgot"
            ? "Reset your password"
            : "Create new password";

  return (
    <Modal title={modalTitle} onClose={() => setAuthOpen(false)}>
      <p className="muted">
        {mode === "verify-otp"
          ? `Enter the 6-digit code sent to ${pendingEmail}`
          : mode === "reset-otp"
            ? `Enter the 6-digit code sent to ${resetEmail} and choose a new password.`
            : mode === "forgot"
              ? "We’ll send a 6-digit verification code to your email."
              : "Discover the ideas and people building what comes next."}
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
                placeholder="Maya Lin"
              />
            </label>
            <label>
              Username
              <input
                name="username"
                autoComplete="username"
                required
                pattern="[a-z0-9_]{3,24}"
                placeholder="mayalin"
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

        {(mode === "login" || mode === "register" || mode === "forgot") && (
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              defaultValue={mode === "forgot" ? resetEmail : undefined}
            />
          </label>
        )}

        {(mode === "verify-otp" || mode === "reset-otp") && (
          <label>
            6-Digit Verification Code
            <input
              name="otp"
              className="otp-input-field"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              autoFocus
              placeholder="123456"
            />
            <div className="otp-meta">
              <span>Code expires in 15 minutes</span>
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  void resendOtp(mode === "verify-otp" ? "VERIFY" : "RESET")
                }
              >
                Resend code
              </button>
            </div>
          </label>
        )}

        {mode === "login" && (
          <label>
            Password
            <PasswordField
              name="password"
              autoComplete="current-password"
              minLength={1}
            />
          </label>
        )}

        {mode === "register" && (
          <>
            <label>
              Password
              <PasswordField
                name="password"
                autoComplete="new-password"
                minLength={8}
              />
              <small>Use at least 8 characters.</small>
            </label>
            <label>
              Confirm password
              <PasswordField
                name="confirmPassword"
                autoComplete="new-password"
                minLength={8}
                placeholder="Re-enter password"
              />
            </label>
          </>
        )}

        {mode === "reset-otp" && (
          <>
            <label>
              New password
              <PasswordField
                name="password"
                autoComplete="new-password"
                minLength={8}
              />
              <small>Use at least 8 characters.</small>
            </label>
            <label>
              Confirm new password
              <PasswordField
                name="confirmPassword"
                autoComplete="new-password"
                minLength={8}
                placeholder="Re-enter new password"
              />
            </label>
          </>
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
          ) : mode === "verify-otp" ? (
            "Verify email & continue"
          ) : mode === "forgot" ? (
            "Send verification code"
          ) : (
            "Set new password"
          )}
          <ArrowRight size={16} />
        </button>
      </form>

      {mode === "login" && (
        <>
          <button
            className="text-button"
            style={{ marginTop: "12px", display: "inline-block" }}
            onClick={() => {
              setMode("forgot");
              setError("");
            }}
          >
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

      {mode === "verify-otp" && (
        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <button
            className="text-button"
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            ← Back to sign up
          </button>
        </div>
      )}

      {mode === "forgot" && (
        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <button
            className="text-button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            ← Back to sign in
          </button>
        </div>
      )}

      {mode === "reset-otp" && (
        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <button
            className="text-button"
            onClick={() => {
              setMode("forgot");
              setError("");
            }}
          >
            ← Request a different code
          </button>
        </div>
      )}

      {(mode === "login" || mode === "register") && (
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
      )}
    </Modal>
  );
}

export function Onboarding() {
  const { refreshUser, toast } = useApp();
  const { data } = useResource<{ items: string[] }>("/categories");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

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
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const token = params.get("token");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const f = new FormData(event.currentTarget);
      await mutate(
        kind === "verify" ? "/auth/verify-email" : "/auth/reset-password",
        {
          token,
          ...(kind === "reset" ? { password: f.get("password") } : {}),
        },
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
            <PasswordField
              name="password"
              minLength={8}
              autoComplete="new-password"
            />
            <small>Use at least 8 characters.</small>
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
