import Database from "@tauri-apps/plugin-sql";
import type {
  AccountingMethod,
  BackupData,
  Bill,
  Business,
  Contractor,
  ContractorPayment,
  Donation,
  EntityType,
  Expense,
  Invoice,
  InvoiceStatus,
  Loan,
  LoanPayment,
  PayMethod,
  Quote,
  QuoteStatus,
  Recurrence,
  Service,
  TimeEntry,
  Trip,
} from "./types";

let dbPromise: Promise<Database> | null = null;

function getDb(): Promise<Database> {
  if (!dbPromise) {
    // TEMP-QA-MOCK (revert after QA): in a plain browser there is no Tauri
    // SQL plugin, so use an in-memory sql.js database.
    dbPromise = (async () => {
      const { isTauri, getBrowserDb } = await import("./shot-mock");
      if (!isTauri()) return (await getBrowserDb()) as unknown as Database;
      return Database.load("sqlite:cuentalibre.db");
    })();
  }
  return dbPromise;
}

/* ---------- multi-business support ----------
 * Every money table carries business_id. All getters/inserts below operate
 * on the ACTIVE business, set via setActiveBusinessId() after initDb().
 * Callers must set it before reading/writing; exportAllData() bypasses
 * the filter for backups.
 */
let activeBusinessId: number | null = null;

export function setActiveBusinessId(id: number): void {
  activeBusinessId = id;
}

export function getActiveBusinessId(): number | null {
  return activeBusinessId;
}

/** "WHERE business_id = N" when an active business is set, else no filter. */
function bizFilter(): string {
  return activeBusinessId == null ? "" : `WHERE business_id = ${activeBusinessId}`;
}

function bizFilterAnd(): string {
  return activeBusinessId == null ? "" : `AND business_id = ${activeBusinessId}`;
}

async function columnExists(table: string, col: string): Promise<boolean> {
  const db = await getDb();
  const cols = await db.select<{ name: string }[]>(`PRAGMA table_info(${table})`);
  return cols.some((c) => c.name === col);
}

/** Sequential invoice numbers per business, e.g. "0001". Never repeat. */
async function nextInvoiceNumber(): Promise<string> {
  const key = `invoiceSeq:${activeBusinessId ?? 0}`;
  const cur = parseInt((await getSetting(key)) ?? "0", 10) || 0;
  const next = cur + 1;
  await setSetting(key, String(next));
  return String(next).padStart(4, "0");
}

