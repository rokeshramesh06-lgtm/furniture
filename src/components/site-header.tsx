"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, UserRound } from "lucide-react";
import { useState } from "react";

import { AuthDialog } from "@/components/auth-dialog";
import { useCart } from "@/components/cart-provider";
import { formatCurrency } from "@/lib/format";
import type { SessionUser } from "@/lib/types";

type SiteHeaderProps = {
  user: SessionUser | null;
};

export function SiteHeader({ user }: SiteHeaderProps) {
  const pathname = usePathname();
  const { items, count, subtotal, updateQuantity, removeItem } = useCart();
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  function isActive(path: string) {
    return pathname === path;
  }

  function handleLogout() {
    setIsPending(true);

    void (async () => {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
      window.location.assign(window.location.href);
    })();
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <Link href="/" className="brand-block">
            <span className="brand-mark">AF</span>
            <span>
              <strong>Atelier Form</strong>
              <small>Furniture portfolio and orders</small>
            </span>
          </Link>

          <nav className="site-nav">
            <Link href="/" className={isActive("/") ? "nav-link active" : "nav-link"}>
              Collection
            </Link>
            <Link
              href="/checkout"
              className={isActive("/checkout") ? "nav-link active" : "nav-link"}
            >
              Checkout
            </Link>
            <Link
              href="/account"
              className={isActive("/account") ? "nav-link active" : "nav-link"}
            >
              Account
            </Link>
            {user?.role === "admin" ? (
              <Link
                href="/admin"
                className={isActive("/admin") ? "nav-link active" : "nav-link"}
              >
                Admin
              </Link>
            ) : null}
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="button button-light button-icon"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag size={18} />
              <span>Cart {count > 0 ? `(${count})` : ""}</span>
            </button>

            {user ? (
              <div className="account-pill">
                <span>
                  <strong>{user.name}</strong>
                  <small>{user.role === "admin" ? "Admin access" : user.email}</small>
                </span>
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={handleLogout}
                  disabled={isPending}
                >
                  {isPending ? "Signing out..." : "Sign out"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="button button-primary button-icon"
                onClick={() => setAuthOpen(true)}
              >
                <UserRound size={18} />
                <span>Login / Register</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />

      {cartOpen ? (
        <div className="drawer-backdrop" onClick={() => setCartOpen(false)}>
          <aside
            className="cart-drawer"
            onClick={(event) => event.stopPropagation()}
            aria-label="Shopping cart"
          >
            <div className="drawer-header">
              <div>
                <h2 className="panel-title">Shopping cart</h2>
                <p className="panel-copy">Update quantities or head straight to checkout.</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setCartOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="drawer-body">
              {items.length === 0 ? (
                <div className="empty-panel">
                  <p>Your cart is empty.</p>
                  <p className="panel-copy">Add a sofa, bed, chair, or desk from the collection.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.productId} className="cart-item">
                    <div className="cart-item__meta">
                      <strong>{item.name}</strong>
                      <small>{item.category} | {item.color}</small>
                      <small>{formatCurrency(item.price)}</small>
                    </div>
                    <div className="cart-item__actions">
                      <div className="qty-control">
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="button button-ghost"
                        onClick={() => removeItem(item.productId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="drawer-footer">
              <div className="summary-row">
                <span>Subtotal</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
              <Link
                href="/checkout"
                className="button button-primary"
                onClick={() => setCartOpen(false)}
              >
                Go to checkout
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
