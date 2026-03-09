import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { subscribeRealtimeEvent } from "@/lib/realtime";
import type { RealtimeEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function canReceiveEvent(userId: number, event: RealtimeEvent) {
  if ("broadcast" in event && event.broadcast) {
    return true;
  }

  return "userIds" in event && event.userIds.includes(userId);
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const send = (event: RealtimeEvent) => {
          if (!canReceiveEvent(user.id, event)) {
            return;
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          );
        };

        const unsubscribe = subscribeRealtimeEvent(send);
        const heartbeat = setInterval(() => {
          controller.enqueue(encoder.encode(": ping\n\n"));
        }, 20_000);

        request.signal.addEventListener("abort", () => {
          clearInterval(heartbeat);
          unsubscribe();
          controller.close();
        });
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