/** Sequential quote numbers per business, e.g. "0001". Never repeat. */
async function nextQuoteNumber(): Promise<string> {
  const key = `quoteSeq:${activeBusinessId ?? 0}`;
  const cur = parseInt((await getSetting(key)) ?? "0", 10) || 0;
  const next = cur + 1;
  await setSetting(key, String(next));
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

const MONEY_TABLES = [
  "invoices",
  "expenses",
  "bills",
  "quotes",
  "contractors",
  "contractor_payments",
  "services",
  "time_entries",
  "trips",
  "loans",
  "loan_payments",
  "donations",
] as const;

export async function initDb(): Promise<void> {
  const db = await getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'freelancer',
      entity_type TEXT NOT NULL DEFAULT 'forprofit',
      accounting_method TEXT NOT NULL DEFAULT 'cash',
      state TEXT NOT NULL DEFAULT '',
      ein TEXT NOT NULL DEFAULT '',
      fiscal_year_end INTEGER NOT NULL DEFAULT 12,
      mission TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL DEFAULT 1,
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
      business_id INTEGER NOT NULL DEFAULT 1,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      photo TEXT,
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
      business_id INTEGER NOT NULL DEFAULT 1,
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
      business_id INTEGER NOT NULL DEFAULT 1,
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
      business_id INTEGER NOT NULL DEFAULT 1,
      name TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS contractor_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL DEFAULT 1,
      contractor_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL DEFAULT 1,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS time_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL DEFAULT 1,
      customer TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      hours REAL NOT NULL,
      date TEXT NOT NULL,
      invoiced INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL DEFAULT 1,
      date TEXT NOT NULL,
      miles REAL NOT NULL,
      purpose TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL DEFAULT 1,
      name TEXT NOT NULL,
      borrowed_amount REAL NOT NULL,
      date_borrowed TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS loan_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL DEFAULT 1,
      loan_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL DEFAULT 1,
      donor TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      campaign TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    )
  `);

  // Migrations for databases created before these columns existed.
  if (!(await columnExists("invoices", "business_id"))) {
    await db.execute("ALTER TABLE invoices ADD COLUMN business_id INTEGER NOT NULL DEFAULT 1");
  }
  for (const t of ["expenses", "bills", "quotes", "contractors", "contractor_payments"]) {
    if (!(await columnExists(t, "business_id"))) {
      await db.execute(`ALTER TABLE ${t} ADD COLUMN business_id INTEGER NOT NULL DEFAULT 1`);
    }
  }
  for (const t of MONEY_TABLES) {
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_${t}_biz ON ${t}(business_id)`).catch(() => undefined);
  }
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
  // Nonprofit support: existing businesses default to for-profit.
  // Accounting method: existing businesses default to cash.
  const bizCols: [string, string][] = [
    ["entity_type", "TEXT NOT NULL DEFAULT 'forprofit'"],
    ["accounting_method", "TEXT NOT NULL DEFAULT 'cash'"],
    ["ein", "TEXT NOT NULL DEFAULT ''"],
    ["fiscal_year_end", "INTEGER NOT NULL DEFAULT 12"],
    ["mission", "TEXT NOT NULL DEFAULT ''"],
  ];
  for (const [col, def] of bizCols) {
    if (!(await columnExists("businesses", col))) {
      await db.execute(`ALTER TABLE businesses ADD COLUMN ${col} ${def}`);
    }
  }
  // Receipt photos live in a new nullable column on expenses.
  if (!(await columnExists("expenses", "photo"))) {
    await db.execute("ALTER TABLE expenses ADD COLUMN photo TEXT");
  }
  // How money moved: cash, card, transfer, or check (nullable = not set).
  for (const t of ["invoices", "expenses", "bills"] as const) {
    if (!(await columnExists(t, "pay_method"))) {
      await db.execute(`ALTER TABLE ${t} ADD COLUMN pay_method TEXT`);
    }
  }
  // Recurring expenses mirror recurring invoices.
  if (!(await columnExists("expenses", "recurrence"))) {
    await db.execute("ALTER TABLE expenses ADD COLUMN recurrence TEXT NOT NULL DEFAULT 'none'");
  }
  if (!(await columnExists("expenses", "recurring_from"))) {
    await db.execute("ALTER TABLE expenses ADD COLUMN recurring_from INTEGER");
  }

  // One-time migration: legacy single-business installs get their data
  // folded into a real business row built from the old global settings.
  // Fresh installs skip this entirely — onboarding creates their business.
  const bizCount = await db.select<{ c: number }[]>("SELECT COUNT(*) AS c FROM businesses");
  if (bizCount[0].c === 0) {
    const name = (await getSetting("businessName")) || "";
    const type = (await getSetting("businessType")) || "freelancer";
    const state = (await getSetting("businessState")) || "";
    let legacyRows = 0;
    for (const t of MONEY_TABLES) {
      const r = await db.select<{ c: number }[]>(`SELECT COUNT(*) AS c FROM ${t}`);
      legacyRows += r[0].c;
      if (legacyRows > 0) break;
    }
    if (name || type !== "freelancer" || state || legacyRows > 0) {
    const res = await db.execute(
      "INSERT INTO businesses (name, type, state, created_at) VALUES ($1, $2, $3, $4)",
      [name || "Business 1", type, state, new Date().toISOString()]
    );
    const bid = Number(res.lastInsertId ?? 1);
    for (const t of MONEY_TABLES) {
      await db.execute(`UPDATE ${t} SET business_id = $1`, [bid]);
    }
    // Per-business counters continue past existing numbers.
    const maxInv = await db.select<{ m: number | null }[]>(
      "SELECT MAX(CAST(number AS INTEGER)) AS m FROM invoices WHERE business_id = $1",
      [bid]
    );
    await setSetting(`invoiceSeq:${bid}`, String(maxInv[0].m ?? 0));
    const maxQ = await db.select<{ m: number | null }[]>(
      "SELECT MAX(CAST(number AS INTEGER)) AS m FROM quotes WHERE business_id = $1",
      [bid]
    );
    await setSetting(`quoteSeq:${bid}`, String(maxQ[0].m ?? 0));
    // Old global keys are superseded by the businesses table.
    await db.execute(
      "DELETE FROM settings WHERE key IN ('businessName','businessType','businessState','invoiceSeq','quoteSeq')"
    );
    }
  }

  // Give older invoices their sequential numbers.
  const unnumbered = await db.select<{ id: number; business_id: number }[]>(
    "SELECT id, business_id FROM invoices WHERE number = '' ORDER BY id ASC"
  );
  for (const row of unnumbered) {
    const prev = activeBusinessId;
    activeBusinessId = row.business_id;
    const num = await nextInvoiceNumber();
    activeBusinessId = prev;
    await db.execute("UPDATE invoices SET number = $1 WHERE id = $2", [num, row.id]);
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

// ---- businesses ----

export async function getBusinesses(): Promise<Business[]> {
  const db = await getDb();
  return db.select<Business[]>("SELECT * FROM businesses ORDER BY id ASC");
}

export async function addBusiness(input: {
  name: string;
  type: string;
  state: string;
  entity_type?: EntityType;
  accounting_method?: AccountingMethod;
}): Promise<number> {
  const db = await getDb();
  const res = await db.execute(
    "INSERT INTO businesses (name, type, entity_type, accounting_method, state, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
    [input.name, input.type, input.entity_type ?? "forprofit", input.accounting_method ?? "cash", input.state, new Date().toISOString()]
  );
  return Number(res.lastInsertId ?? 0);
}

/** Sets a business's accounting method (cash or accrual). */
export async function updateAccountingMethod(
  id: number,
  method: AccountingMethod
): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE businesses SET accounting_method = $1 WHERE id = $2", [method, id]);
}

