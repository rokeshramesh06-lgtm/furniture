"use client";

import { useState, useTransition } from "react";

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

  if (!open) {
    return null;
  }

  function resetState() {
    setError("");
    setPassword("");
  }

  function handleClose() {
    resetState();
    onClose();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const response = await fetch(
        mode === "login" ? "/api/auth/login" : "/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            mode === "login"
              ? { email, password }
              : { name, email, password },
          ),
        },
      );

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      window.location.reload();
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
              <span className="field-label">Full name</span>
              <input
                className="field-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Aarav Mehta"
                required
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
        </form>

        <p className="panel-copy">
          Demo admin: `admin@atelierfurniture.local` / `admin12345`
        </p>
      </div>
    </div>
  );
}
