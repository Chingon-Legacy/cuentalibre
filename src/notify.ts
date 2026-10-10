import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import type { Bill, Invoice } from "./types";

export interface ReminderStrings {
  title: string;
  invDueSoonOne: string;
  invDueSoon: string; // contains {n}
  invOverdueOne: string;
  invOverdue: string; // contains {n}
  billDueSoonOne: string;
  billDueSoon: string; // contains {n}
  billOverdueOne: string;
  billOverdue: string; // contains {n}
}

function inTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** YYYY-MM-DD plus N days. */
function plusDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate()
  ).padStart(2, "0")}`;
}

function pick(n: number, one: string, many: string): string {
  return n === 1 ? one : many.replace("{n}", String(n));
}

/**
 * Checks for unpaid invoices and bills that are overdue or due within
 * the next 3 days, and sends at most ONE summary notification per
 * category (invoices, bills). Silently does nothing outside Tauri,
 * without permission, or when there's nothing due.
 */
export async function checkDueReminders(
  invoices: Invoice[],
  bills: Bill[],
  s: ReminderStrings
): Promise<void> {
  try {
    if (!inTauri()) return;
    let granted = false;
    try {
      granted = await isPermissionGranted();
    } catch {
      return;
    }
    if (!granted) {
      try {
        granted = (await requestPermission()) === "granted";
      } catch {
        return;
      }
    }
    if (!granted) return;

    const today = todayISO();
    const horizon = plusDays(today, 3);

    const invSoon = invoices.filter(
      (i) => i.status === "waiting" && i.due_date >= today && i.due_date <= horizon
    );
    const invOver = invoices.filter(
      (i) => i.status === "waiting" && i.due_date < today
    );
    const billSoon = bills.filter(
      (b) => b.status === "unpaid" && b.due_date >= today && b.due_date <= horizon
    );
    const billOver = bills.filter(
      (b) => b.status === "unpaid" && b.due_date < today
    );

    const invLines: string[] = [];
    if (invSoon.length > 0) invLines.push(pick(invSoon.length, s.invDueSoonOne, s.invDueSoon));
    if (invOver.length > 0) invLines.push(pick(invOver.length, s.invOverdueOne, s.invOverdue));
    const billLines: string[] = [];
    if (billSoon.length > 0)
      billLines.push(pick(billSoon.length, s.billDueSoonOne, s.billDueSoon));
    if (billOver.length > 0)
      billLines.push(pick(billOver.length, s.billOverdueOne, s.billOverdue));

    if (invLines.length > 0) {
      sendNotification({ title: s.title, body: invLines.join("\n") });
    }
    if (billLines.length > 0) {
      sendNotification({ title: s.title, body: billLines.join("\n") });
    }
  } catch {
    // Reminders are a courtesy — never let them break the app.
  }
}
