import "server-only";

import Database from "better-sqlite3";
import { scryptSync } from "node:crypto";
import { mkdirSync } from "node:fs";

import { getDatabaseFilePath, getStorageRoot } from "@/lib/storage";
import {
  CATEGORY_OPTIONS,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  type AccountSnapshot,
  type Address,
  type AdminSnapshot,
  type Category,
  type CustomerSummary,
  type Order,
  type OrderLineInput,
  type OrderStatus,
  type PaymentMethod,
  type Product,
  type ProductInput,
  type SessionUser,
  type StorefrontSnapshot,
} from "@/lib/types";

declare global {
  var __atelierDb: Database.Database | undefined;
}

const SEED_PRODUCTS: ProductInput[] = [
  {
    slug: "harbor-curve-sofa",
    name: "Harbor Curve Sofa",
    category: "Sofas",
    price: 52_000,
    imagePath: "/furniture/sofa-curve.svg",
    description: "Deep seating with a curved profile for relaxed living rooms and lounge corners.",
    size: "92 x 38 x 31 in",
    material: "Boucle upholstery, kiln-dried ash frame",
    color: "Warm sand",
    stock: 8,
    featured: true,
  },
  {
    slug: "atelier-daybed",
    name: "Atelier Daybed",
    category: "Sofas",
    price: 46_500,
    imagePath: "/furniture/sofa-daybed.svg",
    description: "A low daybed sofa designed for open-plan studios and quiet reading spaces.",
    size: "86 x 35 x 29 in",
    material: "Linen blend, oak base",
    color: "Clay beige",
    stock: 5,
    featured: false,
  },
  {
    slug: "cedar-platform-bed",
    name: "Cedar Platform Bed",
    category: "Beds",
    price: 61_000,
    imagePath: "/furniture/bed-platform.svg",
    description: "Balanced proportions with a soft headboard and concealed underframe support.",
    size: "King - 78 x 82 x 42 in",
    material: "Walnut veneer, upholstered headboard",
    color: "Walnut and oat",
    stock: 6,
    featured: true,
  },
  {
    slug: "meadow-storage-bed",
    name: "Meadow Storage Bed",
    category: "Beds",
    price: 58_000,
    imagePath: "/furniture/bed-storage.svg",
    description: "Lift-up storage bed for compact apartments that still need a warm, crafted finish.",
    size: "Queen - 64 x 82 x 44 in",
    material: "Engineered wood, cotton-blend fabric",
    color: "Moss and driftwood",
    stock: 4,
    featured: false,
  },
  {
    slug: "ridge-dining-table",
    name: "Ridge Dining Table",
    category: "Dining tables",
    price: 39_500,
    imagePath: "/furniture/table-ridge.svg",
    description: "A six-seater dining table with chamfered edges and a grounded trestle base.",
    size: "72 x 36 x 30 in",
    material: "Solid oak, matte oil finish",
    color: "Natural oak",
    stock: 7,
    featured: true,
  },
  {
    slug: "grove-round-table",
    name: "Grove Round Table",
    category: "Dining tables",
    price: 34_000,
    imagePath: "/furniture/table-round.svg",
    description: "Round dining table for casual hosting, breakfast corners, and smaller homes.",
    size: "Diameter 48 x 30 in",
    material: "Ash veneer, powder-coated steel base",
    color: "Honey oak and graphite",
    stock: 9,
    featured: false,
  },
  {
    slug: "woven-lounge-chair",
    name: "Woven Lounge Chair",
    category: "Chairs",
    price: 18_500,
    imagePath: "/furniture/chair-woven.svg",
    description: "Relaxed accent chair with woven detailing and a compact footprint.",
    size: "28 x 30 x 31 in",
    material: "Elm frame, handwoven cane",
    color: "Toasted elm",
    stock: 12,
    featured: true,
  },
  {
    slug: "sable-dining-chair",
    name: "Sable Dining Chair",
    category: "Chairs",
    price: 12_800,
    imagePath: "/furniture/chair-sable.svg",
    description: "Upholstered dining chair with a supportive back and everyday durability.",
    size: "19 x 22 x 33 in",
    material: "Rubberwood, textured fabric seat",
    color: "Charcoal and almond",
    stock: 18,
    featured: false,
  },
  {
    slug: "ledger-executive-desk",
    name: "Ledger Executive Desk",
    category: "Office furniture",
    price: 41_000,
    imagePath: "/furniture/office-ledger.svg",
    description: "A broad writing desk with cable routing and generous drawer storage.",
    size: "60 x 28 x 30 in",
    material: "American walnut, brushed metal hardware",
    color: "Walnut brown",
    stock: 6,
    featured: true,
  },
  {
    slug: "frame-task-console",
    name: "Frame Task Console",
    category: "Office furniture",
    price: 24_000,
    imagePath: "/furniture/office-console.svg",
    description: "Streamlined workstation built for compact home offices and study nooks.",
    size: "48 x 24 x 29 in",
    material: "Oak veneer, steel sled frame",
    color: "Oak and blackened bronze",
    stock: 10,
    featured: false,
  },
];

