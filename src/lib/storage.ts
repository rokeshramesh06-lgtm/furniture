import "server-only";

import { mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

declare global {
  var __chattingStorageRoot: string | undefined;
}

function tryPrepareDirectory(directory: string) {
  mkdirSync(directory, { recursive: true });
  return directory;
}

function isLikelyReadOnlyRuntime() {
  return (
    process.cwd().startsWith("/var/task") ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_EXECUTION_ENV) ||
    Boolean(process.env.LAMBDA_TASK_ROOT)
  );
}

function resolveStorageRoot() {
  const envDirectory = process.env.CHATTING_STORAGE_DIR?.trim();
  const tmpDirectory = path.join(os.tmpdir(), "velvetchat");
  const localDirectory = path.join(process.cwd(), "data");
  const candidates = isLikelyReadOnlyRuntime()
    ? [envDirectory, tmpDirectory, localDirectory]
    : [envDirectory, localDirectory, tmpDirectory];
  const validCandidates = candidates.filter(
    (value): value is string => Boolean(value),
  );

  for (const candidate of validCandidates) {
    try {
      return tryPrepareDirectory(candidate);
    } catch {
      continue;
    }
  }

  throw new Error(
    "Unable to prepare app storage. Set CHATTING_STORAGE_DIR to a writable directory.",
  );
}

export function getStorageRoot() {
  if (!globalThis.__chattingStorageRoot) {
    globalThis.__chattingStorageRoot = resolveStorageRoot();
  }

  return globalThis.__chattingStorageRoot;
}

export function getDatabaseFilePath() {
  return path.join(getStorageRoot(), "chatting.sqlite");
}

export function getUploadsDirectory() {
  const uploadsDirectory = path.join(getStorageRoot(), "uploads");
  mkdirSync(uploadsDirectory, { recursive: true });
  return uploadsDirectory;
}

export function getUploadPublicPath(fileName: string) {
  return `/api/files/${encodeURIComponent(fileName)}`;
}

export function resolveUploadFilePath(fileName: string) {
  return path.join(getUploadsDirectory(), path.basename(fileName));
}

export function isEphemeralStorage() {
  return getStorageRoot().startsWith(os.tmpdir());
}
