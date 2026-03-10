import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";
import type { SessionUser } from "@/lib/types";

type SiteFrameProps = {
  user: SessionUser | null;
  children: ReactNode;
};

export function SiteFrame({ user, children }: SiteFrameProps) {
  return (
    <div className="site-shell">
      <SiteHeader user={user} />
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <div className="site-footer__inner">
          <p>Atelier Form builds living, dining, and workspace furniture with a warm studio finish.</p>
          <p>Demo payments: UPI, Card, and Cash on Delivery.</p>
        </div>
      </footer>
    </div>
  );
}
