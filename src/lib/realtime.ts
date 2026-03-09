import "server-only";

import { EventEmitter } from "node:events";

import type { RealtimeEvent } from "@/lib/types";

declare global {
  var __chattingRealtime: EventEmitter | undefined;
}

const emitter = globalThis.__chattingRealtime ?? new EventEmitter();

if (!globalThis.__chattingRealtime) {
  globalThis.__chattingRealtime = emitter;
}

export function emitRealtimeEvent(event: RealtimeEvent) {
  emitter.emit("chatting:event", event);
}

export function subscribeRealtimeEvent(
  listener: (event: RealtimeEvent) => void,
) {
  emitter.on("chatting:event", listener);

  return () => {
    emitter.off("chatting:event", listener);
  };
}
