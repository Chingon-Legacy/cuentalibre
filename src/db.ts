import Database from "@tauri-apps/plugin-sql";
import type { BackupData, Expense, Invoice, InvoiceStatus, Recurrence } from "./types";

let dbPromise: Promise<Database> | null = null;

function getDb(): Promise<Database> {
  if (!dbPromise) {
    // Stored in the app's local data folder on the user's computer.
    dbPromise = Database.load("sqlite:cuentalibre.db");
  }
  return dbPromise;
}

async function columnExists(table: string, col: string): Promise<boolean> {
  const db = await getDb();
  const cols = await db.select<{ name: string }[]>(`PRAGMA table_info(${table})`);
  return cols.some((c) => c.name === col);
}

/** Sequential invoice numbers, e.g. "0001". Kept in settings so they never repeat. */
async function nextInvoiceNumber(): Promise<string> {
  const cur = parseInt((await getSetting("invoiceSeq")) ?? "0", 10) || 0;
  const next = cur + 1;
  await setSetting("invoiceSeq", String(next));
  return String(next).padStart(4, "0");
}

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** Add one period (weekly/monthly) to a YYYY-MM-DD date. */
function addPeriod(iso: string, r: Recurrence): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (r === "weekly") {
    dt.setDate(dt.getDate() + 7);
  } else {
    const day = dt.getDate();
    dt.setDate(1);
    dt.setMonth(dt.getMonth() + 1);
    const lastDay = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
    dt.setDate(Math.min(day, lastDay));
  }
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate()
  ).padStart(2, "0")}`;
}

export async function initDb(): Promise<void> {
  const db = await getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL DEFAULT '',
      customer TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'waiting',
      recurrence TEXT NOT NULL DEFAULT 'none',
      recurring_from INTEGER,
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

  // Migrations for databases created before these columns existed.
  const newCols: [string, string][] = [
    ["number", "TEXT NOT NULL DEFAULT ''"],
    ["recurrence", "TEXT NOT NULL DEFAULT 'none'"],
    ["recurring_from", "INTEGER"],
  ];
  for (const [col, def] of newCols) {
    if (!(await columnExists("invoices", col))) {
      await db.execute(`ALTER TABLE invoices ADD COLUMN ${col} ${def}`);
    }
  }
  // Give older invoices their sequential numbers.
  const unnumbered = await db.select<{ id: number }[]>(
    "SELECT id FROM invoices WHERE number = '' ORDER BY id ASC"
  );
  for (const row of unnumbered) {
    await db.execute("UPDATE invoices SET number = $1 WHERE id = $2", [
      await nextInvoiceNumber(),
      row.id,
    ]);
  }
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
  recurrence?: Recurrence;
}): Promise<void> {
  const db = await getDb();
  const number = await nextInvoiceNumber();
  await db.execute(
    "INSERT INTO invoices (number, customer, amount, category, due_date, status, recurrence, recurring_from, created_at) VALUES ($1, $2, $3, $4, $5, 'waiting', $6, NULL, $7)",
    [
      number,
      input.customer,
      input.amount,
      input.category,
      input.due_date,
      input.recurrence ?? "none",
      new Date().toISOString(),
    ]
  );
}

export async function updateInvoice(
  id: number,
  input: { customer: string; amount: number; category: string; due_date: string }
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE invoices SET customer = $1, amount = $2, category = $3, due_date = $4 WHERE id = $5",
    [input.customer, input.amount, input.category, input.due_date, id]
  );
}

/**
 * Creates the next invoice for every recurring template whose next
 * period has arrived. Generated invoices are linked to their template
 * (recurring_from) and never duplicated within the same period.
 */
export async function generateRecurringInvoices(): Promise<void> {
  const db = await getDb();
  const templates = await db.select<Invoice[]>(
    "SELECT * FROM invoices WHERE recurrence IN ('weekly','monthly')"
  );
  const today = localToday();
  for (const tpl of templates) {
    let next = addPeriod(tpl.due_date, tpl.recurrence);
    let guard = 0;
    while (next <= today && guard < 60) {
      guard++;
      const existing = await db.select<{ id: number }[]>(
        "SELECT id FROM invoices WHERE recurring_from = $1 AND due_date = $2",
        [tpl.id, next]
      );
      if (existing.length === 0) {
        await db.execute(
          "INSERT INTO invoices (number, customer, amount, category, due_date, status, recurrence, recurring_from, created_at) VALUES ($1,$2,$3,$4,$5,'waiting','none',$6,$7)",
          [
            await nextInvoiceNumber(),
            tpl.customer,
            tpl.amount,
            tpl.category,
            next,
            tpl.id,
            new Date().toISOString(),
          ]
        );
      }
      next = addPeriod(next, tpl.recurrence);
    }
  }
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

export async function updateExpense(
  id: number,
  input: { description: string; amount: number; category: string; date: string }
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE expenses SET description = $1, amount = $2, category = $3, date = $4 WHERE id = $5",
    [input.description, input.amount, input.category, input.date, id]
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
      "INSERT INTO invoices (number, customer, amount, category, due_date, status, recurrence, recurring_from, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [
        inv.number ?? "",
        inv.customer,
        inv.amount,
        inv.category ?? "other",
        inv.due_date,
        inv.status,
        inv.recurrence ?? "none",
        inv.recurring_from ?? null,
        inv.created_at,
      ]
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
  if (typeof data.businessName === "string") {
    await setSetting("businessName", data.businessName);
  }
  // Backups made before invoice numbers existed carry number = ''.
  const unnumbered = await db.select<{ id: number }[]>(
    "SELECT id FROM invoices WHERE number = '' ORDER BY id ASC"
  );
  for (const row of unnumbered) {
    await db.execute("UPDATE invoices SET number = $1 WHERE id = $2", [
      await nextInvoiceNumber(),
      row.id,
    ]);
  }
}