const SEED_USERS = [
  {
    name: "Studio Admin",
    email: "admin@atelierfurniture.local",
    password: "admin12345",
    role: "admin" as const,
  },
  {
    name: "Rhea Kapoor",
    email: "client@atelierfurniture.local",
    password: "client12345",
    role: "customer" as const,
    address: {
      fullName: "Rhea Kapoor",
      phone: "+91 98765 43210",
      line1: "14 Cedar Street",
      line2: "Near Rose Park",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560034",
      country: "India",
    },
  },
] as const;

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: "customer" | "admin";
  createdAt: string;
};

type UserWithPasswordRow = UserRow & {
  passwordHash: string;
};

type ProductRow = {
  id: number;
  slug: string;
  name: string;
  category: string;
  price: number;
  imagePath: string;
  description: string;
  size: string;
  material: string;
  color: string;
  stock: number;
  featured: number;
  createdAt: string;
  updatedAt: string;
};

type AddressRow = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  updatedAt: string;
};

type OrderQueryRow = {
  id: number;
  customerName: string;
  customerEmail: string;
  status: string;
  paymentMethod: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  deliveryFullName: string;
  deliveryPhone: string;
  deliveryLine1: string;
  deliveryLine2: string | null;
  deliveryCity: string;
  deliveryState: string;
  deliveryPostalCode: string;
  deliveryCountry: string;
  createdAt: string;
  updatedAt: string;
  itemId: number | null;
  productId: number | null;
  productName: string | null;
  unitPrice: number | null;
  quantity: number | null;
  lineTotal: number | null;
};

function createSeedPasswordHash(password: string, salt: string) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function deriveNameFromEmail(email: string) {
  const localPart = normalizeEmail(email).split("@")[0] ?? "";
  const cleaned = localPart
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "New Customer";
  }

  return cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function cleanText(value: string, field: string) {
  const cleaned = value.trim().replace(/\s+/g, " ");

  if (!cleaned) {
    throw new Error(`${field} is required.`);
  }

  return cleaned;
}

function normalizeOptionalText(value: string | null | undefined) {
  return value?.trim() ? value.trim() : "";
}

function asCategory(value: string): Category {
  if (!CATEGORY_OPTIONS.includes(value as Category)) {
    throw new Error("Choose a valid furniture category.");
  }

  return value as Category;
}

function asPaymentMethod(value: string): PaymentMethod {
  if (!PAYMENT_METHODS.includes(value as PaymentMethod)) {
    throw new Error("Choose a valid payment option.");
  }

  return value as PaymentMethod;
}

function asOrderStatus(value: string): OrderStatus {
  if (!ORDER_STATUSES.includes(value as OrderStatus)) {
    throw new Error("Choose a valid order status.");
  }

  return value as OrderStatus;
}

function serializeUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.createdAt,
  };
}

function serializeProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: asCategory(row.category),
    price: row.price,
    imagePath: row.imagePath,
    description: row.description,
    size: row.size,
    material: row.material,
    color: row.color,
    stock: row.stock,
    featured: Boolean(row.featured),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function serializeAddress(row: AddressRow): Address {
  return {
    fullName: row.fullName,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2 ?? "",
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,
    country: row.country,
    updatedAt: row.updatedAt,
  };
}

