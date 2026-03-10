"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { formatCurrency, formatDate } from "@/lib/format";
import {
  CATEGORY_OPTIONS,
  ORDER_STATUSES,
  type AdminSnapshot,
  type OrderStatus,
  type Product,
  type ProductInput,
  type SessionUser,
} from "@/lib/types";

type AdminPageProps = {
  user: SessionUser | null;
  snapshot: AdminSnapshot | null;
};

function createEmptyProduct(): ProductInput {
  return {
    slug: "",
    name: "",
    category: "Sofas",
    price: 0,
    imagePath: "/furniture/sofa-curve.svg",
    description: "",
    size: "",
    material: "",
    color: "",
    stock: 0,
    featured: false,
  };
}

function toProductInput(product: Product): ProductInput {
  return {
    slug: product.slug,
    name: product.name,
    category: product.category,
    price: product.price,
    imagePath: product.imagePath,
    description: product.description,
    size: product.size,
    material: product.material,
    color: product.color,
    stock: product.stock,
    featured: product.featured,
  };
}

export function AdminPage({ user, snapshot }: AdminPageProps) {
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductInput>(createEmptyProduct());
  const [message, setMessage] = useState("");
  const [orderStates, setOrderStates] = useState<Record<number, OrderStatus>>(
    Object.fromEntries(
      (snapshot?.orders ?? []).map((order) => [order.id, order.status]),
    ) as Record<number, OrderStatus>,
  );
  const [isPending, startTransition] = useTransition();

  if (!user || user.role !== "admin" || !snapshot) {
    return (
      <section className="surface empty-panel">
        <h1>Admin panel</h1>
        <p>Sign in with the demo admin account to manage furniture items and orders.</p>
        <p className="panel-copy">Demo admin: admin@atelierfurniture.local / admin12345</p>
      </section>
    );
  }

  function updateField<K extends keyof ProductInput>(field: K, value: ProductInput[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function editProduct(product: Product) {
    setSelectedProductId(product.id);
    setForm(toProductInput(product));
    setMessage("");
  }

  function resetForm() {
    setSelectedProductId(null);
    setForm(createEmptyProduct());
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const response = await fetch("/api/admin/products", {
        method: selectedProductId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          selectedProductId ? { ...form, id: selectedProductId } : form,
        ),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(data.error ?? "Unable to save the product.");
        return;
      }

      setMessage(selectedProductId ? "Product updated." : "Product added.");
      resetForm();
      router.refresh();
    });
  }

  function handleOrderUpdate(orderId: number) {
    setMessage("");

    startTransition(async () => {
      const response = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          status: orderStates[orderId],
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(data.error ?? "Unable to update the order.");
        return;
      }

      setMessage(`Order #${orderId} updated.`);
      router.refresh();
    });
  }

  return (
    <div className="page-stack">
      <section className="section-grid section-grid--admin">
        <form className="surface section-stack" onSubmit={handleSubmit}>
          <div className="section-heading">
            <div>
              <h1>{selectedProductId ? "Edit furniture item" : "Add furniture item"}</h1>
              <p>Manage catalogue entries, pricing, inventory, and featured highlights.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="field-stack">
              <span className="field-label">Product name</span>
              <input
                className="field-input"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Slug</span>
              <input
                className="field-input"
                value={form.slug}
                onChange={(event) => updateField("slug", event.target.value)}
                required
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Category</span>
              <select
                className="field-input"
                value={form.category}
                onChange={(event) => updateField("category", event.target.value as Product["category"])}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-stack">
              <span className="field-label">Price (INR)</span>
              <input
                className="field-input"
                type="number"
                min={0}
                value={form.price}
                onChange={(event) => updateField("price", Number(event.target.value))}
                required
              />
            </label>
            <label className="field-stack field-stack--wide">
              <span className="field-label">Image path</span>
              <input
                className="field-input"
                value={form.imagePath}
                onChange={(event) => updateField("imagePath", event.target.value)}
                required
              />
            </label>
            <label className="field-stack field-stack--wide">
              <span className="field-label">Description</span>
              <textarea
                className="field-input field-input--textarea"
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                required
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Size</span>
              <input
                className="field-input"
                value={form.size}
                onChange={(event) => updateField("size", event.target.value)}
                required
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Material</span>
              <input
                className="field-input"
                value={form.material}
                onChange={(event) => updateField("material", event.target.value)}
                required
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Color</span>
              <input
                className="field-input"
                value={form.color}
                onChange={(event) => updateField("color", event.target.value)}
                required
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Stock</span>
              <input
                className="field-input"
                type="number"
                min={0}
                value={form.stock}
                onChange={(event) => updateField("stock", Number(event.target.value))}
                required
              />
            </label>
          </div>

          <label className="check-row">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) => updateField("featured", event.target.checked)}
            />
            <span>Mark as featured</span>
          </label>

          {message ? <p className="form-success">{message}</p> : null}

          <div className="hero-actions">
            <button type="submit" className="button button-primary" disabled={isPending}>
              {isPending
                ? "Saving..."
                : selectedProductId
                  ? "Update furniture item"
                  : "Add furniture item"}
            </button>
            {selectedProductId ? (
              <button type="button" className="button button-light" onClick={resetForm}>
                Clear form
              </button>
            ) : null}
          </div>
        </form>

        <div className="surface section-stack">
          <div className="section-heading">
            <div>
              <h2>Catalogue inventory</h2>
              <p>Tap any product to load it into the editor.</p>
            </div>
          </div>

          <div className="stack-list">
            {snapshot.products.map((product) => (
              <button
                key={product.id}
                type="button"
                className="list-item-button"
                onClick={() => editProduct(product)}
              >
                <span>
                  <strong>{product.name}</strong>
                  <small>
                    {product.category} • {formatCurrency(product.price)} • {product.stock} in stock
                  </small>
                </span>
                <span>{product.featured ? "Featured" : "Standard"}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="surface section-stack">
        <div className="section-heading">
          <div>
            <h2>Manage orders</h2>
            <p>Review placed orders and update their status as they move through fulfilment.</p>
          </div>
        </div>

        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Placed</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {snapshot.orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>#{order.id}</strong>
                    <small>{order.items.length} items</small>
                  </td>
                  <td>
                    <strong>{order.customerName}</strong>
                    <small>{order.customerEmail}</small>
                  </td>
                  <td>{formatCurrency(order.total)}</td>
                  <td>
                    <select
                      className="table-select"
                      value={orderStates[order.id] ?? order.status}
                      onChange={(event) =>
                        setOrderStates((current) => ({
                          ...current,
                          [order.id]: event.target.value as OrderStatus,
                        }))
                      }
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="button button-ghost"
                      onClick={() => handleOrderUpdate(order.id)}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface section-stack">
        <div className="section-heading">
          <div>
            <h2>Customers</h2>
            <p>View registered customers, their spend, and whether they have a saved address.</p>
          </div>
        </div>

        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Orders</th>
                <th>Total spend</th>
                <th>Saved address</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.customers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <strong>{customer.name}</strong>
                    <small>{customer.email}</small>
                  </td>
                  <td>{customer.role}</td>
                  <td>{customer.ordersCount}</td>
                  <td>{formatCurrency(customer.totalSpend)}</td>
                  <td>{customer.savedAddress ?? "Not saved yet"}</td>
                  <td>{formatDate(customer.joinedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
