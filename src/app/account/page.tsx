import { AccountPage } from "@/components/account-page";
import { SiteFrame } from "@/components/site-frame";
import { getAccountSnapshot } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AccountRoute({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const [user, params] = await Promise.all([getSessionUser(), searchParams]);
  const focusOrderId = params.order ? Number(params.order) : null;
  const snapshot = user ? getAccountSnapshot(user.id) : null;

  return (
    <SiteFrame user={user}>
      <AccountPage user={user} snapshot={snapshot} focusOrderId={focusOrderId} />
    </SiteFrame>
  );
}