/** Updates a nonprofit's IRS-facing fields (EIN, fiscal year end, mission). */
export async function updateNonprofitFields(
  id: number,
  input: { ein: string; fiscal_year_end: number; mission: string }
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE businesses SET ein = $1, fiscal_year_end = $2, mission = $3 WHERE id = $4",
    [input.ein.trim(), input.fiscal_year_end, input.mission.trim(), id]
  );
}

export async function updateBusiness(
  id: number,
  input: { name: string; type: string; state: string }
): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE businesses SET name = $1, type = $2, state = $3 WHERE id = $4", [
    input.name,
    input.type,
    input.state,
    id,
  ]);
}

/** Deletes a business and ALL of its data. The caller confirms first. */
export async function deleteBusiness(id: number): Promise<void> {
  const db = await getDb();
  for (const t of MONEY_TABLES) {
    await db.execute(`DELETE FROM ${t} WHERE business_id = $1`, [id]);
  }
  await db.execute("DELETE FROM businesses WHERE id = $1", [id]);
}

// ---- invoices ----

export async function getInvoices(): Promise<Invoice[]> {
  const db = await getDb();
  return db.select<Invoice[]>(
    `SELECT * FROM invoices ${bizFilter()} ORDER BY due_date ASC`
  );
}

export async function addInvoice(input: {
  customer: string;
  amount: number;
  category: string;
  due_date: string;
  recurrence?: Recurrence;
  tax_rate?: number;
  pay_method?: PayMethod | null;
}): Promise<void> {
  const db = await getDb();
  const number = await nextInvoiceNumber();
  const rate = input.tax_rate ?? 0;
  const taxAmount = calcTaxAmount(input.amount, rate);
  await db.execute(
    "INSERT INTO invoices (business_id, number, customer, amount, tax_rate, tax_amount, category, due_date, status, recurrence, recurring_from, pay_method, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'waiting', $9, NULL, $10, $11)",
    [
      activeBusinessId,
      number,
      input.customer,
      input.amount,
      rate,
      taxAmount,
      input.category,
      input.due_date,
      input.recurrence ?? "none",
      input.pay_method ?? null,
      new Date().toISOString(),
    ]
  );
}

