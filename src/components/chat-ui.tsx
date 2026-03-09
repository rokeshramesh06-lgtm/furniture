/* eslint-disable @next/next/no-img-element */

import type { ReactNode } from "react";
import { FileText, MessageSquarePlus, X } from "lucide-react";

import type { ChatMessage } from "@/lib/types";

export function makeId() {
  return typeof window !== "undefined" && "crypto" in window
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export function formatTime(dateValue: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

export function formatShortDate(dateValue: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(dateValue));
}

export function formatSidebarTime(dateValue: string | null) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();

  return isSameDay ? formatTime(dateValue) : formatShortDate(dateValue);
}

export function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export function formatPresence(lastSeen: string) {
  const timestamp = new Date(lastSeen).getTime();
  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.round(diff / 60_000);

  if (minutes <= 1) {
    return "online now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  return formatShortDate(lastSeen);
}

export function Avatar({
  name,
  src,
  size = "md",
  online,
}: {
  name: string;
  src: string | null;
  size?: "sm" | "md" | "lg";
  online?: boolean;
}) {
  const sizeClass =
    size === "sm"
      ? "h-10 w-10 text-sm"
      : size === "lg"
        ? "h-16 w-16 text-xl"
        : "h-12 w-12 text-base";

  return (
    <div className={`relative shrink-0 ${sizeClass}`}>
      {src ? (
        <img
          alt={name}
          className="h-full w-full rounded-2xl object-cover"
          src={src}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f766e,#f59e0b)] font-semibold text-white">
          {name.slice(0, 2).toUpperCase()}
        </div>
      )}
      {online ? (
        <span className="absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
      ) : null}
    </div>
  );
}

export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-md">
      <div className="glass-panel w-full max-w-xl rounded-[30px] p-6 shadow-2xl shadow-slate-950/30 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-slate-900">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
          </div>
          <button
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-white"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AttachmentPreview({ message }: { message: ChatMessage }) {
  if (!message.attachmentPath || !message.attachmentKind) {
    return null;
  }

  if (message.attachmentKind === "image") {
    return (
      <img
        alt={message.attachmentName ?? "Shared image"}
        className="mt-3 max-h-72 w-full rounded-2xl object-cover"
        src={message.attachmentPath}
      />
    );
  }

  if (message.attachmentKind === "video") {
    return (
      <video
        className="mt-3 max-h-72 w-full rounded-2xl"
        controls
        src={message.attachmentPath}
      />
    );
  }

  return (
    <a
      className="mt-3 flex items-center gap-3 rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-medium hover:bg-black/10"
      href={message.attachmentPath}
      rel="noreferrer"
      target="_blank"
    >
      <FileText className="h-4 w-4" />
      {message.attachmentName ?? "Open document"}
    </a>
  );
}

export function EmptyConversation({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 rounded-[26px] bg-white/80 p-5 shadow-lg shadow-slate-950/5">
        <MessageSquarePlus className="h-10 w-10 text-slate-700" />
      </div>
      <h2 className="font-display text-3xl font-semibold text-slate-900">
        {title}
      </h2>
      <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
        {description}
      </p>
    </div>
  );
}
