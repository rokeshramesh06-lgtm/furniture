"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { formatCurrency, formatDate } from "@/lib/format";
import type { AccountSnapshot, Address, SessionUser } from "@/lib/types";

type AccountPageProps = {
  user: SessionUser | null;
  snapshot: AccountSnapshot | null;
  focusOrderId?: number | null;
};

function blankAddress(): Address {
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

export function AccountPage({ user, snapshot, focusOrderId }: AccountPageProps) {
  const [address, setAddress] = useState<Address>(snapshot?.address ?? blankAddress());
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function updateField(field: keyof Address, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  function handleSaveAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const response = await fetch("/api/account/address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(address),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(data.error ?? "Unable to save the address.");
        return;
      }

      setMessage("Delivery address saved.");
    });
  }

  if (!user || !snapshot) {
    return (
      <section className="surface empty-panel">
        <h1>Your account</h1>
        <p>Sign in or register from the header to save your address and view your orders.</p>
        <Link href="/" className="button button-primary">
          Return to collection
        </Link>
      </section>
    );
  }

  return (
    <div className="section-grid section-grid--account">
      <section className="surface section-stack">
        <div className="section-heading">
          <div>
            <h1>{user.name}</h1>
            <p>{user.email}</p>
          </div>
        </div>

        <form className="form-stack" onSubmit={handleSaveAddress}>
          <div className="section-heading">
            <div>
              <h2>Saved delivery address</h2>
              <p>Keep your preferred address ready for faster checkout.</p>
            </div>
          </div>

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

          {message ? <p className="form-success">{message}</p> : null}

          <button type="submit" className="button button-primary" disabled={isPending}>
            {isPending ? "Saving..." : "Save address"}
          </button>
        </form>
      </section>

      <section className="surface section-stack">
        <div className="section-heading">
          <div>
            <h2>Order history</h2>
            <p>Track placed orders and the furniture included in each delivery.</p>
          </div>
        </div>

        {snapshot.orders.length === 0 ? (
          <div className="empty-panel">
            <p>No orders yet.</p>
            <p className="panel-copy">Your future purchases will show up here after checkout.</p>
          </div>
        ) : (
          snapshot.orders.map((order) => (
            <article
              key={order.id}
              className={
                focusOrderId === order.id ? "order-card order-card--active" : "order-card"
              }
            >
              <div className="order-card__head">
                <div>
                  <strong>Order #{order.id}</strong>
                  <p className="panel-copy">
                    {formatDate(order.createdAt)} • {order.status} • {order.paymentMethod}
                  </p>
                </div>
                <strong>{formatCurrency(order.total)}</strong>
              </div>
              <div className="order-card__items">
                {order.items.map((item) => (
                  <div key={item.id} className="summary-row">
                    <span>
                      {item.productName} x {item.quantity}
                    </span>
                    <strong>{formatCurrency(item.lineTotal)}</strong>
                  </div>
                ))}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