export async function updateInvoice(
  id: number,
  input: { customer: string; amount: number; category: string; due_date: string; tax_rate: number; pay_method?: PayMethod | null }
): Promise<void> {
  const db = await getDb();
  const taxAmount = calcTaxAmount(input.amount, input.tax_rate);
  await db.execute(
    `UPDATE invoices SET customer = $1, amount = $2, tax_rate = $3, tax_amount = $4, category = $5, due_date = $6, pay_method = $7 WHERE id = $8 ${bizFilterAnd()}`,
    [input.customer, input.amount, input.tax_rate, taxAmount, input.category, input.due_date, input.pay_method ?? null, id]
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
    `SELECT * FROM invoices WHERE recurrence IN ('weekly','monthly') ${bizFilterAnd()}`
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
          "INSERT INTO invoices (business_id, number, customer, amount, tax_rate, tax_amount, category, due_date, status, recurrence, recurring_from, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'waiting','none',$9,$10)",
          [
            tpl.business_id,
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

/**
 * Creates the next expense for every recurring template whose next
 * period has arrived. Same model as recurring invoices: generated
 * rows are linked to their template (recurring_from) and never
 * duplicated within the same period.
 */
export async function generateRecurringExpenses(): Promise<void> {
  const db = await getDb();
  const templates = await db.select<Expense[]>(
    `SELECT * FROM expenses WHERE recurrence IN ('weekly','monthly') ${bizFilterAnd()}`
  );
  const today = localToday();
  for (const tpl of templates) {
    let next = addPeriod(tpl.date, tpl.recurrence);
    let guard = 0;
    while (next <= today && guard < 60) {
      guard++;
      const existing = await db.select<{ id: number }[]>(
        "SELECT id FROM expenses WHERE recurring_from = $1 AND date = $2",
        [tpl.id, next]
      );
      if (existing.length === 0) {
        await db.execute(
          "INSERT INTO expenses (business_id, description, amount, category, date, photo, recurrence, recurring_from, pay_method, created_at) VALUES ($1,$2,$3,$4,$5,NULL,'none',$6,$7,$8)",
          [
            tpl.business_id,
            tpl.description,
            tpl.amount,
            tpl.category,
            next,
            tpl.id,
            tpl.pay_method ?? null,
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
  await db.execute(`UPDATE invoices SET status = $1 WHERE id = $2 ${bizFilterAnd()}`, [
    status,
    id,
  ]);
}

export async function deleteInvoice(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM invoices WHERE id = $1 ${bizFilterAnd()}`, [id]);
}

// ---- expenses ----

export async function getExpenses(): Promise<Expense[]> {
  const db = await getDb();
  return db.select<Expense[]>(
    `SELECT * FROM expenses ${bizFilter()} ORDER BY date DESC`
  );
}

/** Returns the new expense's id so callers can attach a receipt photo file. */
export async function addExpense(input: {
  description: string;
  amount: number;
  category: string;
  date: string;
  photo?: string | null;
  recurrence?: Recurrence;
  pay_method?: PayMethod | null;
}): Promise<number> {
  const db = await getDb();
  const res = await db.execute(
    "INSERT INTO expenses (business_id, description, amount, category, date, photo, recurrence, recurring_from, pay_method, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, $9)",
    [
      activeBusinessId,
      input.description,
      input.amount,
      input.category,
      input.date,
      input.photo ?? null,
      input.recurrence ?? "none",
      input.pay_method ?? null,
      new Date().toISOString(),
    ]
  );
  return Number(res.lastInsertId ?? 0);
}

export async function updateExpense(
  id: number,
  input: { description: string; amount: number; category: string; date: string; photo?: string | null; pay_method?: PayMethod | null }
): Promise<void> {
  const db = await getDb();
  if (input.photo === undefined) {
    await db.execute(
      `UPDATE expenses SET description = $1, amount = $2, category = $3, date = $4, pay_method = $5 WHERE id = $6 ${bizFilterAnd()}`,
      [input.description, input.amount, input.category, input.date, input.pay_method ?? null, id]
    );
  } else {
    await db.execute(
      `UPDATE expenses SET description = $1, amount = $2, category = $3, date = $4, photo = $5, pay_method = $6 WHERE id = $7 ${bizFilterAnd()}`,
      [input.description, input.amount, input.category, input.date, input.photo, input.pay_method ?? null, id]
    );
  }
}

export async function setExpensePhoto(id: number, photo: string | null): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE expenses SET photo = $1 WHERE id = $2 ${bizFilterAnd()}`, [photo, id]);
}

export async function deleteExpense(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM expenses WHERE id = $1 ${bizFilterAnd()}`, [id]);
}

// ---- bills (money you owe) ----

export async function getBills(): Promise<Bill[]> {
  const db = await getDb();
  return db.select<Bill[]>(`SELECT * FROM bills ${bizFilter()} ORDER BY due_date ASC`);
}

export async function addBill(input: {
  payee: string;
  amount: number;
  category: string;
  due_date: string;
  pay_method?: PayMethod | null;
}): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO bills (business_id, payee, amount, category, due_date, status, pay_method, created_at) VALUES ($1, $2, $3, $4, $5, 'unpaid', $6, $7)",
    [activeBusinessId, input.payee, input.amount, input.category, input.due_date, input.pay_method ?? null, new Date().toISOString()]
  );
}

export async function updateBill(
  id: number,
  input: { payee: string; amount: number; category: string; due_date: string; pay_method?: PayMethod | null }
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE bills SET payee = $1, amount = $2, category = $3, due_date = $4, pay_method = $5 WHERE id = $6 ${bizFilterAnd()}`,
    [input.payee, input.amount, input.category, input.due_date, input.pay_method ?? null, id]
  );
}

/**
 * Marks a bill paid AND records a matching expense, so the money
 * flows into reports and the cash-flow chart automatically.
 */
export async function payBill(id: number): Promise<void> {
  const db = await getDb();
  const rows = await db.select<Bill[]>(
    `SELECT * FROM bills WHERE id = $1 ${bizFilterAnd()}`,
    [id]
  );
  const bill = rows[0];
  if (!bill || bill.status === "paid") return;
  await db.execute("UPDATE bills SET status = 'paid' WHERE id = $1", [id]);
  await db.execute(
    "INSERT INTO expenses (business_id, description, amount, category, date, photo, created_at) VALUES ($1, $2, $3, $4, $5, NULL, $6)",
    [
      bill.business_id,
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
  await db.execute(`DELETE FROM bills WHERE id = $1 ${bizFilterAnd()}`, [id]);
}

// ---- quotes ----

export async function getQuotes(): Promise<Quote[]> {
  const db = await getDb();
  return db.select<Quote[]>(`SELECT * FROM quotes ${bizFilter()} ORDER BY created_at DESC`);
}

export async function addQuote(input: {
  customer: string;
  amount: number;
  category: string;
  valid_until: string;
}): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO quotes (business_id, number, customer, amount, category, valid_until, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7)",
    [
      activeBusinessId,
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
    `UPDATE quotes SET customer = $1, amount = $2, category = $3, valid_until = $4 WHERE id = $5 ${bizFilterAnd()}`,
    [input.customer, input.amount, input.category, input.valid_until, id]
  );
}

export async function setQuoteStatus(id: number, status: QuoteStatus): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE quotes SET status = $1 WHERE id = $2 ${bizFilterAnd()}`, [status, id]);
}

export async function deleteQuote(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM quotes WHERE id = $1 ${bizFilterAnd()}`, [id]);
}

// ---- contractors + 1099 tracking ----

export async function getContractors(): Promise<Contractor[]> {
  const db = await getDb();
  return db.select<Contractor[]>(`SELECT * FROM contractors ${bizFilter()} ORDER BY name ASC`);
}

export async function addContractor(input: { name: string; note: string }): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO contractors (business_id, name, note, created_at) VALUES ($1, $2, $3, $4)",
    [activeBusinessId, input.name, input.note, new Date().toISOString()]
  );
}

export async function deleteContractor(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM contractor_payments WHERE contractor_id = $1 ${bizFilterAnd()}`, [id]);
  await db.execute(`DELETE FROM contractors WHERE id = $1 ${bizFilterAnd()}`, [id]);
}

export async function getContractorPayments(): Promise<ContractorPayment[]> {
  const db = await getDb();
  return db.select<ContractorPayment[]>(
    `SELECT * FROM contractor_payments ${bizFilter()} ORDER BY date DESC`
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
    "INSERT INTO contractor_payments (business_id, contractor_id, amount, date, note, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
    [activeBusinessId, input.contractor_id, input.amount, input.date, input.note, new Date().toISOString()]
  );
}

export async function deleteContractorPayment(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM contractor_payments WHERE id = $1 ${bizFilterAnd()}`, [id]);
}

// ---- services (price list) ----

export async function getServices(): Promise<Service[]> {
  const db = await getDb();
  return db.select<Service[]>(`SELECT * FROM services ${bizFilter()} ORDER BY name ASC`);
}

export async function addService(input: { name: string; price: number }): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO services (business_id, name, price, created_at) VALUES ($1, $2, $3, $4)",
    [activeBusinessId, input.name, input.price, new Date().toISOString()]
  );
}

