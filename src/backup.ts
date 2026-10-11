import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { isTauri } from "./external";
import {
  exportAllData,
  getActiveBusinessId,
  getBusinesses,
  importBackup,
  setSetting,
} from "./db";
import type { BackupData } from "./types";

/**
 * "Save work" — exports everything (all businesses) to a dated JSON
 * backup file on the user's own computer (via the native save dialog).
 * Returns true when a file was written, false when cancelled.
 */
export async function saveWork(): Promise<boolean> {
  const all = await exportAllData();
  const businesses = await getBusinesses();
  const activeId = getActiveBusinessId();
  const active = businesses.find((b) => b.id === activeId) ?? businesses[0];
  const data: BackupData = {
    app: "cuentalibre",
    version: 2,
    exportedAt: new Date().toISOString(),
    businesses: all.businesses,
    businessType: active?.type ?? "freelancer",
    businessName: active?.name ?? "",
    businessState: active?.state ?? "",
    invoices: all.invoices,
    expenses: all.expenses,
    bills: all.bills,
    quotes: all.quotes,
    contractors: all.contractors,
    contractorPayments: all.contractorPayments,
    services: all.services,
    timeEntries: all.timeEntries,
    trips: all.trips,
    loans: all.loans,
    loanPayments: all.loanPayments,
    donations: all.donations,
    budgets: all.budgets,
    products: all.products,
    purchaseOrders: all.purchaseOrders,
  };
  const today = new Date().toISOString().slice(0, 10);
  const filename = `cuentalibre-backup-${today}.json`;
  const text = JSON.stringify(data, null, 2);
  try {
    const path = await save({
      defaultPath: filename,
      filters: [{ name: "CuentaLibre backup", extensions: ["json"] }],
    });
    if (!path) return false;
    await writeTextFile(path, text);
  } catch {
    // Not running inside Tauri (or the dialog failed) — download the
    // backup as a file in the browser instead of throwing.
    downloadBlob(filename, text, "application/json;charset=utf-8");
  }
  // Remember when the last successful backup happened (drives the Home nudge).
  await setSetting("lastBackupAt", new Date().toISOString()).catch(() => undefined);
  return true;
}

/** Plain browser download via a temporary anchor element. */
function downloadBlob(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Hidden file picker used when the Tauri native dialog is unavailable. */
function pickBackupFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.style.position = "fixed";
    input.style.opacity = "0";
    input.style.pointerEvents = "none";
    let settled = false;
    const done = (value: string | null) => {
      if (settled) return;
      settled = true;
      if (input.parentNode) document.body.removeChild(input);
      resolve(value);
    };
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return done(null);
      const reader = new FileReader();
      reader.onload = () => done(String(reader.result ?? ""));
      reader.onerror = () => done(null);
      reader.readAsText(f);
    };
    // Closing the picker without choosing fires no event — treat
    // regained focus without a file as cancellation.
    const onFocus = () => {
      window.removeEventListener("focus", onFocus);
      setTimeout(() => {
        if (!input.files?.length) done(null);
      }, 300);
    };
    window.addEventListener("focus", onFocus);
    document.body.appendChild(input);
    input.click();
  });
}

export type OpenBackupResult = "ok" | "cancelled" | "invalid";

/**
 * "Open backup" — restores everything from a backup file
 * (via the native open dialog). Replaces current data.
 */
export async function openBackup(): Promise<OpenBackupResult> {
  let text: string | null = null;
  try {
    const path = await open({
      filters: [{ name: "CuentaLibre backup", extensions: ["json"] }],
      multiple: false,
    });
    if (!path) return "cancelled";
    text = await readTextFile(path as string);
  } catch {
    // Not running inside Tauri — fall back to a hidden file picker.
    text = await pickBackupFile();
    if (text === null) return "cancelled";
  }
  let data: BackupData;
  try {
    data = JSON.parse(text) as BackupData;
  } catch {
    return "invalid";
  }
  if (
    data.app !== "cuentalibre" ||
    !Array.isArray(data.invoices) ||
    !Array.isArray(data.expenses)
  ) {
    return "invalid";
  }
  await importBackup(data);
  return "ok";
}

/**
 * Downloads a plain-text file (e.g. the tax package) to the user's computer.
 * Uses the native save dialog inside Tauri; falls back to a
 * plain browser download otherwise.
 */
export async function downloadText(
  filename: string,
  text: string,
  filterName = "Text"
): Promise<void> {
  const ext = filename.split(".").pop() ?? "txt";
  if (isTauri()) {
    try {
      const path = await save({
        defaultPath: filename,
        filters: [{ name: filterName, extensions: [ext] }],
      });
      if (!path) return; // user cancelled the dialog — respect it
      await writeTextFile(path, text);
      return;
    } catch {
      // Unexpected Tauri failure — fall through to the browser download,
      // which is a harmless no-op inside the desktop app.
    }
  }
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a CSV string to the user's computer.
 * Uses the native save dialog inside Tauri; falls back to a
 * plain browser download otherwise.
 */
export async function downloadCsv(filename: string, csv: string): Promise<void> {
  if (isTauri()) {
    try {
      const path = await save({
        defaultPath: filename,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });
      if (!path) return; // user cancelled the dialog — respect it
      await writeTextFile(path, csv);
      return;
    } catch {
      // Unexpected Tauri failure — fall through to the browser download,
      // which is a harmless no-op inside the desktop app.
    }
  }
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}
