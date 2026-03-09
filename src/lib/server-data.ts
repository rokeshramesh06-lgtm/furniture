import "server-only";

import {
  ensureDemoInboxForUser,
  getConversationMessages,
  getUserById,
  listContactsForUser,
  listConversationSummaries,
} from "@/lib/db";

export function getBootstrapPayload(userId: number) {
  ensureDemoInboxForUser(userId);

  return {
    currentUser: getUserById(userId),
    contacts: listContactsForUser(userId),
    conversations: listConversationSummaries(userId),
  };
}

export function getInitialMessages(userId: number, conversationId: number | null) {
  if (!conversationId) {
    return [];
  }

  return getConversationMessages(userId, conversationId);
}