export async function updateService(
  id: number,
  input: { name: string; price: number }
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE services SET name = $1, price = $2 WHERE id = $3 ${bizFilterAnd()}`,
    [input.name, input.price, id]
  );
}

export async function deleteService(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM services WHERE id = $1 ${bizFilterAnd()}`, [id]);
}

// ---- time entries ----

export async function getTimeEntries(): Promise<TimeEntry[]> {
  const db = await getDb();
  return db.select<TimeEntry[]>(
    `SELECT * FROM time_entries ${bizFilter()} ORDER BY date DESC, id DESC`
  );
}

export async function addTimeEntry(input: {
  customer: string;
  description: string;
  hours: number;
  date: string;
}): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO time_entries (business_id, customer, description, hours, date, invoiced, created_at) VALUES ($1, $2, $3, $4, $5, 0, $6)",
    [activeBusinessId, input.customer, input.description, input.hours, input.date, new Date().toISOString()]
  );
}

export async function deleteTimeEntry(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM time_entries WHERE id = $1 ${bizFilterAnd()}`, [id]);
}

/** Marks time entries as invoiced after they are converted into an invoice. */
export async function markTimeEntriesInvoiced(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
  await db.execute(
    `UPDATE time_entries SET invoiced = 1 WHERE id IN (${placeholders}) ${bizFilterAnd()}`,
    ids
  );
}

// ---- mileage trips ----

export async function getTrips(): Promise<Trip[]> {
  const db = await getDb();
  return db.select<Trip[]>(`SELECT * FROM trips ${bizFilter()} ORDER BY date DESC, id DESC`);
}

export async function addTrip(input: {
  date: string;
  miles: number;
  purpose: string;
}): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO trips (business_id, date, miles, purpose, created_at) VALUES ($1, $2, $3, $4, $5)",
    [activeBusinessId, input.date, input.miles, input.purpose, new Date().toISOString()]
  );
}

export async function deleteTrip(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM trips WHERE id = $1 ${bizFilterAnd()}`, [id]);
}

// ---- loans (money borrowed) ----

