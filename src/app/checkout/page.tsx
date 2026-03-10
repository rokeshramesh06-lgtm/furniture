import { CheckoutPage } from "@/components/checkout-page";
import { SiteFrame } from "@/components/site-frame";
import { getAddressForUser } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function CheckoutRoute() {
  const user = await getSessionUser();
  const address = user ? getAddressForUser(user.id) : null;

  return (
    <SiteFrame user={user}>
      <CheckoutPage user={user} savedAddress={address} />
    </SiteFrame>
  );
}
