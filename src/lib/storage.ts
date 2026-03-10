import "server-only";

import { mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

declare global {
  var __atelierStorageRoot: string | undefined;
}

const UPLOAD_DIRECTORY_NAME = "uploads";
const IMAGE_UPLOAD_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);

function prepareDirectory(directory: string) {
  mkdirSync(directory, { recursive: true });
  return directory;
}

function ensureWritableDirectory(directory: string) {
  const preparedDirectory = prepareDirectory(directory);
  const probeFilePath = path.join(
    preparedDirectory,
    `.atelier-write-test-${process.pid}-${Date.now()}`,
  );

  writeFileSync(probeFilePath, "ok");
  unlinkSync(probeFilePath);

  return preparedDirectory;
}

function resolveStorageRoot() {
  const preferredDirectory = process.env.ATELIER_STORAGE_DIR?.trim();
  const localDirectory = path.join(process.cwd(), "data");
  const tempDirectory = path.join(os.tmpdir(), "atelier-furniture");
  const candidates = [preferredDirectory, localDirectory, tempDirectory].filter(
    (value): value is string => Boolean(value),
  );

  for (const candidate of candidates) {
    try {
      return ensureWritableDirectory(candidate);
    } catch {
      continue;
    }
  }

  throw new Error(
    "Unable to prepare writable storage. Set ATELIER_STORAGE_DIR to a writable directory.",
  );
}

export function getStorageRoot() {
  if (!globalThis.__atelierStorageRoot) {
    globalThis.__atelierStorageRoot = resolveStorageRoot();
  }

  return globalThis.__atelierStorageRoot;
}

export function getDatabaseFilePath() {
  return path.join(getStorageRoot(), "atelier-furniture.sqlite");
}

export function getUploadsRoot() {
  return prepareDirectory(path.join(getStorageRoot(), UPLOAD_DIRECTORY_NAME));
}

export function getUploadFilePath(fileName: string) {
  return path.join(getUploadsRoot(), fileName);
}

export function getUploadedImagePath(fileName: string) {
  return `/api/uploads/${encodeURIComponent(fileName)}`;
}

export function isSupportedUploadExtension(extension: string) {
  return IMAGE_UPLOAD_EXTENSIONS.has(extension.toLowerCase());
}