export async function getLoans(): Promise<Loan[]> {
  const db = await getDb();
  return db.select<Loan[]>(`SELECT * FROM loans ${bizFilter()} ORDER BY date_borrowed DESC`);
}

export async function addLoan(input: {
  name: string;
  borrowed_amount: number;
  date_borrowed: string;
  note: string;
}): Promise<number> {
  const db = await getDb();
  const res = await db.execute(
    "INSERT INTO loans (business_id, name, borrowed_amount, date_borrowed, note, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
    [activeBusinessId, input.name, input.borrowed_amount, input.date_borrowed, input.note, new Date().toISOString()]
  );
  return Number(res.lastInsertId ?? 0);
}

export async function deleteLoan(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM loan_payments WHERE loan_id = $1 ${bizFilterAnd()}`, [id]);
  await db.execute(`DELETE FROM loans WHERE id = $1 ${bizFilterAnd()}`, [id]);
}

export async function getLoanPayments(loanId?: number): Promise<LoanPayment[]> {
  const db = await getDb();
  if (loanId == null) {
    return db.select<LoanPayment[]>(
      `SELECT * FROM loan_payments ${bizFilter()} ORDER BY date DESC`
    );
  }
  return db.select<LoanPayment[]>(
    `SELECT * FROM loan_payments WHERE loan_id = $1 ${bizFilterAnd()} ORDER BY date DESC`,
    [loanId]
  );
}

export async function addLoanPayment(input: {
  loan_id: number;
  amount: number;
  date: string;
  note: string;
}): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO loan_payments (business_id, loan_id, amount, date, note, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
    [activeBusinessId, input.loan_id, input.amount, input.date, input.note, new Date().toISOString()]
  );
}

export async function deleteLoanPayment(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM loan_payments WHERE id = $1 ${bizFilterAnd()}`, [id]);
}

// ---- donations (nonprofits) ----

export async function getDonations(): Promise<Donation[]> {
  const db = await getDb();
  return db.select<Donation[]>(
    `SELECT * FROM donations ${bizFilter()} ORDER BY date DESC, id DESC`
  );
}

export async function addDonation(input: {
  donor: string;
  amount: number;
  date: string;
  campaign: string;
}): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO donations (business_id, donor, amount, date, campaign, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
    [activeBusinessId, input.donor, input.amount, input.date, input.campaign, new Date().toISOString()]
  );
}

export async function updateDonation(
  id: number,
  input: { donor: string; amount: number; date: string; campaign: string }
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE donations SET donor = $1, amount = $2, date = $3, campaign = $4 WHERE id = $5 ${bizFilterAnd()}`,
    [input.donor, input.amount, input.date, input.campaign, id]
  );
}

export async function deleteDonation(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM donations WHERE id = $1 ${bizFilterAnd()}`, [id]);
}

// ---- full export (unfiltered) for backups ----

export interface AllData {
  businesses: Business[];
  invoices: Invoice[];
  expenses: Expense[];
  bills: Bill[];
  quotes: Quote[];
  contractors: Contractor[];
  contractorPayments: ContractorPayment[];
  services: Service[];
  timeEntries: TimeEntry[];
  trips: Trip[];
  loans: Loan[];
  loanPayments: LoanPayment[];
  donations: Donation[];
}

export async function exportAllData(): Promise<AllData> {
  const db = await getDb();
  const [businesses, invoices, expenses, bills, quotes, contractors, contractorPayments, services, timeEntries, trips, loans, loanPayments, donations] =
    await Promise.all([
      db.select<Business[]>("SELECT * FROM businesses ORDER BY id ASC"),
      db.select<Invoice[]>("SELECT * FROM invoices ORDER BY id ASC"),
      db.select<Expense[]>("SELECT * FROM expenses ORDER BY id ASC"),
      db.select<Bill[]>("SELECT * FROM bills ORDER BY id ASC"),
      db.select<Quote[]>("SELECT * FROM quotes ORDER BY id ASC"),
      db.select<Contractor[]>("SELECT * FROM contractors ORDER BY id ASC"),
      db.select<ContractorPayment[]>("SELECT * FROM contractor_payments ORDER BY id ASC"),
      db.select<Service[]>("SELECT * FROM services ORDER BY id ASC"),
      db.select<TimeEntry[]>("SELECT * FROM time_entries ORDER BY id ASC"),
      db.select<Trip[]>("SELECT * FROM trips ORDER BY id ASC"),
      db.select<Loan[]>("SELECT * FROM loans ORDER BY id ASC"),
      db.select<LoanPayment[]>("SELECT * FROM loan_payments ORDER BY id ASC"),
      db.select<Donation[]>("SELECT * FROM donations ORDER BY id ASC"),
    ]);
  return { businesses, invoices, expenses, bills, quotes, contractors, contractorPayments, services, timeEntries, trips, loans, loanPayments, donations };
}

