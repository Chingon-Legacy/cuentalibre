import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { getExpenses, getInvoices, getSetting, importBackup } from "./db";
import type { BackupData } from "./types";

/**
 * "Save work" — exports everything to a dated JSON backup file
 * on the user's own computer (via the native save dialog).
 * Returns true when a file was written, false when cancelled.
 */
export async function saveWork(): Promise<boolean> {
  const data: BackupData = {
    app: "cuentalibre",
    version: 1,
    exportedAt: new Date().toISOString(),
    businessType: (await getSetting("businessType")) ?? "freelancer",
    businessName: (await getSetting("businessName")) ?? "",
    invoices: await getInvoices(),
    expenses: await getExpenses(),
  };
  const today = new Date().toISOString().slice(0, 10);
  const path = await save({
    defaultPath: `cuentalibre-backup-${today}.json`,
    filters: [{ name: "CuentaLibre backup", extensions: ["json"] }],
  });
  if (!path) return false;
  await writeTextFile(path, JSON.stringify(data, null, 2));
  return true;
}

export type OpenBackupResult = "ok" | "cancelled" | "invalid";

/**
 * "Open backup" — restores everything from a backup file
 * (via the native open dialog). Replaces current data.
 */
export async function openBackup(): Promise<OpenBackupResult> {
  const path = await open({
    filters: [{ name: "CuentaLibre backup", extensions: ["json"] }],
    multiple: false,
  });
  if (!path) return "cancelled";
  const text = await readTextFile(path as string);
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
 * Downloads a CSV string to the user's computer.
 * Uses the native save dialog inside Tauri; falls back to a
 * plain browser download otherwise.
 */
export async function downloadCsv(filename: string, csv: string): Promise<void> {
  try {
    const path = await save({
      defaultPath: filename,
      filters: [{ name: "CSV", extensions: ["csv"] }],
    });
    if (path) {
      await writeTextFile(path, csv);
      return;
    }
  } catch {
    // Not running inside Tauri — fall through to browser download.
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
