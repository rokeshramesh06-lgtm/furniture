import "server-only";

import { mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import type {
  AttachmentKind,
  ChatMessage,
  ContactSummary,
  ConversationParticipant,
  ConversationSummary,
  SessionUser,
} from "@/lib/types";
import { getDatabaseFilePath, getStorageRoot } from "@/lib/storage";

const ONLINE_WINDOW_MS = 70_000;

declare global {
  var __chattingDb: DatabaseSync | undefined;
}

function createDatabase() {
  mkdirSync(getStorageRoot(), { recursive: true });

  const database = new DatabaseSync(getDatabaseFilePath());
  database.exec(`
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      phone TEXT,
      password_hash TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      status_text TEXT NOT NULL DEFAULT 'Ready to chat',
      avatar_path TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
      ON users(email)
      WHERE email IS NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique
      ON users(phone)
      WHERE phone IS NOT NULL;

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('direct', 'group')),
      name TEXT,
      image_path TEXT,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversation_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(conversation_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS conversation_members_user_id_idx
      ON conversation_members(user_id);

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT,
      attachment_path TEXT,
      attachment_name TEXT,
      attachment_kind TEXT CHECK(attachment_kind IN ('image', 'video', 'document')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS messages_conversation_id_idx
      ON messages(conversation_id, id);
  `);

  return database;
}

function getDatabase() {
  if (!globalThis.__chattingDb) {
    globalThis.__chattingDb = createDatabase();
  }

  return globalThis.__chattingDb;
}

export const db = new Proxy({} as DatabaseSync, {
  get(_target, property) {
    const database = getDatabase() as DatabaseSync & Record<PropertyKey, unknown>;
    const value = database[property];
    return typeof value === "function" ? value.bind(database) : value;
  },
});

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized || null;
}

function normalizePhone(value: string | null | undefined) {
  const normalized = value?.replace(/[^\d+]/g, "").trim() ?? "";
  return normalized || null;
}

function isOnline(lastSeen: string) {
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_WINDOW_MS;
}

function serializeUser(row: {
  id: number;
  email: string | null;
  phone: string | null;
  username: string;
  status: string;
  avatarPath: string | null;
  lastSeen: string;
  createdAt: string;
}): SessionUser {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    username: row.username,
    status: row.status,
    avatarPath: row.avatarPath,
    lastSeen: row.lastSeen,
    createdAt: row.createdAt,
  };
}

function formatMessagePreview(message?: {
  content: string | null;
  attachmentKind: AttachmentKind | null;
  senderName: string;
}) {
  if (!message) {
    return "Say hello to start the conversation";
  }

  if (message.content?.trim()) {
    return message.content.trim();
  }

  switch (message.attachmentKind) {
    case "image":
      return `${message.senderName} shared an image`;
    case "video":
      return `${message.senderName} shared a video`;
    case "document":
      return `${message.senderName} shared a document`;
    default:
      return "New message";
  }
}

function getConversationParticipants(
  conversationId: number,
): ConversationParticipant[] {
  const rows = db
    .prepare(
      `
        SELECT
          u.id,
          u.username,
          u.status_text AS status,
          u.avatar_path AS avatarPath,
          u.last_seen AS lastSeen
        FROM conversation_members cm
        INNER JOIN users u ON u.id = cm.user_id
        WHERE cm.conversation_id = ?
        ORDER BY u.username COLLATE NOCASE ASC
      `,
    )
    .all(conversationId) as Array<{
    id: number;
    username: string;
    status: string;
    avatarPath: string | null;
    lastSeen: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    status: row.status,
    avatarPath: row.avatarPath,
    isOnline: isOnline(row.lastSeen),
  }));
}

function ensureConversationMembership(userId: number, conversationId: number) {
  const membership = db
    .prepare(
      `
        SELECT 1
        FROM conversation_members
        WHERE conversation_id = ? AND user_id = ?
      `,
    )
    .get(conversationId, userId);

  if (!membership) {
    throw new Error("You do not have access to this conversation.");
  }
}

function getConversationRow(conversationId: number) {
  return db
    .prepare(
      `
        SELECT
          id,
          type,
          name,
          image_path AS imagePath,
          updated_at AS updatedAt
        FROM conversations
        WHERE id = ?
      `,
    )
    .get(conversationId) as
    | {
        id: number;
        type: "direct" | "group";
        name: string | null;
        imagePath: string | null;
        updatedAt: string;
      }
    | undefined;
}

