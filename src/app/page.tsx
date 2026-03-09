import { AuthShell } from "@/components/auth-shell";
import { ChatShell } from "@/components/chat-shell";
import { getSessionUser } from "@/lib/session";
import { getBootstrapPayload, getInitialMessages } from "@/lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return <AuthShell />;
  }

  const bootstrap = getBootstrapPayload(sessionUser.id);
  const initialConversationId = bootstrap.conversations[0]?.id ?? null;
  const initialMessages = getInitialMessages(sessionUser.id, initialConversationId);

  return (
    <ChatShell
      initialContacts={bootstrap.contacts}
      initialConversationId={initialConversationId}
      initialConversations={bootstrap.conversations}
      initialCurrentUser={bootstrap.currentUser}
      initialMessages={initialMessages}
    />
  );
}
