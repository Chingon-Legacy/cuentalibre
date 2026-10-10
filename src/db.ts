import Database from "@tauri-apps/plugin-sql";
import type {
  BackupData,
  Bill,
  Contractor,
  ContractorPayment,
  Expense,
  Invoice,
  InvoiceStatus,
  Quote,
  QuoteStatus,
  Recurrence,
} from "./types";

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

/** Sequential quote numbers, e.g. "0001". Kept in settings so they never repeat. */
async function nextQuoteNumber(): Promise<string> {
  const cur = parseInt((await getSetting("quoteSeq")) ?? "0", 10) || 0;
  const next = cur + 1;
  await setSetting("quoteSeq", String(next));
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

/** Sales tax on a subtotal. rate is a decimal fraction (0.07 = 7%). */
export function calcTaxAmount(subtotal: number, rate: number): number {
  if (!rate || rate <= 0) return 0;
  return Math.round(subtotal * rate * 100) / 100;
}

/** Full amount the customer pays: subtotal + sales tax. */
export function invoiceTotal(inv: { amount: number; tax_amount: number }): number {
  return Math.round((inv.amount + inv.tax_amount) * 100) / 100;
}

export async function initDb(): Promise<void> {
  const db = await getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL DEFAULT '',
      customer TEXT NOT NULL,
      amount REAL NOT NULL,
      tax_rate REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
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
  await db.execute(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payee TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unpaid',
      created_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL DEFAULT '',
      customer TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      valid_until TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS contractors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS contractor_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    )
  `);

  // Migrations for databases created before these columns existed.
  const newCols: [string, string][] = [
    ["number", "TEXT NOT NULL DEFAULT ''"],
    ["recurrence", "TEXT NOT NULL DEFAULT 'none'"],
    ["recurring_from", "INTEGER"],
    ["tax_rate", "REAL NOT NULL DEFAULT 0"],
    ["tax_amount", "REAL NOT NULL DEFAULT 0"],
  ];
  for (const [col, def] of newCols) {
    if (!(await columnExists("invoices", col))) {
      await db.execute(`ALTER TABLE invoices ADD COLUMN ${col} ${def}`);
    }
  }
  // Receipt photos live in a new nullable column on expenses.
  if (!(await columnExists("expenses", "photo"))) {
    await db.execute("ALTER TABLE expenses ADD COLUMN photo TEXT");
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
  tax_rate?: number;
}): Promise<void> {
  const db = await getDb();
  const number = await nextInvoiceNumber();
  const rate = input.tax_rate ?? 0;
  const taxAmount = calcTaxAmount(input.amount, rate);
  await db.execute(
    "INSERT INTO invoices (number, customer, amount, tax_rate, tax_amount, category, due_date, status, recurrence, recurring_from, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, 'waiting', $8, NULL, $9)",
    [
      number,
      input.customer,
      input.amount,
      rate,
      taxAmount,
      input.category,
      input.due_date,
      input.recurrence ?? "none",
      new Date().toISOString(),
    ]
  );
}

export async function updateInvoice(
  id: number,
  input: { customer: string; amount: number; category: string; due_date: string; tax_rate: number }
): Promise<void> {
  const db = await getDb();
  const taxAmount = calcTaxAmount(input.amount, input.tax_rate);
  await db.execute(
    "UPDATE invoices SET customer = $1, amount = $2, tax_rate = $3, tax_amount = $4, category = $5, due_date = $6 WHERE id = $7",
    [input.customer, input.amount, input.tax_rate, taxAmount, input.category, input.due_date, id]
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
          "INSERT INTO invoices (number, customer, amount, tax_rate, tax_amount, category, due_date, status, recurrence, recurring_from, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,'waiting','none',$8,$9)",
          [
            await nextInvoiceNumber(),
            tpl.customer,
            tpl.amount,
            tpl.tax_rate ?? 0,
            calcTaxAmount(tpl.amount, tpl.tax_rate ?? 0),
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

/** Returns the new expense's id so callers can attach a receipt photo file. */
export async function addExpense(input: {
  description: string;
  amount: number;
  category: string;
  date: string;
  photo?: string | null;
}): Promise<number> {
  const db = await getDb();
  const res = await db.execute(
    "INSERT INTO expenses (description, amount, category, date, photo, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
    [
      input.description,
      input.amount,
      input.category,
      input.date,
      input.photo ?? null,
      new Date().toISOString(),
    ]
  );
  return Number(res.lastInsertId ?? 0);
}

export async function updateExpense(
  id: number,
  input: { description: string; amount: number; category: string; date: string; photo?: string | null }
): Promise<void> {
  const db = await getDb();
  if (input.photo === undefined) {
    await db.execute(
      "UPDATE expenses SET description = $1, amount = $2, category = $3, date = $4 WHERE id = $5",
      [input.description, input.amount, input.category, input.date, id]
    );
  } else {
    await db.execute(
      "UPDATE expenses SET description = $1, amount = $2, category = $3, date = $4, photo = $5 WHERE id = $6",
      [input.description, input.amount, input.category, input.date, input.photo, id]
    );
  }
}

export async function setExpensePhoto(id: number, photo: string | null): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE expenses SET photo = $1 WHERE id = $2", [photo, id]);
}

export async function deleteExpense(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM expenses WHERE id = $1", [id]);
}

// ---- bills (money you owe) ----

export async function getBills(): Promise<Bill[]> {
  const db = await getDb();
  return db.select<Bill[]>("SELECT * FROM bills ORDER BY due_date ASC");
}

export async function addBill(input: {
  payee: string;
  amount: number;
  category: string;
  due_date: string;
}): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO bills (payee, amount, category, due_date, status, created_at) VALUES ($1, $2, $3, $4, 'unpaid', $5)",
    [input.payee, input.amount, input.category, input.due_date, new Date().toISOString()]
  );
}

export async function updateBill(
  id: number,
  input: { payee: string; amount: number; category: string; due_date: string }
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE bills SET payee = $1, amount = $2, category = $3, due_date = $4 WHERE id = $5",
    [input.payee, input.amount, input.category, input.due_date, id]
  );
}

/**
 * Marks a bill paid AND records a matching expense, so the money
 * flows into reports and the cash-flow chart automatically.
 */
export async function payBill(id: number): Promise<void> {
  const db = await getDb();
  const rows = await db.select<Bill[]>("SELECT * FROM bills WHERE id = $1", [id]);
  const bill = rows[0];
  if (!bill || bill.status === "paid") return;
  await db.execute("UPDATE bills SET status = 'paid' WHERE id = $1", [id]);
  await db.execute(
    "INSERT INTO expenses (description, amount, category, date, photo, created_at) VALUES ($1, $2, $3, $4, NULL, $5)",
    [
      `Bill paid: ${bill.payee}`,
      bill.amount,
      bill.category,
      localToday(),
      new Date().toISOString(),
    ]
  );
}

export async function deleteBill(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM bills WHERE id = $1", [id]);
}

// ---- quotes ----

export async function getQuotes(): Promise<Quote[]> {
  const db = await getDb();
  return db.select<Quote[]>("SELECT * FROM quotes ORDER BY created_at DESC");
}

export async function addQuote(input: {
  customer: string;
  amount: number;
  category: string;
  valid_until: string;
}): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO quotes (number, customer, amount, category, valid_until, status, created_at) VALUES ($1, $2, $3, $4, $5, 'draft', $6)",
    [
      await nextQuoteNumber(),
      input.customer,
      input.amount,
      input.category,
      input.valid_until,
      new Date().toISOString(),
    ]
  );
}

export async function updateQuote(
  id: number,
  input: { customer: string; amount: number; category: string; valid_until: string }
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE quotes SET customer = $1, amount = $2, category = $3, valid_until = $4 WHERE id = $5",
    [input.customer, input.amount, input.category, input.valid_until, id]
  );
}

export async function setQuoteStatus(id: number, status: QuoteStatus): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE quotes SET status = $1 WHERE id = $2", [status, id]);
}

export async function deleteQuote(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM quotes WHERE id = $1", [id]);
}

// ---- contractors + 1099 tracking ----

export async function getContractors(): Promise<Contractor[]> {
  const db = await getDb();
  return db.select<Contractor[]>("SELECT * FROM contractors ORDER BY name ASC");
}

export async function addContractor(input: { name: string; note: string }): Promise<void> {
  const db = await getDb();
  await db.execute("INSERT INTO contractors (name, note, created_at) VALUES ($1, $2, $3)", [
    input.name,
    input.note,
    new Date().toISOString(),
  ]);
}

export async function deleteContractor(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM contractor_payments WHERE contractor_id = $1", [id]);
  await db.execute("DELETE FROM contractors WHERE id = $1", [id]);
}

export async function getContractorPayments(): Promise<ContractorPayment[]> {
  const db = await getDb();
  return db.select<ContractorPayment[]>(
    "SELECT * FROM contractor_payments ORDER BY date DESC"
  );
}

export async function addContractorPayment(input: {
  contractor_id: number;
  amount: number;
  date: string;
  note: string;
}): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO contractor_payments (contractor_id, amount, date, note, created_at) VALUES ($1, $2, $3, $4, $5)",
    [input.contractor_id, input.amount, input.date, input.note, new Date().toISOString()]
  );
}

export async function deleteContractorPayment(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM contractor_payments WHERE id = $1", [id]);
}

// ---- backup / restore ----

export async function clearAllData(): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM invoices");
  await db.execute("DELETE FROM expenses");
  await db.execute("DELETE FROM bills");
  await db.execute("DELETE FROM quotes");
  await db.execute("DELETE FROM contractors");
  await db.execute("DELETE FROM contractor_payments");
}

export async function importBackup(data: BackupData): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM invoices");
  await db.execute("DELETE FROM expenses");
  await db.execute("DELETE FROM bills");
  await db.execute("DELETE FROM quotes");
  await db.execute("DELETE FROM contractors");
  await db.execute("DELETE FROM contractor_payments");
  for (const inv of data.invoices) {
    await db.execute(
      "INSERT INTO invoices (number, customer, amount, tax_rate, tax_amount, category, due_date, status, recurrence, recurring_from, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
      [
        inv.number ?? "",
        inv.customer,
        inv.amount,
        inv.tax_rate ?? 0,
        inv.tax_amount ?? 0,
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
      "INSERT INTO expenses (description, amount, category, date, photo, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [exp.description, exp.amount, exp.category, exp.date, exp.photo ?? null, exp.created_at]
    );
  }
  if (Array.isArray(data.bills)) {
    for (const b of data.bills) {
      await db.execute(
        "INSERT INTO bills (payee, amount, category, due_date, status, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
        [b.payee, b.amount, b.category ?? "other", b.due_date, b.status, b.created_at]
      );
    }
  }
  if (Array.isArray(data.quotes)) {
    for (const q of data.quotes) {
      await db.execute(
        "INSERT INTO quotes (number, customer, amount, category, valid_until, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [
          q.number ?? "",
          q.customer,
          q.amount,
          q.category ?? "other",
          q.valid_until,
          q.status,
          q.created_at,
        ]
      );
    }
  }
  if (Array.isArray(data.contractors)) {
    for (const c of data.contractors) {
      await db.execute(
        "INSERT INTO contractors (name, note, created_at) VALUES ($1, $2, $3)",
        [c.name, c.note ?? "", c.created_at]
      );
    }
  }
  if (Array.isArray(data.contractorPayments)) {
    // Match payments to contractors by name, since ids restart on restore.
    const cons = await db.select<Contractor[]>("SELECT * FROM contractors");
    const byName = new Map(cons.map((c) => [c.name, c.id]));
    for (const p of data.contractorPayments) {
      const contractor = (data.contractors ?? []).find((c) => c.id === p.contractor_id);
      const newId = contractor ? byName.get(contractor.name) : undefined;
      if (!newId) continue;
      await db.execute(
        "INSERT INTO contractor_payments (contractor_id, amount, date, note, created_at) VALUES ($1, $2, $3, $4, $5)",
        [newId, p.amount, p.date, p.note ?? "", p.created_at]
      );
    }
  }
  if (data.businessType) {
    await setSetting("businessType", data.businessType);
  }
  if (typeof data.businessName === "string") {
    await setSetting("businessName", data.businessName);
  }
  if (typeof data.businessState === "string") {
    await setSetting("businessState", data.businessState);
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
  const unnumberedQuotes = await db.select<{ id: number }[]>(
    "SELECT id FROM quotes WHERE number = '' ORDER BY id ASC"
  );
  for (const row of unnumberedQuotes) {
    await db.execute("UPDATE quotes SET number = $1 WHERE id = $2", [
      await nextQuoteNumber(),
      row.id,
    ]);
  }
}
