"use client";

import { useState, useTransition } from "react";

const DEMO_ACCOUNTS = [
  {
    label: "Use admin demo",
    email: "admin@atelierfurniture.local",
    password: "admin12345",
  },
  {
    label: "Use customer demo",
    email: "client@atelierfurniture.local",
    password: "client12345",
  },
] as const;

type AuthDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function AuthDialog({ open, onClose }: AuthDialogProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const canCreateFromLogin =
    mode === "login" && email.trim().length > 0 && password.trim().length >= 8;

  if (!open) {
    return null;
  }

  function deriveNameFromEmail(value: string) {
    const localPart = value.trim().split("@")[0] ?? "";
    const cleaned = localPart
      .replace(/[._-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) {
      return "New Customer";
    }

    return cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function resetState() {
    setError("");
    setPassword("");
  }

  function handleClose() {
    resetState();
    onClose();
  }

  function submit(modeOverride: "login" | "register", payload: {
    name?: string;
    email: string;
    password: string;
  }) {
    setError("");

    startTransition(async () => {
      try {
        const response = await fetch(
          modeOverride === "login" ? "/api/auth/login" : "/api/auth/register",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(
              modeOverride === "login"
                ? { email: payload.email, password: payload.password }
                : payload,
            ),
          },
        );

        const data = (await response.json()) as { ok?: boolean; error?: string };

        if (!response.ok || data.ok === false) {
          setError(data.error ?? "Something went wrong.");
          return;
        }

        window.location.reload();
      } catch {
        setError("Unable to contact the server right now.");
      }
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(mode, { name, email, password });
  }

  function handleDemoLogin(emailValue: string, passwordValue: string) {
    setMode("login");
    setName("");
    setEmail(emailValue);
    setPassword(passwordValue);
    submit("login", {
      email: emailValue,
      password: passwordValue,
    });
  }

  function handleQuickRegister() {
    setMode("register");
    submit("register", {
      name: deriveNameFromEmail(email),
      email,
      password,
    });
  }

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div
        className="modal-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
      >
        <div className="modal-header">
          <div>
            <h2 id="auth-dialog-title" className="panel-title">
              {mode === "login" ? "Customer login" : "Create your account"}
            </h2>
            <p className="panel-copy">
              Save your address, place orders, and track purchases from one place.
            </p>
          </div>
          <button type="button" className="icon-button" onClick={handleClose}>
            Close
          </button>
        </div>

        <div className="tab-strip">
          <button
            type="button"
            className={mode === "login" ? "tab-button active" : "tab-button"}
            onClick={() => {
              setMode("login");
              resetState();
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "register" ? "tab-button active" : "tab-button"}
            onClick={() => {
              setMode("register");
              resetState();
            }}
          >
            Register
          </button>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <label className="field-stack">
              <span className="field-label">Full name (optional)</span>
              <input
                className="field-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Aarav Mehta"
              />
            </label>
          ) : null}

          <label className="field-stack">
            <span className="field-label">Email</span>
            <input
              className="field-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="field-stack">
            <span className="field-label">Password</span>
            <input
              className="field-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button type="submit" className="button button-primary" disabled={isPending}>
            {isPending
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>

          {mode === "login" ? (
            <div className="inline-helper">
              <p className="panel-copy">
                First time here? You can create an account with the same email and password.
              </p>
              <button
                type="button"
                className="button button-light"
                onClick={handleQuickRegister}
                disabled={!canCreateFromLogin || isPending}
              >
                Create account with these details
              </button>
            </div>
          ) : null}
        </form>

        <div className="demo-login-grid">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              className="button button-light"
              onClick={() => handleDemoLogin(account.email, account.password)}
              disabled={isPending}
            >
              {account.label}
            </button>
          ))}
        </div>

        <p className="panel-copy">
          Demo admin: admin@atelierfurniture.local / admin12345
          <br />
          Demo customer: client@atelierfurniture.local / client12345
        </p>
      </div>
    </div>
  );
}
