import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/session";
import {
  addMessage,
  getConversationMessages,
  listParticipantIds,
} from "@/lib/db";
import { emitRealtimeEvent } from "@/lib/realtime";
import { saveAttachment } from "@/lib/uploads";

export const runtime = "nodejs";

function getConversationId(rawValue: string) {
  const conversationId = Number(rawValue);

  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    throw new Error("Invalid conversation id.");
  }

  return conversationId;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  try {
    const user = await requireSessionUser();
    const { conversationId: rawConversationId } = await context.params;
    const conversationId = getConversationId(rawConversationId);

    return NextResponse.json(
      { messages: getConversationMessages(user.id, conversationId) },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load messages right now.",
      },
      { status: 400 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  try {
    const user = await requireSessionUser();
    const { conversationId: rawConversationId } = await context.params;
    const conversationId = getConversationId(rawConversationId);
    const formData = await request.formData();
    const content = String(formData.get("content") ?? "");
    const attachment = formData.get("attachment");

    let attachmentPayload:
      | {
          publicPath: string;
          originalName: string;
          attachmentKind: "image" | "video" | "document";
        }
      | undefined;

    if (attachment instanceof File && attachment.size > 0) {
      attachmentPayload = await saveAttachment(attachment);
    }

    const message = addMessage({
      conversationId,
      senderId: user.id,
      content,
      attachmentPath: attachmentPayload?.publicPath,
      attachmentName: attachmentPayload?.originalName,
      attachmentKind: attachmentPayload?.attachmentKind,
    });

    const participantIds = listParticipantIds(conversationId);
    const preview =
      message.content.trim() ||
      (message.attachmentKind === "image"
        ? "Shared an image"
        : message.attachmentKind === "video"
          ? "Shared a video"
          : message.attachmentKind === "document"
            ? "Shared a document"
            : "New message");

    emitRealtimeEvent({
      kind: "message",
      userIds: participantIds,
      conversationId,
      senderId: user.id,
      senderName: user.username,
      preview,
    });

    return NextResponse.json({ ok: true, message });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to send your message.",
      },
      { status: 400 },
    );
  }
}
