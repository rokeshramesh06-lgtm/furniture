"use client";

import { FormEvent, useState } from "react";
import {
  LockKeyhole,
  Mail,
  MessageCircleHeart,
  Phone,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

type AuthMode = "login" | "register";

const highlights = [
  {
    icon: MessageCircleHeart,
    title: "Instant conversations",
    description:
      "One-to-one messaging, group circles, and quick media sharing in one polished space.",
  },
  {
    icon: ShieldCheck,
    title: "Server-side security",
    description:
      "Passwords are hashed and SQLite stays on the server instead of being exposed in the browser.",
  },
  {
    icon: UsersRound,
    title: "Presence that feels live",
    description:
      "Online indicators, new-message alerts, and responsive layouts for phone or desktop.",
  },
];

export function AuthShell() {
  const [mode, setMode] = useState<AuthMode>("register");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword,
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to sign in.");
      }

      window.location.reload();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to sign in right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: registerUsername,
          email: registerEmail || undefined,
          phone: registerPhone || undefined,
          password: registerPassword,
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create your account.");
      }

      window.location.reload();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create your account right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(233,178,117,0.32),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(49,115,102,0.28),_transparent_26%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(13,36,44,0.82),rgba(13,36,44,0))]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel fade-up flex flex-col justify-between rounded-[32px] p-6 sm:p-8 lg:p-12">
          <div className="space-y-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium tracking-[0.18em] text-amber-100 uppercase">
              <Sparkles className="h-4 w-4" />
              VelvetChat
            </div>

            <div className="max-w-2xl space-y-5">
              <h1 className="font-display text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Elegant messaging built for calm, fast conversations.
              </h1>
              <p className="max-w-xl text-base leading-8 text-slate-200/90 sm:text-lg">
                Create an account with email or phone, start direct chats, build
                groups, share media, and stay in sync with live presence and message
                alerts.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[24px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm"
                >
                  <item.icon className="mb-4 h-6 w-6 text-amber-200" />
                  <h2 className="mb-2 text-lg font-semibold text-white">
                    {item.title}
                  </h2>
                  <p className="text-sm leading-6 text-slate-200/80">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-slate-950/25 p-5 text-sm leading-6 text-slate-200/80 backdrop-blur-sm">
            Database access is intentionally kept on the server. SQLite works from
            secure API routes, not from hardcoded frontend credentials.
          </div>
        </section>

        <section className="fade-up flex items-center justify-center [animation-delay:120ms]">
          <div className="glass-panel w-full max-w-xl rounded-[32px] p-6 shadow-2xl shadow-slate-950/25 sm:p-8">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium tracking-[0.25em] text-slate-500 uppercase">
                  Welcome
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-slate-900">
                  {mode === "login" ? "Sign back in" : "Create your profile"}
                </h2>
              </div>
              <div className="rounded-full border border-slate-200 bg-white/70 p-1">
                <button
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    mode === "login"
                      ? "bg-slate-900 text-white shadow-lg"
                      : "text-slate-500"
                  }`}
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  type="button"
                >
                  Sign in
                </button>
                <button
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    mode === "register"
                      ? "bg-slate-900 text-white shadow-lg"
                      : "text-slate-500"
                  }`}
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                  type="button"
                >
                  Register
                </button>
              </div>
            </div>

            {mode === "login" ? (
              <form className="space-y-4" onSubmit={handleLogin}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-600">
                    Email or phone
                  </span>
                  <div className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white/80 px-4 py-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <input
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                      onChange={(event) => setLoginIdentifier(event.target.value)}
                      placeholder="you@example.com or +91..."
                      value={loginIdentifier}
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-600">
                    Password
                  </span>
                  <div className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white/80 px-4 py-3">
                    <LockKeyhole className="h-4 w-4 text-slate-400" />
                    <input
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                      onChange={(event) => setLoginPassword(event.target.value)}
                      placeholder="Your secure password"
                      type="password"
                      value={loginPassword}
                    />
                  </div>
                </label>

                {error ? (
                  <p className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                    {error}
                  </p>
                ) : null}

                <button
                  className="flex w-full items-center justify-center rounded-[22px] bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Signing you in..." : "Enter VelvetChat"}
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleRegister}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-600">
                    Username
                  </span>
                  <div className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white/80 px-4 py-3">
                    <UsersRound className="h-4 w-4 text-slate-400" />
                    <input
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                      onChange={(event) => setRegisterUsername(event.target.value)}
                      placeholder="How friends will see you"
                      value={registerUsername}
                    />
                  </div>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-600">
                      Email
                    </span>
                    <div className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white/80 px-4 py-3">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <input
                        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                        onChange={(event) => setRegisterEmail(event.target.value)}
                        placeholder="Optional"
                        value={registerEmail}
                      />
                    </div>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-600">
                      Phone
                    </span>
                    <div className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white/80 px-4 py-3">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <input
                        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                        onChange={(event) => setRegisterPhone(event.target.value)}
                        placeholder="Optional"
                        value={registerPhone}
                      />
                    </div>
                  </label>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-600">
                    Password
                  </span>
                  <div className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white/80 px-4 py-3">
                    <LockKeyhole className="h-4 w-4 text-slate-400" />
                    <input
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                      onChange={(event) => setRegisterPassword(event.target.value)}
                      placeholder="At least 8 characters"
                      type="password"
                      value={registerPassword}
                    />
                  </div>
                </label>

                {error ? (
                  <p className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                    {error}
                  </p>
                ) : null}

                <button
                  className="flex w-full items-center justify-center rounded-[22px] bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Creating account..." : "Create account"}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
