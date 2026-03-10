import { SiteFrame } from "@/components/site-frame";
import { StorefrontPage } from "@/components/storefront-page";
import { getStorefrontSnapshot } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [user, snapshot] = await Promise.all([
    getSessionUser(),
    Promise.resolve(getStorefrontSnapshot()),
  ]);

  return (
    <SiteFrame user={user}>
      <StorefrontPage user={user} snapshot={snapshot} />
    </SiteFrame>
  );
}
