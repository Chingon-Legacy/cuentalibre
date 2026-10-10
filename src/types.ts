export type Lang = "en" | "es";

export type Screen =
  | "home"
  | "invoices"
  | "quotes"
  | "bills"
  | "expenses"
  | "services"
  | "time"
  | "mileage"
  | "reports"
  | "settings"
  | "customers"
  | "contractors";

export type InvoiceStatus = "waiting" | "paid";

export type Recurrence = "none" | "weekly" | "monthly";

/** How money moved: cash, card, bank transfer, or paper check. */
export type PayMethod = "cash" | "card" | "transfer" | "check";

export interface Business {
  id: number;
  name: string;
  type: string; // business-type id, selects the category pack
  state: string; // US state code, e.g. "IN"
  created_at: string;
}

export interface Invoice {
  id: number;
  business_id: number;
  number: string; // sequential, e.g. "0001"
  customer: string;
  amount: number; // subtotal before sales tax
  tax_rate: number; // decimal fraction, e.g. 0.07 = 7%
  tax_amount: number; // computed sales tax in dollars
  category: string;
  due_date: string; // YYYY-MM-DD
  status: InvoiceStatus;
  recurrence: Recurrence;
  recurring_from: number | null; // id of the template invoice this was generated from
  pay_method: PayMethod | null;
  created_at: string;
}

export interface Expense {
  id: number;
  business_id: number;
  description: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  photo: string | null; // stored filename under app-data receipts/ or a data: URL (browser fallback)
  recurrence: Recurrence;
  recurring_from: number | null; // id of the template expense this was generated from
  pay_method: PayMethod | null;
  created_at: string;
}

export type BillStatus = "unpaid" | "paid";

export interface Bill {
  id: number;
  business_id: number;
  payee: string;
  amount: number;
  category: string;
  due_date: string; // YYYY-MM-DD
  status: BillStatus;
  pay_method: PayMethod | null;
  created_at: string;
}

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined";

export interface Quote {
  id: number;
  business_id: number;
  number: string; // sequential, e.g. "0001"
  customer: string;
  amount: number;
  category: string;
  valid_until: string; // YYYY-MM-DD
  status: QuoteStatus;
  created_at: string;
}

export interface Contractor {
  id: number;
  business_id: number;
  name: string;
  note: string;
  created_at: string;
}

export interface ContractorPayment {
  id: number;
  business_id: number;
  contractor_id: number;
  amount: number;
  date: string; // YYYY-MM-DD
  note: string;
  created_at: string;
}

/** A named service with a fixed price — tap to fill an invoice or quote. */
export interface Service {
  id: number;
  business_id: number;
  name: string;
  price: number;
  created_at: string;
}

/** Hours worked, convertible into an invoice. */
export interface TimeEntry {
  id: number;
  business_id: number;
  customer: string;
  description: string;
  hours: number;
  date: string; // YYYY-MM-DD
  invoiced: number; // 0 = not yet invoiced, 1 = invoiced
  created_at: string;
}

/** A business drive, for the IRS mileage deduction. */
export interface Trip {
  id: number;
  business_id: number;
  date: string; // YYYY-MM-DD
  miles: number;
  purpose: string;
  created_at: string;
}

export interface BackupData {
  app: "cuentalibre";
  version: 2;
  exportedAt: string;
  businesses: Business[];
  // Kept for human readability; the businesses array is authoritative.
  businessType: string;
  businessName: string;
  businessState: string;
  invoices: Invoice[];
  expenses: Expense[];
  bills?: Bill[];
  quotes?: Quote[];
  contractors?: Contractor[];
  contractorPayments?: ContractorPayment[];
  services?: Service[];
  timeEntries?: TimeEntry[];
  trips?: Trip[];
}
