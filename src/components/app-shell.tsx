"use client";

import { useEffect, useState } from "react";

import { AuthShell } from "@/components/auth-shell";
import { ChatShell } from "@/components/chat-shell";
import type { BootstrapPayload } from "@/lib/types";

type LoadState =
  | {
      kind: "loading";
    }
  | {
      kind: "guest";
    }
  | {
      kind: "ready";
      payload: BootstrapPayload;
    }
  | {
      kind: "error";
      message: string;
    };

function LoadingScreen() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(242,174,73,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(13,148,136,0.16),_transparent_24%)]" />
      <div className="glass-panel relative w-full max-w-lg rounded-[32px] p-8 text-center shadow-2xl shadow-slate-950/10">
        <div className="mx-auto mb-6 h-14 w-14 animate-pulse rounded-full bg-[linear-gradient(135deg,#0f172a,#f59e0b)]" />
        <h1 className="font-display text-3xl font-semibold text-slate-900">
          Opening VelvetChat
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Loading your conversations and checking your session.
        </p>
      </div>
    </main>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(242,174,73,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(13,148,136,0.16),_transparent_24%)]" />
      <div className="glass-panel relative w-full max-w-lg rounded-[32px] p-8 text-center shadow-2xl shadow-slate-950/10">
        <h1 className="font-display text-3xl font-semibold text-slate-900">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">{message}</p>
        <button
          className="mt-6 rounded-[22px] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          onClick={() => window.location.reload()}
          type="button"
        >
          Reload
        </button>
      </div>
    </main>
  );
}

export function AppShell() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/bootstrap", {
          cache: "no-store",
        });

        if (cancelled) {
          return;
        }

        if (response.status === 401) {
          setState({ kind: "guest" });
          return;
        }

        const payload = (await response.json()) as BootstrapPayload & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to open the app right now.");
        }

        setState({ kind: "ready", payload });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState({
          kind: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to open the app right now.",
        });
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") {
    return <LoadingScreen />;
  }

  if (state.kind === "guest") {
    return <AuthShell />;
  }

  if (state.kind === "error") {
    return <ErrorScreen message={state.message} />;
  }

  return (
    <ChatShell
      initialContacts={state.payload.contacts}
      initialConversationId={null}
      initialConversations={state.payload.conversations}
      initialCurrentUser={state.payload.currentUser}
      initialMessages={[]}
    />
  );
}