// ---- backup / restore ----

export async function clearAllData(): Promise<void> {
  const db = await getDb();
  for (const t of MONEY_TABLES) {
    await db.execute(`DELETE FROM ${t}`);
  }
  await db.execute("DELETE FROM businesses");
}

export async function importBackup(data: BackupData): Promise<void> {
  const db = await getDb();
  for (const t of MONEY_TABLES) {
    await db.execute(`DELETE FROM ${t}`);
  }
  await db.execute("DELETE FROM businesses");

  // Map old ids -> new ids for tables with foreign keys.
  const bizIdMap = new Map<number, number>();

  if (Array.isArray(data.businesses) && data.businesses.length > 0) {
    // v2 backup: explicit ids preserve every link.
    for (const b of data.businesses) {
      await db.execute(
        "INSERT INTO businesses (id, name, type, entity_type, accounting_method, state, ein, fiscal_year_end, mission, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        [
          b.id,
          b.name,
          b.type ?? "freelancer",
          b.entity_type ?? "forprofit",
          b.accounting_method ?? "cash",
          b.state ?? "",
          b.ein ?? "",
          b.fiscal_year_end ?? 12,
          b.mission ?? "",
          b.created_at,
        ]
      );
    }
  } else {
    // v1 backup (pre-multi-business): fold into one business.
    const res = await db.execute(
      "INSERT INTO businesses (name, type, entity_type, accounting_method, state, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        data.businessName || "Business 1",
        data.businessType || "freelancer",
        "forprofit",
        "cash",
        (data as { businessState?: string }).businessState || "",
        new Date().toISOString(),
      ]
    );
    const onlyId = Number(res.lastInsertId ?? 1);
    bizIdMap.set(0, onlyId); // rows without business_id land here
  }

  const mapBiz = (oldId: number | undefined | null): number | null => {
    if (oldId == null) {
      const vals = [...bizIdMap.values()];
      return vals.length > 0 ? vals[0] : null;
    }
    return bizIdMap.get(oldId) ?? oldId;
  };

  for (const inv of data.invoices) {
    await db.execute(
      "INSERT INTO invoices (id, business_id, number, customer, amount, tax_rate, tax_amount, category, due_date, status, recurrence, recurring_from, pay_method, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)",
      [
        inv.id,
        mapBiz(inv.business_id),
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
        inv.pay_method ?? null,
        inv.created_at,
      ]
    );
  }
  for (const exp of data.expenses) {
    await db.execute(
      "INSERT INTO expenses (id, business_id, description, amount, category, date, photo, recurrence, recurring_from, pay_method, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
      [
        exp.id,
        mapBiz(exp.business_id),
        exp.description,
        exp.amount,
        exp.category,
        exp.date,
        exp.photo ?? null,
        exp.recurrence ?? "none",
        exp.recurring_from ?? null,
        exp.pay_method ?? null,
        exp.created_at,
      ]
    );
  }
  if (Array.isArray(data.bills)) {
    for (const b of data.bills) {
      await db.execute(
        "INSERT INTO bills (id, business_id, payee, amount, category, due_date, status, pay_method, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [
          b.id,
          mapBiz(b.business_id),
          b.payee,
          b.amount,
          b.category ?? "other",
          b.due_date,
          b.status,
          b.pay_method ?? null,
          b.created_at,
        ]
      );
    }
  }
  if (Array.isArray(data.quotes)) {
    for (const q of data.quotes) {
      await db.execute(
        "INSERT INTO quotes (id, business_id, number, customer, amount, category, valid_until, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [
          q.id,
          mapBiz(q.business_id),
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
  const contractorIdMap = new Map<number, number>();
  if (Array.isArray(data.contractors)) {
    for (const c of data.contractors) {
      await db.execute(
        "INSERT INTO contractors (id, business_id, name, note, created_at) VALUES ($1, $2, $3, $4, $5)",
        [c.id, mapBiz(c.business_id), c.name, c.note ?? "", c.created_at]
      );
      contractorIdMap.set(c.id, c.id); // explicit ids preserved
    }
  }
  if (Array.isArray(data.contractorPayments)) {
    for (const p of data.contractorPayments) {
      const cid = contractorIdMap.get(p.contractor_id);
      if (cid == null) {
        // v1 fallback: match by contractor name.
        const match = (data.contractors ?? []).find((c) => c.id === p.contractor_id);
        if (!match) continue;
        const rows = await db.select<{ id: number }[]>(
          "SELECT id FROM contractors WHERE name = $1",
          [match.name]
        );
        if (rows.length === 0) continue;
        await db.execute(
          "INSERT INTO contractor_payments (business_id, contractor_id, amount, date, note, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
          [mapBiz(p.business_id), rows[0].id, p.amount, p.date, p.note ?? "", p.created_at]
        );
        continue;
      }
      await db.execute(
        "INSERT INTO contractor_payments (id, business_id, contractor_id, amount, date, note, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [p.id, mapBiz(p.business_id), cid, p.amount, p.date, p.note ?? "", p.created_at]
      );
    }
  }

  if (Array.isArray(data.services)) {
    for (const s of data.services) {
      await db.execute(
        "INSERT INTO services (id, business_id, name, price, created_at) VALUES ($1, $2, $3, $4, $5)",
        [s.id, mapBiz(s.business_id), s.name, s.price, s.created_at]
      );
    }
  }
  if (Array.isArray(data.timeEntries)) {
    for (const te of data.timeEntries) {
      await db.execute(
        "INSERT INTO time_entries (id, business_id, customer, description, hours, date, invoiced, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [te.id, mapBiz(te.business_id), te.customer, te.description ?? "", te.hours, te.date, te.invoiced ?? 0, te.created_at]
      );
    }
  }
  if (Array.isArray(data.trips)) {
    for (const tr of data.trips) {
      await db.execute(
        "INSERT INTO trips (id, business_id, date, miles, purpose, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
        [tr.id, mapBiz(tr.business_id), tr.date, tr.miles, tr.purpose ?? "", tr.created_at]
      );
    }
  }
  const loanIdMap = new Map<number, number>();
  if (Array.isArray(data.loans)) {
    for (const l of data.loans) {
      await db.execute(
        "INSERT INTO loans (id, business_id, name, borrowed_amount, date_borrowed, note, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [l.id, mapBiz(l.business_id), l.name, l.borrowed_amount, l.date_borrowed, l.note ?? "", l.created_at]
      );
      loanIdMap.set(l.id, l.id); // explicit ids preserved
    }
  }
  if (Array.isArray(data.loanPayments)) {
    for (const p of data.loanPayments) {
      const lid = loanIdMap.get(p.loan_id);
      if (lid == null) continue; // orphan payment — skip
      await db.execute(
        "INSERT INTO loan_payments (id, business_id, loan_id, amount, date, note, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [p.id, mapBiz(p.business_id), lid, p.amount, p.date, p.note ?? "", p.created_at]
      );
    }
  }
  if (Array.isArray(data.donations)) {
    for (const d of data.donations) {
      await db.execute(
        "INSERT INTO donations (id, business_id, donor, amount, date, campaign, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [d.id, mapBiz(d.business_id), d.donor, d.amount, d.date, d.campaign ?? "", d.created_at]
      );
    }
  }

  // Keep AUTOINCREMENT counters ahead of restored ids.
  for (const t of [...MONEY_TABLES, "businesses"] as const) {
    await db
      .execute(`UPDATE sqlite_sequence SET seq = (SELECT MAX(id) FROM ${t}) WHERE name = '${t}'`)
      .catch(() => undefined);
  }

  // Per-business number counters continue past restored numbers.
  const businesses = await db.select<Business[]>("SELECT * FROM businesses");
  for (const b of businesses) {
    const maxInv = await db.select<{ m: number | null }[]>(
      "SELECT MAX(CAST(number AS INTEGER)) AS m FROM invoices WHERE business_id = $1",
      [b.id]
    );
    await setSetting(`invoiceSeq:${b.id}`, String(maxInv[0].m ?? 0));
    const maxQ = await db.select<{ m: number | null }[]>(
      "SELECT MAX(CAST(number AS INTEGER)) AS m FROM quotes WHERE business_id = $1",
      [b.id]
    );
    await setSetting(`quoteSeq:${b.id}`, String(maxQ[0].m ?? 0));
  }

  // Backups made before invoice numbers existed carry number = ''.
  const unnumbered = await db.select<{ id: number; business_id: number }[]>(
    "SELECT id, business_id FROM invoices WHERE number = '' ORDER BY id ASC"
  );
  for (const row of unnumbered) {
    const prev = activeBusinessId;
    activeBusinessId = row.business_id;
    const num = await nextInvoiceNumber();
    activeBusinessId = prev;
    await db.execute("UPDATE invoices SET number = $1 WHERE id = $2", [num, row.id]);
  }
  const unnumberedQuotes = await db.select<{ id: number; business_id: number }[]>(
    "SELECT id, business_id FROM quotes WHERE number = '' ORDER BY id ASC"
  );
  for (const row of unnumberedQuotes) {
    const prev = activeBusinessId;
    activeBusinessId = row.business_id;
    const num = await nextQuoteNumber();
    activeBusinessId = prev;
    await db.execute("UPDATE quotes SET number = $1 WHERE id = $2", [num, row.id]);
  }
}
