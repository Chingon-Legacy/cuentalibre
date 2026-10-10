export type Lang = "en" | "es";

export type Screen = "home" | "invoices" | "expenses" | "reports" | "settings";

export type InvoiceStatus = "waiting" | "paid";

export interface Invoice {
  id: number;
  customer: string;
  amount: number;
  category: string;
  due_date: string; // YYYY-MM-DD
  status: InvoiceStatus;
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
  invoices: Invoice[];
  expenses: Expense[];
}