function buildOrders(rows: OrderQueryRow[]): Order[] {
  const map = new Map<number, Order>();

  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, {
        id: row.id,
        customerName: row.customerName,
        customerEmail: row.customerEmail,
        status: asOrderStatus(row.status),
        paymentMethod: asPaymentMethod(row.paymentMethod),
        subtotal: row.subtotal,
        shippingFee: row.shippingFee,
        total: row.total,
        deliveryAddress: {
          fullName: row.deliveryFullName,
          phone: row.deliveryPhone,
          line1: row.deliveryLine1,
          line2: row.deliveryLine2 ?? "",
          city: row.deliveryCity,
          state: row.deliveryState,
          postalCode: row.deliveryPostalCode,
          country: row.deliveryCountry,
        },
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        items: [],
      });
    }

    if (row.itemId && row.productId && row.productName && row.unitPrice && row.quantity && row.lineTotal) {
      map.get(row.id)?.items.push({
        id: row.itemId,
        productId: row.productId,
        productName: row.productName,
        unitPrice: row.unitPrice,
        quantity: row.quantity,
        lineTotal: row.lineTotal,
      });
    }
  }

  return Array.from(map.values());
}

function createDatabase() {
  mkdirSync(getStorageRoot(), { recursive: true });

  const database = new Database(getDatabaseFilePath());
  database.exec(`
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      line1 TEXT NOT NULL,
      line2 TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'India',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      image_path TEXT NOT NULL,
      description TEXT NOT NULL,
      size TEXT NOT NULL,
      material TEXT NOT NULL,
      color TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Confirmed', 'Dispatched', 'Delivered')),
      payment_method TEXT NOT NULL CHECK(payment_method IN ('UPI', 'Card', 'Cash on Delivery')),
      subtotal INTEGER NOT NULL,
      shipping_fee INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL,
      delivery_full_name TEXT NOT NULL,
      delivery_phone TEXT NOT NULL,
      delivery_line1 TEXT NOT NULL,
      delivery_line2 TEXT,
      delivery_city TEXT NOT NULL,
      delivery_state TEXT NOT NULL,
      delivery_postal_code TEXT NOT NULL,
      delivery_country TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
    CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      unit_price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      line_total INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
  `);

  seedDatabase(database);

  return database;
}

function getDatabase() {
  if (!globalThis.__atelierDb) {
    globalThis.__atelierDb = createDatabase();
  }

  return globalThis.__atelierDb;
}

export const db = new Proxy({} as Database.Database, {
  get(_target, property) {
    const database = getDatabase() as Database.Database & Record<PropertyKey, unknown>;
    const value = database[property];
    return typeof value === "function" ? value.bind(database) : value;
  },
});

