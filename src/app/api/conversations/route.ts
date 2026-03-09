import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/session";
import {
  createDirectConversation,
  createGroupConversation,
  listParticipantIds,
} from "@/lib/db";
import { emitRealtimeEvent } from "@/lib/realtime";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json()) as
      | {
          type: "direct";
          userId?: number;
        }
      | {
          type: "group";
          name?: string;
          memberIds?: number[];
        };

    let conversationId: number;

    if (body.type === "direct") {
      conversationId = createDirectConversation(user.id, Number(body.userId));
    } else {
      conversationId = createGroupConversation({
        creatorId: user.id,
        name: body.name ?? "",
        memberIds: body.memberIds ?? [],
      });
    }

    const participantIds = listParticipantIds(conversationId);

    emitRealtimeEvent({
      kind: "conversation",
      userIds: participantIds,
      conversationId,
      actorId: user.id,
    });

    return NextResponse.json({ ok: true, conversationId });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create that conversation.",
      },
      { status: 400 },
    );
  }
}