function getLastMessage(conversationId: number) {
  return db
    .prepare(
      `
        SELECT
          m.content,
          m.attachment_kind AS attachmentKind,
          u.username AS senderName,
          m.created_at AS createdAt
        FROM messages m
        INNER JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = ?
        ORDER BY m.id DESC
        LIMIT 1
      `,
    )
    .get(conversationId) as
    | {
        content: string | null;
        attachmentKind: AttachmentKind | null;
        senderName: string;
        createdAt: string;
      }
    | undefined;
}

export function listParticipantIds(conversationId: number) {
  const rows = db
    .prepare(
      `
        SELECT user_id AS userId
        FROM conversation_members
        WHERE conversation_id = ?
      `,
    )
    .all(conversationId) as Array<{ userId: number }>;

  return rows.map((row) => row.userId);
}

export function createUser(input: {
  email?: string | null;
  phone?: string | null;
  username: string;
  passwordHash: string;
}) {
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const username = input.username.trim();

  if (!username) {
    throw new Error("Username is required.");
  }

  if (!email && !phone) {
    throw new Error("Provide either an email address or a phone number.");
  }

  const result = db
    .prepare(
      `
        INSERT INTO users (email, phone, password_hash, username)
        VALUES (?, ?, ?, ?)
      `,
    )
    .run(email, phone, input.passwordHash, username);

  return getUserById(Number(result.lastInsertRowid));
}

export function findUserForLogin(identifier: string) {
  const value = identifier.trim();

  if (!value) {
    return null;
  }

  const email = normalizeEmail(value);
  const phone = normalizePhone(value);

  return db
    .prepare(
      `
        SELECT
          id,
          email,
          phone,
          username,
          status_text AS status,
          avatar_path AS avatarPath,
          last_seen AS lastSeen,
          created_at AS createdAt,
          password_hash AS passwordHash
        FROM users
        WHERE email = ? OR phone = ?
        LIMIT 1
      `,
    )
    .get(email, phone) as
    | (SessionUser & {
        passwordHash: string;
      })
    | undefined;
}

export function getUserById(userId: number) {
  const row = db
    .prepare(
      `
        SELECT
          id,
          email,
          phone,
          username,
          status_text AS status,
          avatar_path AS avatarPath,
          last_seen AS lastSeen,
          created_at AS createdAt
        FROM users
        WHERE id = ?
      `,
    )
    .get(userId) as
    | {
        id: number;
        email: string | null;
        phone: string | null;
        username: string;
        status: string;
        avatarPath: string | null;
        lastSeen: string;
        createdAt: string;
      }
    | undefined;

  if (!row) {
    throw new Error("User not found.");
  }

  return serializeUser(row);
}

export function listContactsForUser(userId: number): ContactSummary[] {
  const rows = db
    .prepare(
      `
        SELECT
          id,
          username,
          status_text AS status,
          avatar_path AS avatarPath,
          email,
          phone,
          last_seen AS lastSeen
        FROM users
        WHERE id != ?
        ORDER BY username COLLATE NOCASE ASC
      `,
    )
    .all(userId) as Array<{
    id: number;
    username: string;
    status: string;
    avatarPath: string | null;
    email: string | null;
    phone: string | null;
    lastSeen: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    status: row.status,
    avatarPath: row.avatarPath,
    email: row.email,
    phone: row.phone,
    lastSeen: row.lastSeen,
    isOnline: isOnline(row.lastSeen),
  }));
}

export function listConversationSummaries(userId: number): ConversationSummary[] {
  const rows = db
    .prepare(
      `
        SELECT
          c.id,
          c.type,
          c.name,
          c.image_path AS imagePath,
          c.updated_at AS updatedAt
        FROM conversations c
        INNER JOIN conversation_members cm ON cm.conversation_id = c.id
        WHERE cm.user_id = ?
        ORDER BY c.updated_at DESC, c.id DESC
      `,
    )
    .all(userId) as Array<{
    id: number;
    type: "direct" | "group";
    name: string | null;
    imagePath: string | null;
    updatedAt: string;
  }>;

  return rows.map((row) => {
    const participants = getConversationParticipants(row.id);
    const lastMessage = getLastMessage(row.id);
    const otherParticipant =
      row.type === "direct"
        ? participants.find((participant) => participant.id !== userId)
        : null;

    return {
      id: row.id,
      type: row.type,
      name:
        row.type === "group"
          ? row.name?.trim() || "Untitled circle"
          : otherParticipant?.username || "New chat",
      imagePath:
        row.type === "group"
          ? row.imagePath
          : (otherParticipant?.avatarPath ?? null),
      updatedAt: row.updatedAt,
      lastMessagePreview: formatMessagePreview(lastMessage),
      lastMessageAt: lastMessage?.createdAt ?? row.updatedAt,
      participants,
    };
  });
}

