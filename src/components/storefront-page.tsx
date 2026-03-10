"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useState } from "react";

import { useCart } from "@/components/cart-provider";
import { formatCurrency } from "@/lib/format";
import {
  CATEGORY_OPTIONS,
  PRICE_FILTERS,
  type PriceFilterValue,
  type SessionUser,
  type StorefrontSnapshot,
} from "@/lib/types";

type StorefrontPageProps = {
  user: SessionUser | null;
  snapshot: StorefrontSnapshot;
};

export function StorefrontPage({ user, snapshot }: StorefrontPageProps) {
  const { addItem } = useCart();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | (typeof CATEGORY_OPTIONS)[number]>("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilterValue>("all");
  const [addedId, setAddedId] = useState<number | null>(null);
  const deferredQuery = useDeferredValue(query);
  const selectedPrice = PRICE_FILTERS.find((filter) => filter.value === priceFilter) ?? PRICE_FILTERS[0];

  const filteredProducts = snapshot.products.filter((product) => {
    const matchesQuery = product.name
      .toLowerCase()
      .includes(deferredQuery.trim().toLowerCase());
    const matchesCategory = category === "all" || product.category === category;
    const matchesPrice =
      product.price >= selectedPrice.min && product.price <= selectedPrice.max;

    return matchesQuery && matchesCategory && matchesPrice;
  });

  function handleAdd(productId: number) {
    const product = snapshot.products.find((item) => item.id === productId);

    if (!product) {
      return;
    }

    addItem(product, 1);
    setAddedId(productId);
    window.setTimeout(() => {
      setAddedId((current) => (current === productId ? null : current));
    }, 1200);
  }

  return (
    <div className="page-stack">
      <section className="hero-grid">
        <div className="surface hero-copy">
          <p className="kicker">Furniture made for calm homes</p>
          <h1>Designed for living rooms, bedrooms, dining corners, and focused workspaces.</h1>
          <p className="lead-copy">
            Browse handcrafted furniture, filter by category or budget, save your delivery
            address, and order directly from a clean mobile-friendly storefront.
          </p>
          <div className="hero-actions">
            <Link href="#collection" className="button button-primary">
              Explore collection
            </Link>
            <Link href="/checkout" className="button button-light">
              Checkout
            </Link>
          </div>
          <div className="feature-list">
            <div>
              <strong>{snapshot.stats.productCount}</strong>
              <span>Furniture pieces</span>
            </div>
            <div>
              <strong>{snapshot.stats.categoryCount}</strong>
              <span>Core categories</span>
            </div>
            <div>
              <strong>{snapshot.stats.deliveredOrders}</strong>
              <span>Delivered demo orders</span>
            </div>
          </div>
        </div>

        <div className="surface hero-visual">
          <div className="hero-scene">
            <Image
              src="/furniture/room-scene-photo.jpg"
              alt="Furniture interior scene"
              fill
              loading="eager"
              unoptimized
              sizes="(max-width: 900px) 100vw, 46vw"
              className="hero-scene__image"
            />
          </div>
          <div className="hero-meta">
            <div>
              <strong>Most requested</strong>
              <p>Sofas, platform beds, dining tables, accent chairs, and executive desks.</p>
            </div>
            <div>
              <strong>Account-ready ordering</strong>
              <p>
                {user
                  ? `Signed in as ${user.name}. Your checkout is ready.`
                  : "Register to save your address and keep your order history in one place."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-stack">
        <div className="section-heading">
          <div>
            <h2>Featured collection</h2>
            <p>Editorial picks for homes that need warmth, texture, and everyday practicality.</p>
          </div>
        </div>
        <div className="featured-grid">
          {snapshot.featuredProducts.map((product) => (
            <article key={product.id} className="surface featured-card">
              <div className="product-image product-image--featured">
                <Image
                  src={product.imagePath}
                  alt={product.name}
                  fill
                  loading="eager"
                  unoptimized
                  sizes="(max-width: 900px) 100vw, 25vw"
                  className="product-image__asset"
                />
              </div>
              <div className="product-copy">
                <div className="product-header">
                  <div>
                    <p className="muted-label">{product.category}</p>
                    <h3>{product.name}</h3>
                  </div>
                  <strong>{formatCurrency(product.price)}</strong>
                </div>
                <p>{product.description}</p>
                <p className="spec-row">
                  <span>Size: {product.size}</span>
                  <span>Material: {product.material}</span>
                  <span>Color: {product.color}</span>
                </p>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => handleAdd(product.id)}
                >
                  {addedId === product.id ? "Added to cart" : "Add to cart"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="collection" className="section-stack">
        <div className="section-heading">
          <div>
            <h2>Browse the collection</h2>
            <p>Search by name or filter the catalogue by furniture type and price.</p>
          </div>
        </div>

        <div className="surface toolbar-grid">
          <label className="field-stack">
            <span className="field-label">Search by product name</span>
            <input
              className="field-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for a sofa, bed, chair, or desk"
            />
          </label>

          <label className="field-stack">
            <span className="field-label">Filter by category</span>
            <select
              className="field-input"
              value={category}
              onChange={(event) => setCategory(event.target.value as "all")}
            >
              <option value="all">All categories</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="field-stack">
            <span className="field-label">Filter by price</span>
            <select
              className="field-input"
              value={priceFilter}
              onChange={(event) => setPriceFilter(event.target.value as PriceFilterValue)}
            >
              {PRICE_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="product-grid">
          {filteredProducts.map((product) => (
            <article key={product.id} className="surface product-card">
              <div className="product-image">
                <Image
                  src={product.imagePath}
                  alt={product.name}
                  fill
                  loading="eager"
                  unoptimized
                  sizes="(max-width: 900px) 100vw, 25vw"
                  className="product-image__asset"
                />
              </div>
              <div className="product-copy">
                <div className="product-header">
                  <div>
                    <p className="muted-label">{product.category}</p>
                    <h3>{product.name}</h3>
                  </div>
                  <strong>{formatCurrency(product.price)}</strong>
                </div>
                <p>{product.description}</p>
                <dl className="spec-list">
                  <div>
                    <dt>Size</dt>
                    <dd>{product.size}</dd>
                  </div>
                  <div>
                    <dt>Material</dt>
                    <dd>{product.material}</dd>
                  </div>
                  <div>
                    <dt>Color</dt>
                    <dd>{product.color}</dd>
                  </div>
                </dl>
                <div className="card-actions">
                  <span className="stock-copy">{product.stock} pieces available</span>
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => handleAdd(product.id)}
                  >
                    {addedId === product.id ? "Added to cart" : "Add to cart"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="surface empty-panel">
            <p>No products match your current filters.</p>
            <p className="panel-copy">Try a broader search or switch back to all prices.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
