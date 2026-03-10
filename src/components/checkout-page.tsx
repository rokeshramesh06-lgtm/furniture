"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useCart } from "@/components/cart-provider";
import { formatCurrency } from "@/lib/format";
import { PAYMENT_METHODS, type Address, type PaymentMethod, type SessionUser } from "@/lib/types";

type CheckoutPageProps = {
  user: SessionUser | null;
  savedAddress: Address | null;
};

function emptyAddress(): Address {
  return {
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  };
}

export function CheckoutPage({ user, savedAddress }: CheckoutPageProps) {
  const router = useRouter();
  const { items, subtotal, updateQuantity, removeItem, clearCart, isReady } = useCart();
  const [address, setAddress] = useState<Address>(savedAddress ?? emptyAddress());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const shippingFee = subtotal >= 75_000 ? 0 : items.length > 0 ? 1_800 : 0;
  const total = subtotal + shippingFee;

  function updateField(field: keyof Address, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  function handlePlaceOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!user) {
      setMessage("Please sign in from the header before placing your order.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethod,
          address,
          lines: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = (await response.json()) as { error?: string; order?: { id: number } };

      if (!response.ok) {
        setMessage(data.error ?? "We couldn't place your order.");
        return;
      }

      clearCart();
      router.push(`/account?order=${data.order?.id ?? ""}`);
      router.refresh();
    });
  }

  if (isReady && items.length === 0) {
    return (
      <div className="section-stack">
        <section className="surface empty-panel">
          <h1>Checkout</h1>
          <p>Your cart is empty right now.</p>
          <p className="panel-copy">Browse the collection and add furniture before checking out.</p>
          <Link href="/" className="button button-primary">
            Return to collection
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="section-grid section-grid--checkout">
      <section className="surface section-stack">
        <div className="section-heading">
          <div>
            <h1>Checkout</h1>
            <p>
              Save your delivery address, choose a payment method, and place your furniture
              order.
            </p>
          </div>
        </div>

        {!user ? (
          <div className="notice-card">
            <strong>Login required</strong>
            <p>Use the login button in the header to create an account before checkout.</p>
          </div>
        ) : null}

        <div className="checkout-lines">
          {items.map((item) => (
            <article key={item.productId} className="checkout-item">
              <div>
                <strong>{item.name}</strong>
                <p className="panel-copy">
                  {item.category} • {item.material} • {item.color}
                </p>
                <p className="panel-copy">{formatCurrency(item.price)}</p>
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
            </article>
          ))}
        </div>

        <form className="form-stack" onSubmit={handlePlaceOrder}>
          <div className="form-grid">
            <label className="field-stack">
              <span className="field-label">Full name</span>
              <input
                className="field-input"
                value={address.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                required
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Phone</span>
              <input
                className="field-input"
                value={address.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                required
              />
            </label>
            <label className="field-stack field-stack--wide">
              <span className="field-label">Address line 1</span>
              <input
                className="field-input"
                value={address.line1}
                onChange={(event) => updateField("line1", event.target.value)}
                required
              />
            </label>
            <label className="field-stack field-stack--wide">
              <span className="field-label">Address line 2</span>
              <input
                className="field-input"
                value={address.line2}
                onChange={(event) => updateField("line2", event.target.value)}
              />
            </label>
            <label className="field-stack">
              <span className="field-label">City</span>
              <input
                className="field-input"
                value={address.city}
                onChange={(event) => updateField("city", event.target.value)}
                required
              />
            </label>
            <label className="field-stack">
              <span className="field-label">State</span>
              <input
                className="field-input"
                value={address.state}
                onChange={(event) => updateField("state", event.target.value)}
                required
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Postal code</span>
              <input
                className="field-input"
                value={address.postalCode}
                onChange={(event) => updateField("postalCode", event.target.value)}
                required
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Country</span>
              <input
                className="field-input"
                value={address.country}
                onChange={(event) => updateField("country", event.target.value)}
                required
              />
            </label>
          </div>

          <div className="payment-grid">
            {PAYMENT_METHODS.map((option) => (
              <label key={option} className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === option}
                  onChange={() => setPaymentMethod(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>

          {message ? <p className="form-error">{message}</p> : null}

          <button type="submit" className="button button-primary" disabled={isPending}>
            {isPending ? "Placing order..." : "Place order"}
          </button>
        </form>
      </section>

      <aside className="surface order-summary">
        <h2>Order summary</h2>
        <div className="summary-row">
          <span>Subtotal</span>
          <strong>{formatCurrency(subtotal)}</strong>
        </div>
        <div className="summary-row">
          <span>Shipping</span>
          <strong>{shippingFee === 0 ? "Free" : formatCurrency(shippingFee)}</strong>
        </div>
        <div className="summary-row summary-row--total">
          <span>Total</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
        <p className="panel-copy">
          Orders above {formatCurrency(75_000)} ship free. Saved addresses can be updated from
          your account page.
        </p>
      </aside>
    </div>
  );
}