export function getConversationMessages(
  userId: number,
  conversationId: number,
): ChatMessage[] {
  ensureConversationMembership(userId, conversationId);

  const rows = db
    .prepare(
      `
        SELECT
          m.id,
          m.conversation_id AS conversationId,
          m.sender_id AS senderId,
          u.username AS senderName,
          u.avatar_path AS senderAvatarPath,
          COALESCE(m.content, '') AS content,
          m.attachment_path AS attachmentPath,
          m.attachment_name AS attachmentName,
          m.attachment_kind AS attachmentKind,
          m.created_at AS createdAt
        FROM messages m
        INNER JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = ?
        ORDER BY m.id ASC
      `,
    )
    .all(conversationId) as ChatMessage[];

  return rows;
}

export function getConversationSummaryForUser(
  userId: number,
  conversationId: number,
) {
  ensureConversationMembership(userId, conversationId);
  return (
    listConversationSummaries(userId).find(
      (conversation) => conversation.id === conversationId,
    ) ?? null
  );
}

export function createDirectConversation(userId: number, otherUserId: number) {
  if (userId === otherUserId) {
    throw new Error("Choose another person to start a direct chat.");
  }

  const existing = db
    .prepare(
      `
        SELECT c.id
        FROM conversations c
        WHERE c.type = 'direct'
          AND EXISTS (
            SELECT 1 FROM conversation_members cm
            WHERE cm.conversation_id = c.id AND cm.user_id = ?
          )
          AND EXISTS (
            SELECT 1 FROM conversation_members cm
            WHERE cm.conversation_id = c.id AND cm.user_id = ?
          )
          AND (
            SELECT COUNT(*)
            FROM conversation_members cm
            WHERE cm.conversation_id = c.id
          ) = 2
        LIMIT 1
      `,
    )
    .get(userId, otherUserId) as { id: number } | undefined;

  if (existing) {
    return existing.id;
  }

  db.exec("BEGIN");

  try {
    const conversation = db
      .prepare(
        `
          INSERT INTO conversations (type, created_by)
          VALUES ('direct', ?)
        `,
      )
      .run(userId);

    const conversationId = Number(conversation.lastInsertRowid);

    db.prepare(
      `
        INSERT INTO conversation_members (conversation_id, user_id)
        VALUES (?, ?), (?, ?)
      `,
    ).run(conversationId, userId, conversationId, otherUserId);

    db.exec("COMMIT");
    return conversationId;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function createGroupConversation(input: {
  creatorId: number;
  name: string;
  memberIds: number[];
}) {
  const memberIds = Array.from(
    new Set([input.creatorId, ...input.memberIds.filter(Boolean)]),
  );

  if (memberIds.length < 3) {
    throw new Error("Groups need at least three members including you.");
  }

  const name = input.name.trim();

  if (!name) {
    throw new Error("Group name is required.");
  }

  db.exec("BEGIN");

  try {
    const conversation = db
      .prepare(
        `
          INSERT INTO conversations (type, name, created_by)
          VALUES ('group', ?, ?)
        `,
      )
      .run(name, input.creatorId);

    const conversationId = Number(conversation.lastInsertRowid);
    const insertMembership = db.prepare(
      `
        INSERT INTO conversation_members (conversation_id, user_id)
        VALUES (?, ?)
      `,
    );

    for (const memberId of memberIds) {
      insertMembership.run(conversationId, memberId);
    }

    db.exec("COMMIT");
    return conversationId;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function addMessage(input: {
  conversationId: number;
  senderId: number;
  content?: string;
  attachmentPath?: string | null;
  attachmentName?: string | null;
  attachmentKind?: AttachmentKind | null;
}) {
  ensureConversationMembership(input.senderId, input.conversationId);

  const content = input.content?.trim() ?? "";

  if (!content && !input.attachmentPath) {
    throw new Error("Add a message or attach a file before sending.");
  }

  const result = db
    .prepare(
      `
        INSERT INTO messages (
          conversation_id,
          sender_id,
          content,
          attachment_path,
          attachment_name,
          attachment_kind
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      input.conversationId,
      input.senderId,
      content || null,
      input.attachmentPath ?? null,
      input.attachmentName ?? null,
      input.attachmentKind ?? null,
    );

  db.prepare(
    `
      UPDATE conversations
      SET updated_at = ?
      WHERE id = ?
    `,
  ).run(nowIso(), input.conversationId);

  return db
    .prepare(
      `
        SELECT
          m.id,
          m.conversation_id AS conversationId,
          m.sender_id AS senderId,
          u.username AS senderName,
          u.avatar_path AS senderAvatarPath,
          COALESCE(m.content, '') AS content,
          m.attachment_path AS attachmentPath,
          m.attachment_name AS attachmentName,
          m.attachment_kind AS attachmentKind,
          m.created_at AS createdAt
        FROM messages m
        INNER JOIN users u ON u.id = m.sender_id
        WHERE m.id = ?
      `,
    )
    .get(Number(result.lastInsertRowid)) as ChatMessage;
}

export function updateUserProfile(input: {
  userId: number;
  username?: string;
  status?: string;
  avatarPath?: string | null;
}) {
  const currentUser = getUserById(input.userId);
  const username = input.username?.trim() || currentUser.username;
  const status = input.status?.trim() || currentUser.status;
  const avatarPath =
    input.avatarPath === undefined ? currentUser.avatarPath : input.avatarPath;

  db.prepare(
    `
      UPDATE users
      SET username = ?, status_text = ?, avatar_path = ?
      WHERE id = ?
    `,
  ).run(username, status, avatarPath, input.userId);

  return getUserById(input.userId);
}

export function touchPresence(userId: number) {
  db.prepare(
    `
      UPDATE users
      SET last_seen = ?
      WHERE id = ?
    `,
  ).run(nowIso(), userId);
}

export function insertSession(input: {
  userId: number;
  tokenHash: string;
  expiresAt: string;
}) {
  db.prepare(
    `
      INSERT INTO sessions (user_id, token_hash, expires_at)
      VALUES (?, ?, ?)
    `,
  ).run(input.userId, input.tokenHash, input.expiresAt);
}

export function deleteSessionByTokenHash(tokenHash: string) {
  db.prepare(
    `
      DELETE FROM sessions
      WHERE token_hash = ?
    `,
  ).run(tokenHash);
}

export function deleteExpiredSessions() {
  db.prepare(
    `
      DELETE FROM sessions
      WHERE expires_at < ?
    `,
  ).run(nowIso());
}

export function getUserFromSessionTokenHash(tokenHash: string) {
  deleteExpiredSessions();

  const row = db
    .prepare(
      `
        SELECT
          u.id,
          u.email,
          u.phone,
          u.username,
          u.status_text AS status,
          u.avatar_path AS avatarPath,
          u.last_seen AS lastSeen,
          u.created_at AS createdAt
        FROM sessions s
        INNER JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ?
          AND s.expires_at > ?
        LIMIT 1
      `,
    )
    .get(tokenHash, nowIso()) as
    | {
        id: number;
        email: string | null;
        phone: string | null;
        username: string;
        status: string;
        avatarPath: string | null;
        lastSeen: string;
        createdAt: string;
      }
    | undefined;

  return row ? serializeUser(row) : null;
}

export function getDatabasePath() {
  return getDatabaseFilePath();
}

export function describeConversation(userId: number, conversationId: number) {
  ensureConversationMembership(userId, conversationId);
  const base = getConversationRow(conversationId);

  if (!base) {
    throw new Error("Conversation not found.");
  }

  const participants = getConversationParticipants(conversationId);
  const otherParticipant =
    base.type === "direct"
      ? participants.find((participant) => participant.id !== userId)
      : null;

  return {
    ...base,
    name:
      base.type === "group"
        ? base.name?.trim() || "Untitled circle"
        : otherParticipant?.username || "Direct chat",
    imagePath:
      base.type === "group"
        ? base.imagePath
        : (otherParticipant?.avatarPath ?? null),
    participants,
  };
}
