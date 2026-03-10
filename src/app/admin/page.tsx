import { AdminPage } from "@/components/admin-page";
import { SiteFrame } from "@/components/site-frame";
import { getAdminSnapshot } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminRoute() {
  const user = await getSessionUser();
  const snapshot = user?.role === "admin" ? getAdminSnapshot() : null;

  return (
    <SiteFrame user={user}>
      <AdminPage user={user} snapshot={snapshot} />
    </SiteFrame>
  );
}
