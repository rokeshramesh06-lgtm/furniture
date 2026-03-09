import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type { AttachmentKind } from "@/lib/types";

const UPLOAD_DIRECTORY = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function getSafeExtension(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  return extension.replace(/[^a-z0-9.]/g, "") || "";
}

function resolveAttachmentKind(mimeType: string, fileName: string): AttachmentKind {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip)$/i.test(fileName)) {
    return "document";
  }

  return "document";
}

async function saveIncomingFile(file: File, prefix: string) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Files must be 25MB or smaller.");
  }

  await mkdir(UPLOAD_DIRECTORY, { recursive: true });

  const extension = getSafeExtension(file.name);
  const fileName = `${prefix}-${randomUUID()}${extension}`;
  const filePath = path.join(UPLOAD_DIRECTORY, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, bytes);

  return `/uploads/${fileName}`;
}

export async function saveAttachment(file: File) {
  const attachmentKind = resolveAttachmentKind(file.type, file.name);
  const publicPath = await saveIncomingFile(file, "attachment");

  return {
    publicPath,
    attachmentKind,
    originalName: file.name,
  };
}

export async function saveAvatar(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Profile pictures must be images.");
  }

  return saveIncomingFile(file, "avatar");
}
