import { useMemo, useRef, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { useBiz } from "../App";
import { addExpense } from "../db";
import { isTauri } from "../photos";
import {
  detectAmountColumn,
  detectDateColumn,
  detectDescColumn,
  parseCsv,
  parseCsvAmount,
  parseCsvDate,
} from "../csv";
import { fmtMoney, useLang, useStrings } from "../i18n";
import type { Expense } from "../types";

interface Props {
  expenses: Expense[];
  onDone: () => Promise<void>;
  onClose: () => void;
}

interface ParsedRow {
  date: string;
  description: string;
  amount: number; // signed, as in the file
  valid: boolean;
}

/**
 * Import bank transactions from a CSV file.
 * Steps: pick file → match columns → review & import.
 * Exact duplicates (same date + description + amount) are skipped.
 */
export default function CsvImport({ expenses, onDone, onClose }: Props) {
  const t = useStrings();
  const lang = useLang();
  const { pack } = useBiz();
  const fileInput = useRef<HTMLInputElement>(null);

  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [colDate, setColDate] = useState(-1);
  const [colDesc, setColDesc] = useState(-1);
  const [colAmount, setColAmount] = useState(-1);
  const [spendingNegative, setSpendingNegative] = useState(true);
  const [category, setCategory] = useState(pack.expense[0]?.id ?? "other");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  const existing = useMemo(() => {
    const s = new Set<string>();
    for (const e of expenses) {
      s.add(`${e.date}|${e.description.toLowerCase()}|${Math.round(e.amount * 100)}`);
    }
    return s;
  }, [expenses]);

  const parsed: ParsedRow[] = useMemo(() => {
    if (colDate < 0 || colDesc < 0 || colAmount < 0) return [];
    return dataRows.map((r) => {
      const date = parseCsvDate(r[colDate] ?? "");
      const amount = parseCsvAmount(r[colAmount] ?? "");
      const description = (r[colDesc] ?? "").trim();
      return {
        date: date ?? "",
        description,
        amount: amount ?? 0,
        valid: date !== null && amount !== null && description !== "",
      };
    });
  }, [dataRows, colDate, colDesc, colAmount]);

  const validRows = useMemo(() => parsed.filter((p) => p.valid), [parsed]);

  const loadText = (text: string) => {
    const rows = parseCsv(text);
    if (rows.length < 2) {
      setHeaders([]);
      setDataRows([]);
      return;
    }
    const h = rows[0];
    setHeaders(h);
    setDataRows(rows.slice(1));
    setColDate(detectDateColumn(h));
    setColDesc(detectDescColumn(h));
    setColAmount(detectAmountColumn(h));
    setResult(null);
  };

  const pickFile = async () => {
    if (isTauri()) {
      const picked = await open({
        filters: [{ name: "CSV", extensions: ["csv"] }],
        multiple: false,
      });
      if (!picked) return;
      loadText(await readTextFile(picked as string));
    } else {
      fileInput.current?.click();
    }
  };

  const onBrowserFile = async (f: File | undefined) => {
    if (!f) return;
    loadText(await f.text());
  };

  const doImport = async () => {
    setImporting(true);
    let imported = 0;
    let skipped = 0;
    for (const p of validRows) {
      // Normalize to a positive expense amount based on the bank's sign convention.
      let value: number | null = null;
      if (spendingNegative) {
        value = p.amount < 0 ? Math.abs(p.amount) : null;
      } else {
        value = p.amount > 0 ? p.amount : null;
      }
      if (value === null) {
        skipped++;
        continue;
      }
      const rounded = Math.round(value * 100) / 100;
      const key = `${p.date}|${p.description.toLowerCase()}|${Math.round(rounded * 100)}`;
      if (existing.has(key)) {
        skipped++;
        continue;
      }
      await addExpense({
        description: p.description,
        amount: rounded,
        category,
        date: p.date,
      });
      existing.add(key);
      imported++;
    }
    setImporting(false);
    setResult({ imported, skipped });
    await onDone();
  };

  const ready = colDate >= 0 && colDesc >= 0 && colAmount >= 0;

  return (
    <div className="panel">
      <h2 style={{ marginTop: 0 }}>🏦 {t.csvimport.title}</h2>

      {result ? (
        <>
          <p className="status-note">
            {t.csvimport.done} {result.imported} {t.csvimport.imported},{" "}
            {result.skipped} {t.csvimport.skipped}
          </p>
          <div className="form-actions">
            <button type="button" className="btn" onClick={onClose}>
              OK
            </button>
          </div>
        </>
      ) : headers.length === 0 ? (
        <>
          <p className="subtitle">{t.csvimport.stepFile}</p>
          <div className="form-actions" style={{ justifyContent: "flex-start" }}>
            <button type="button" className="btn" onClick={pickFile}>
              {t.csvimport.chooseFile}
            </button>
            <button type="button" className="btn secondary" onClick={onClose}>
              {t.csvimport.cancel}
            </button>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            onChange={(e) => onBrowserFile(e.target.files?.[0])}
          />
        </>
      ) : (
        <>
          <p className="subtitle">
            {t.csvimport.stepMap} — {dataRows.length} {t.csvimport.rowsFound}
          </p>
          <div className="form-grid">
            <div className="field">
              <label>{t.csvimport.colDate}</label>
              <select
                value={colDate}
                onChange={(e) => setColDate(Number(e.target.value))}
              >
                <option value={-1}>—</option>
                {headers.map((h, i) => (
                  <option key={i} value={i}>
                    {h || `Column ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t.csvimport.colDesc}</label>
              <select
                value={colDesc}
                onChange={(e) => setColDesc(Number(e.target.value))}
              >
                <option value={-1}>—</option>
                {headers.map((h, i) => (
                  <option key={i} value={i}>
                    {h || `Column ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t.csvimport.colAmount}</label>
              <select
                value={colAmount}
                onChange={(e) => setColAmount(Number(e.target.value))}
              >
                <option value={-1}>—</option>
                {headers.map((h, i) => (
                  <option key={i} value={i}>
                    {h || `Column ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={spendingNegative}
                  onChange={(e) => setSpendingNegative(e.target.checked)}
                />
                {t.csvimport.signLabel}
              </label>
              <p className="tax-note">{t.csvimport.dateNote}</p>
            </div>
            <div className="field">
              <label>{t.csvimport.category}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {pack.expense.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === "es" ? c.es : c.en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {ready && validRows.length > 0 && (
            <>
              <h3>{t.csvimport.preview}</h3>
              <ul className="row-list">
                {validRows.slice(0, 8).map((p, i) => (
                  <li key={i}>
                    <div className="row-main">
                      <div className="row-title">{p.description}</div>
                      <div className="row-sub">{p.date}</div>
                    </div>
                    <span className="row-amount negative">
                      -{fmtMoney(Math.abs(p.amount), lang)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {ready && validRows.length === 0 && (
            <p className="empty-note">{t.csvimport.noRows}</p>
          )}

          <div className="form-actions">
            <button type="button" className="btn secondary" onClick={onClose}>
              {t.csvimport.cancel}
            </button>
            <button
              type="button"
              className="btn"
              disabled={!ready || validRows.length === 0 || importing}
              onClick={doImport}
            >
              {importing ? t.settings.working : `${t.csvimport.import} (${validRows.length})`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