function seedDatabase(database: Database.Database) {
  database.exec("BEGIN");

  try {
    const upsertProduct = database.prepare(`
      INSERT INTO products (
        slug,
        name,
        category,
        price,
        image_path,
        description,
        size,
        material,
        color,
        stock,
        featured,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name,
        category = excluded.category,
        price = excluded.price,
        image_path = excluded.image_path,
        description = excluded.description,
        size = excluded.size,
        material = excluded.material,
        color = excluded.color,
        featured = excluded.featured,
        updated_at = excluded.updated_at
    `);

    for (const product of SEED_PRODUCTS) {
      upsertProduct.run(
        product.slug,
        product.name,
        product.category,
        product.price,
        product.imagePath,
        product.description,
        product.size,
        product.material,
        product.color,
        product.stock,
        product.featured ? 1 : 0,
        nowIso(),
      );
    }

    const upsertUser = database.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        name = excluded.name,
        password_hash = excluded.password_hash,
        role = excluded.role
    `);
    const upsertAddress = database.prepare(`
      INSERT INTO addresses (
        user_id,
        full_name,
        phone,
        line1,
        line2,
        city,
        state,
        postal_code,
        country,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        full_name = excluded.full_name,
        phone = excluded.phone,
        line1 = excluded.line1,
        line2 = excluded.line2,
        city = excluded.city,
        state = excluded.state,
        postal_code = excluded.postal_code,
        country = excluded.country,
        updated_at = excluded.updated_at
    `);

    for (const [index, user] of SEED_USERS.entries()) {
      const salt = `atelier-seed-${index + 1}`;
      upsertUser.run(
        user.name,
        user.email,
        createSeedPasswordHash(user.password, salt),
        user.role,
      );

      if ("address" in user && user.address) {
        const userRow = database
          .prepare("SELECT id FROM users WHERE email = ? LIMIT 1")
          .get(user.email) as { id: number };

        upsertAddress.run(
          userRow.id,
          user.address.fullName,
          user.address.phone,
          user.address.line1,
          user.address.line2,
          user.address.city,
          user.address.state,
          user.address.postalCode,
          user.address.country,
          nowIso(),
        );
      }
    }

    const orderCount = database
      .prepare("SELECT COUNT(*) AS count FROM orders")
      .get() as { count: number };

    if (orderCount.count === 0) {
      seedInitialOrders(database);
    }

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function seedInitialOrders(database: Database.Database) {
  const customer = database
    .prepare(`
      SELECT id, name, email
      FROM users
      WHERE email = ?
      LIMIT 1
    `)
    .get("client@atelierfurniture.local") as
    | {
        id: number;
        name: string;
        email: string;
      }
    | undefined;

  if (!customer) {
    return;
  }

  const address = database
    .prepare(`
      SELECT
        full_name AS fullName,
        phone,
        line1,
        line2,
        city,
        state,
        postal_code AS postalCode,
        country,
        updated_at AS updatedAt
      FROM addresses
      WHERE user_id = ?
      LIMIT 1
    `)
    .get(customer.id) as AddressRow | undefined;

  if (!address) {
    return;
  }

  const products = database
    .prepare(`
      SELECT
        id,
        slug,
        name,
        category,
        price,
        image_path AS imagePath,
        description,
        size,
        material,
        color,
        stock,
        featured,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM products
      WHERE slug IN ('harbor-curve-sofa', 'ridge-dining-table', 'woven-lounge-chair')
      ORDER BY id ASC
    `)
    .all() as ProductRow[];

  if (products.length === 0) {
    return;
  }

  const quantityBySlug = new Map([
    ["harbor-curve-sofa", 1],
    ["ridge-dining-table", 1],
    ["woven-lounge-chair", 2],
  ]);
  const subtotal = products.reduce((total, product) => {
    return total + product.price * (quantityBySlug.get(product.slug) ?? 1);
  }, 0);
  const shippingFee = subtotal >= 75_000 ? 0 : 1_800;
  const orderResult = database
    .prepare(`
      INSERT INTO orders (
        user_id,
        status,
        payment_method,
        subtotal,
        shipping_fee,
        total,
        delivery_full_name,
        delivery_phone,
        delivery_line1,
        delivery_line2,
        delivery_city,
        delivery_state,
        delivery_postal_code,
        delivery_country,
        created_at,
        updated_at
      )
      VALUES (?, 'Delivered', 'UPI', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      customer.id,
      subtotal,
      shippingFee,
      subtotal + shippingFee,
      address.fullName,
      address.phone,
      address.line1,
      address.line2 ?? "",
      address.city,
      address.state,
      address.postalCode,
      address.country,
      "2026-03-01T10:15:00.000Z",
      "2026-03-04T15:00:00.000Z",
    );

  const orderId = Number(orderResult.lastInsertRowid);
  const insertItem = database.prepare(`
    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      unit_price,
      quantity,
      line_total
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const product of products) {
    const quantity = quantityBySlug.get(product.slug) ?? 1;
    insertItem.run(
      orderId,
      product.id,
      product.name,
      product.price,
      quantity,
      product.price * quantity,
    );
  }
}

export function createUser(input: {
  name?: string;
  email: string;
  passwordHash: string;
  role?: "customer" | "admin";
}) {
  const email = normalizeEmail(input.email);
  const name = cleanText(input.name?.trim() || deriveNameFromEmail(email), "Name");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  const result = db
    .prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `)
    .run(name, email, input.passwordHash, input.role ?? "customer");

  return getUserById(Number(result.lastInsertRowid));
}

export function findUserForLogin(email: string) {
  const row = db
    .prepare(`
      SELECT
        id,
        name,
        email,
        role,
        created_at AS createdAt,
        password_hash AS passwordHash
      FROM users
      WHERE email = ?
      LIMIT 1
    `)
    .get(normalizeEmail(email)) as UserWithPasswordRow | undefined;

  return row ?? null;
}

export function getUserById(userId: number) {
  const row = db
    .prepare(`
      SELECT
        id,
        name,
        email,
        role,
        created_at AS createdAt
      FROM users
      WHERE id = ?
      LIMIT 1
    `)
    .get(userId) as UserRow | undefined;

  if (!row) {
    throw new Error("User not found.");
  }

  return serializeUser(row);
}

export function insertSession(input: {
  userId: number;
  tokenHash: string;
  expiresAt: string;
}) {
  db.prepare(`
    INSERT INTO sessions (user_id, token_hash, expires_at)
    VALUES (?, ?, ?)
  `).run(input.userId, input.tokenHash, input.expiresAt);
}

export function deleteSessionByTokenHash(tokenHash: string) {
  db.prepare(`
    DELETE FROM sessions
    WHERE token_hash = ?
  `).run(tokenHash);
}

function deleteExpiredSessions() {
  db.prepare(`
    DELETE FROM sessions
    WHERE expires_at < ?
  `).run(nowIso());
}

export function getUserFromSessionTokenHash(tokenHash: string) {
  deleteExpiredSessions();

  const row = db
    .prepare(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at AS createdAt
      FROM sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?
        AND s.expires_at > ?
      LIMIT 1
    `)
    .get(tokenHash, nowIso()) as UserRow | undefined;

  return row ? serializeUser(row) : null;
}

export function listProducts() {
  const rows = db
    .prepare(`
      SELECT
        id,
        slug,
        name,
        category,
        price,
        image_path AS imagePath,
        description,
        size,
        material,
        color,
        stock,
        featured,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM products
      ORDER BY featured DESC, name COLLATE NOCASE ASC
    `)
    .all() as ProductRow[];

  return rows.map(serializeProduct);
}

function validateProductInput(input: ProductInput) {
  return {
    slug: cleanText(input.slug, "Slug").toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    name: cleanText(input.name, "Product name"),
    category: asCategory(input.category),
    price: Number(input.price),
    imagePath: cleanText(input.imagePath, "Image path"),
    description: cleanText(input.description, "Description"),
    size: cleanText(input.size, "Size"),
    material: cleanText(input.material, "Material"),
    color: cleanText(input.color, "Color"),
    stock: Math.max(0, Number(input.stock) || 0),
    featured: Boolean(input.featured),
  } satisfies ProductInput;
}

function getProductById(productId: number) {
  const row = db
    .prepare(`
      SELECT
        id,
        slug,
        name,
        category,
        price,
        image_path AS imagePath,
        description,
        size,
        material,
        color,
        stock,
        featured,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM products
      WHERE id = ?
      LIMIT 1
    `)
    .get(productId) as ProductRow | undefined;

  if (!row) {
    throw new Error("Product not found.");
  }

  return serializeProduct(row);
}

export function createProduct(input: ProductInput) {
  const payload = validateProductInput(input);
  const result = db
    .prepare(`
      INSERT INTO products (
        slug,
        name,
        category,
        price,
        image_path,
        description,
        size,
        material,
        color,
        stock,
        featured,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      payload.slug,
      payload.name,
      payload.category,
      payload.price,
      payload.imagePath,
      payload.description,
      payload.size,
      payload.material,
      payload.color,
      payload.stock,
      payload.featured ? 1 : 0,
      nowIso(),
    );

  return getProductById(Number(result.lastInsertRowid));
}

export function updateProduct(productId: number, input: ProductInput) {
  const payload = validateProductInput(input);

  db.prepare(`
    UPDATE products
    SET
      slug = ?,
      name = ?,
      category = ?,
      price = ?,
      image_path = ?,
      description = ?,
      size = ?,
      material = ?,
      color = ?,
      stock = ?,
      featured = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    payload.slug,
    payload.name,
    payload.category,
    payload.price,
    payload.imagePath,
    payload.description,
    payload.size,
    payload.material,
    payload.color,
    payload.stock,
    payload.featured ? 1 : 0,
    nowIso(),
    productId,
  );

  return getProductById(productId);
}

function validateAddressInput(input: Address) {
  return {
    fullName: cleanText(input.fullName, "Full name"),
    phone: cleanText(input.phone, "Phone"),
    line1: cleanText(input.line1, "Address line 1"),
    line2: normalizeOptionalText(input.line2),
    city: cleanText(input.city, "City"),
    state: cleanText(input.state, "State"),
    postalCode: cleanText(input.postalCode, "Postal code"),
    country: cleanText(input.country, "Country"),
  } satisfies Address;
}

export function getAddressForUser(userId: number) {
  const row = db
    .prepare(`
      SELECT
        full_name AS fullName,
        phone,
        line1,
        line2,
        city,
        state,
        postal_code AS postalCode,
        country,
        updated_at AS updatedAt
      FROM addresses
      WHERE user_id = ?
      LIMIT 1
    `)
    .get(userId) as AddressRow | undefined;

  return row ? serializeAddress(row) : null;
}

export function saveAddress(userId: number, input: Address) {
  const payload = validateAddressInput(input);

  db.prepare(`
    INSERT INTO addresses (
      user_id,
      full_name,
      phone,
      line1,
      line2,
      city,
      state,
      postal_code,
      country,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      full_name = excluded.full_name,
      phone = excluded.phone,
      line1 = excluded.line1,
      line2 = excluded.line2,
      city = excluded.city,
      state = excluded.state,
      postal_code = excluded.postal_code,
      country = excluded.country,
      updated_at = excluded.updated_at
  `).run(
    userId,
    payload.fullName,
    payload.phone,
    payload.line1,
    payload.line2,
    payload.city,
    payload.state,
    payload.postalCode,
    payload.country,
    nowIso(),
  );

  return getAddressForUser(userId);
}

function listOrders(whereClause: string, parameters: Array<number | string>) {
  const rows = db
    .prepare(`
      SELECT
        o.id,
        u.name AS customerName,
        u.email AS customerEmail,
        o.status,
        o.payment_method AS paymentMethod,
        o.subtotal,
        o.shipping_fee AS shippingFee,
        o.total,
        o.delivery_full_name AS deliveryFullName,
        o.delivery_phone AS deliveryPhone,
        o.delivery_line1 AS deliveryLine1,
        o.delivery_line2 AS deliveryLine2,
        o.delivery_city AS deliveryCity,
        o.delivery_state AS deliveryState,
        o.delivery_postal_code AS deliveryPostalCode,
        o.delivery_country AS deliveryCountry,
        o.created_at AS createdAt,
        o.updated_at AS updatedAt,
        oi.id AS itemId,
        oi.product_id AS productId,
        oi.product_name AS productName,
        oi.unit_price AS unitPrice,
        oi.quantity,
        oi.line_total AS lineTotal
      FROM orders o
      INNER JOIN users u ON u.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      ${whereClause}
      ORDER BY o.created_at DESC, oi.id ASC
    `)
    .all(...parameters) as OrderQueryRow[];

  return buildOrders(rows);
}

function getOrderById(orderId: number) {
  const order = listOrders("WHERE o.id = ?", [orderId])[0];

  if (!order) {
    throw new Error("Order not found.");
  }

  return order;
}

export function listOrdersForUser(userId: number) {
  return listOrders("WHERE o.user_id = ?", [userId]);
}

export function listOrdersForAdmin() {
  return listOrders("", []);
}

export function updateOrderStatus(orderId: number, status: OrderStatus) {
  db.prepare(`
    UPDATE orders
    SET status = ?, updated_at = ?
    WHERE id = ?
  `).run(status, nowIso(), orderId);

  return getOrderById(orderId);
}

export function createOrder(input: {
  userId: number;
  paymentMethod: PaymentMethod;
  lines: OrderLineInput[];
  address: Address;
}) {
  const address = validateAddressInput(input.address);
  const paymentMethod = asPaymentMethod(input.paymentMethod);
  const quantities = new Map<number, number>();

  for (const line of input.lines) {
    const quantity = Math.max(0, Math.floor(Number(line.quantity) || 0));

    if (!line.productId || quantity <= 0) {
      continue;
    }

    quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + quantity);
  }

  if (quantities.size === 0) {
    throw new Error("Your cart is empty.");
  }

  const selectProduct = db.prepare(`
    SELECT
      id,
      slug,
      name,
      category,
      price,
      image_path AS imagePath,
      description,
      size,
      material,
      color,
      stock,
      featured,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM products
    WHERE id = ?
    LIMIT 1
  `);

  const products = Array.from(quantities.entries()).map(([productId, quantity]) => {
    const row = selectProduct.get(productId) as ProductRow | undefined;

    if (!row) {
      throw new Error("One of the selected furniture items is no longer available.");
    }

    const product = serializeProduct(row);

    if (product.stock < quantity) {
      throw new Error(`Only ${product.stock} unit(s) of ${product.name} are available right now.`);
    }

    return {
      product,
      quantity,
      lineTotal: product.price * quantity,
    };
  });

  const subtotal = products.reduce((total, entry) => total + entry.lineTotal, 0);
  const shippingFee = subtotal >= 75_000 ? 0 : 1_800;
  const total = subtotal + shippingFee;

  db.exec("BEGIN");

  try {
    const orderResult = db
      .prepare(`
        INSERT INTO orders (
          user_id,
          status,
          payment_method,
          subtotal,
          shipping_fee,
          total,
          delivery_full_name,
          delivery_phone,
          delivery_line1,
          delivery_line2,
          delivery_city,
          delivery_state,
          delivery_postal_code,
          delivery_country,
          updated_at
        )
        VALUES (?, 'Pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        input.userId,
        paymentMethod,
        subtotal,
        shippingFee,
        total,
        address.fullName,
        address.phone,
        address.line1,
        address.line2,
        address.city,
        address.state,
        address.postalCode,
        address.country,
        nowIso(),
      );

    const orderId = Number(orderResult.lastInsertRowid);
    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (
        order_id,
        product_id,
        product_name,
        unit_price,
        quantity,
        line_total
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const reduceStock = db.prepare(`
      UPDATE products
      SET stock = stock - ?, updated_at = ?
      WHERE id = ?
    `);

    for (const entry of products) {
      insertOrderItem.run(
        orderId,
        entry.product.id,
        entry.product.name,
        entry.product.price,
        entry.quantity,
        entry.lineTotal,
      );

      reduceStock.run(entry.quantity, nowIso(), entry.product.id);
    }

    saveAddress(input.userId, address);
    db.exec("COMMIT");
    return getOrderById(orderId);
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function listCustomersForAdmin(): CustomerSummary[] {
  const rows = db
    .prepare(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at AS joinedAt,
        COUNT(o.id) AS ordersCount,
        COALESCE(SUM(o.total), 0) AS totalSpend,
        CASE
          WHEN a.user_id IS NULL THEN NULL
          ELSE a.city || ', ' || a.state
        END AS savedAddress
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      LEFT JOIN addresses a ON a.user_id = u.id
      GROUP BY u.id
      ORDER BY u.role DESC, u.name COLLATE NOCASE ASC
    `)
    .all() as Array<{
    id: number;
    name: string;
    email: string;
    role: "customer" | "admin";
    joinedAt: string;
    ordersCount: number;
    totalSpend: number;
    savedAddress: string | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    ordersCount: row.ordersCount,
    totalSpend: row.totalSpend,
    joinedAt: row.joinedAt,
    savedAddress: row.savedAddress,
  }));
}

export function getStorefrontSnapshot(): StorefrontSnapshot {
  const products = listProducts();
  const deliveredOrdersRow = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM orders
      WHERE status = 'Delivered'
    `)
    .get() as { count: number };

  return {
    products,
    featuredProducts: products.filter((product) => product.featured).slice(0, 4),
    stats: {
      productCount: products.length,
      categoryCount: CATEGORY_OPTIONS.length,
      deliveredOrders: deliveredOrdersRow.count,
    },
  };
}

export function getAccountSnapshot(userId: number): AccountSnapshot {
  return {
    address: getAddressForUser(userId),
    orders: listOrdersForUser(userId),
  };
}

export function getAdminSnapshot(): AdminSnapshot {
  return {
    products: listProducts(),
    orders: listOrdersForAdmin(),
    customers: listCustomersForAdmin(),
  };
}

export function getDatabasePath() {
  return getDatabaseFilePath();
}
