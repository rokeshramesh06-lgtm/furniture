import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { updateUserProfile } from "@/lib/db";
import { emitRealtimeEvent } from "@/lib/realtime";
import { saveAvatar } from "@/lib/uploads";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const user = await requireSessionUser();
    const formData = await request.formData();
    const username = String(formData.get("username") ?? "");
    const status = String(formData.get("status") ?? "");
    const avatar = formData.get("avatar");

    let avatarPath: string | null | undefined;

    if (avatar instanceof File && avatar.size > 0) {
      avatarPath = await saveAvatar(avatar);
    }

    const updated = updateUserProfile({
      userId: user.id,
      username,
      status,
      avatarPath,
    });

    emitRealtimeEvent({
      kind: "profile",
      broadcast: true,
      userId: user.id,
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update your profile right now.",
      },
      { status: 400 },
    );
  }
}
