import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { resolveUploadFilePath } from "@/lib/storage";

export const runtime = "nodejs";

const MIME_TYPES: Record<string, string> = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".zip": "application/zip",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
};

function getMimeType(fileName: string) {
  return MIME_TYPES[path.extname(fileName).toLowerCase()] ?? "application/octet-stream";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ fileName: string }> },
) {
  try {
    const { fileName } = await context.params;
    const safeFileName = path.basename(fileName);
    const fileBuffer = await readFile(resolveUploadFilePath(safeFileName));

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": getMimeType(safeFileName),
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
