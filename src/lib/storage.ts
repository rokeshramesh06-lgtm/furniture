import "server-only";

import { mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

declare global {
  var __atelierStorageRoot: string | undefined;
}

function prepareDirectory(directory: string) {
  mkdirSync(directory, { recursive: true });
  return directory;
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
      return prepareDirectory(candidate);
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
