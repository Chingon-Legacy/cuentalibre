import Database from "@tauri-apps/plugin-sql";
import type { BackupData, Expense, Invoice, InvoiceStatus } from "./types";

let dbPromise: Promise<Database> | null = null;

function getDb(): Promise<Database> {
  if (!dbPromise) {
    // Stored in the app's local data folder on the user's computer.
    dbPromise = Database.load("sqlite:cuentalibre.db");
  }
  return dbPromise;
}

export async function initDb(): Promise<void> {
  const db = await getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'waiting',
      created_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}

// ---- settings (key/value) ----

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>(
    "SELECT value FROM settings WHERE key = $1",
    [key]
  );
  return rows.length > 0 ? rows[0].value : null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2",
    [key, value]
  );
}

// ---- invoices ----

export async function getInvoices(): Promise<Invoice[]> {
  const db = await getDb();
  return db.select<Invoice[]>("SELECT * FROM invoices ORDER BY due_date ASC");
}

export async function addInvoice(input: {
  customer: string;
  amount: number;
  category: string;
  due_date: string;
}): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO invoices (customer, amount, category, due_date, status, created_at) VALUES ($1, $2, $3, $4, 'waiting', $5)",
    [input.customer, input.amount, input.category, input.due_date, new Date().toISOString()]
  );
}

export async function setInvoiceStatus(id: number, status: InvoiceStatus): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE invoices SET status = $1 WHERE id = $2", [status, id]);
}

export async function deleteInvoice(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM invoices WHERE id = $1", [id]);
}

// ---- expenses ----

export async function getExpenses(): Promise<Expense[]> {
  const db = await getDb();
  return db.select<Expense[]>("SELECT * FROM expenses ORDER BY date DESC");
}

export async function addExpense(input: {
  description: string;
  amount: number;
  category: string;
  date: string;
}): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO expenses (description, amount, category, date, created_at) VALUES ($1, $2, $3, $4, $5)",
    [input.description, input.amount, input.category, input.date, new Date().toISOString()]
  );
}

export async function deleteExpense(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM expenses WHERE id = $1", [id]);
}

// ---- backup / restore ----

export async function clearAllData(): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM invoices");
  await db.execute("DELETE FROM expenses");
}

export async function importBackup(data: BackupData): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM invoices");
  await db.execute("DELETE FROM expenses");
  for (const inv of data.invoices) {
    await db.execute(
      "INSERT INTO invoices (customer, amount, category, due_date, status, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [inv.customer, inv.amount, inv.category ?? "other", inv.due_date, inv.status, inv.created_at]
    );
  }
  for (const exp of data.expenses) {
    await db.execute(
      "INSERT INTO expenses (description, amount, category, date, created_at) VALUES ($1, $2, $3, $4, $5)",
      [exp.description, exp.amount, exp.category, exp.date, exp.created_at]
    );
  }
  if (data.businessType) {
    await setSetting("businessType", data.businessType);
  }
}
