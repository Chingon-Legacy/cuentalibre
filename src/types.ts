export type Lang = "en" | "es";

export type Screen =
  | "home"
  | "invoices"
  | "quotes"
  | "bills"
  | "expenses"
  | "reports"
  | "settings"
  | "customers"
  | "contractors";

export type InvoiceStatus = "waiting" | "paid";

export type Recurrence = "none" | "weekly" | "monthly";

export interface Invoice {
  id: number;
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
  created_at: string;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  photo: string | null; // stored filename under app-data receipts/ or a data: URL (browser fallback)
  created_at: string;
}

export type BillStatus = "unpaid" | "paid";

export interface Bill {
  id: number;
  payee: string;
  amount: number;
  category: string;
  due_date: string; // YYYY-MM-DD
  status: BillStatus;
  created_at: string;
}

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined";

export interface Quote {
  id: number;
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
  name: string;
  note: string;
  created_at: string;
}

export interface ContractorPayment {
  id: number;
  contractor_id: number;
  amount: number;
  date: string; // YYYY-MM-DD
  note: string;
  created_at: string;
}

export interface BackupData {
  app: "cuentalibre";
  version: 1;
  exportedAt: string;
  businessType: string;
  businessName: string;
  businessState: string;
  invoices: Invoice[];
  expenses: Expense[];
  bills?: Bill[];
  quotes?: Quote[];
  contractors?: Contractor[];
  contractorPayments?: ContractorPayment[];
}
