export type Lang = "en" | "es";

export type Screen = "home" | "invoices" | "expenses" | "reports" | "settings" | "customers";

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
}
