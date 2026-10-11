import { chmodSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const connections = new Map<string, DatabaseSync>()

const SCHEMA = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_demo INTEGER NOT NULL DEFAULT 0,
    next_order_number INTEGER NOT NULL DEFAULT 1001,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL CHECK (stock >= 0),
    reorder_level INTEGER NOT NULL DEFAULT 5 CHECK (reorder_level >= 0),
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (workspace_id, sku)
  );
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    store_id TEXT NOT NULL REFERENCES stores(id),
    customer_name TEXT NOT NULL DEFAULT '',
    customer_phone TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'fulfilled', 'cancelled')),
    payment_method TEXT CHECK (payment_method IN ('cash', 'mobile_money', 'card')),
    total INTEGER NOT NULL CHECK (total >= 0),
    note TEXT NOT NULL DEFAULT '',
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    paid_at TEXT,
    UNIQUE (workspace_id, number)
  );
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    unit_price INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0)
  );
  CREATE INDEX IF NOT EXISTS users_workspace ON users(workspace_id);
  CREATE INDEX IF NOT EXISTS stores_workspace ON stores(workspace_id);
  CREATE INDEX IF NOT EXISTS products_workspace ON products(workspace_id, archived);
  CREATE INDEX IF NOT EXISTS orders_workspace_created ON orders(workspace_id, created_at);
  CREATE INDEX IF NOT EXISTS order_items_order ON order_items(order_id);
  CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
`

export function databasePath() {
  return resolve(/*turbopackIgnore: true*/ process.env.SQOOP_DB ?? 'data/sqoop.sqlite3')
}

export function db(): DatabaseSync {
  const path = databasePath()
  const existing = connections.get(path)
  if (existing) return existing
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  const isNew = !existsSync(path)
  const database = new DatabaseSync(path)
  if (isNew) chmodSync(path, 0o600)
  database.exec(SCHEMA)
  connections.set(path, database)
  return database
}

/** Runs fn in a write transaction. Not re-entrant. */
export function transaction<T>(fn: () => T): T {
  const database = db()
  database.exec('BEGIN IMMEDIATE')
  try {
    const result = fn()
    database.exec('COMMIT')
    return result
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }
}

export function closeAll() {
  for (const database of connections.values()) database.close()
  connections.clear()
}

export const newId = () => crypto.randomUUID()
export const nowIso = () => new Date().toISOString()
