/**
 * Hand-rolled CSV parsing (no dependencies):
 * handles quoted fields, commas inside quotes, escaped quotes (""),
 * and CRLF / LF line endings.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    // Skip completely empty rows.
    if (row.length > 0 && !(row.length === 1 && row[0].trim() === "")) {
      rows.push(row);
    }
    row = [];
  };
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += c;
        i++;
      }
    } else if (c === '"') {
      inQuotes = true;
      i++;
    } else if (c === ",") {
      pushField();
      i++;
    } else if (c === "\r") {
      i++;
    } else if (c === "\n") {
      pushField();
      pushRow();
      i++;
    } else {
      field += c;
      i++;
    }
  }
  pushField();
  pushRow();
  return rows;
}

/** Find a column index by matching common header names (case-insensitive). */
export function detectColumn(headers: string[], names: string[]): number {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const n of names) {
    const idx = lower.findIndex((h) => h === n || h.includes(n));
    if (idx >= 0) return idx;
  }
  return -1;
}

const DATE_NAMES = ["date", "fecha", "posting date", "transaction date"];
const DESC_NAMES = ["description", "descripcion", "descripción", "detail", "details", "memo", "concepto", "merchant"];
const AMOUNT_NAMES = ["amount", "cantidad", "monto", "total", "debit", "withdrawal"];

export function detectDateColumn(headers: string[]): number {
  return detectColumn(headers, DATE_NAMES);
}
export function detectDescColumn(headers: string[]): number {
  return detectColumn(headers, DESC_NAMES);
}
export function detectAmountColumn(headers: string[]): number {
  return detectColumn(headers, AMOUNT_NAMES);
}

/**
 * Parse a date cell into YYYY-MM-DD.
 * Accepts ISO (2026-10-10) and US-style MM/DD/YYYY.
 * Returns null when unparseable.
 */
export function parseCsvDate(s: string): string | null {
  const v = s.trim();
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const [, y, mo, d] = m;
    const month = Number(mo);
    const day = Number(d);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, mo, d, y] = m;
    const month = Number(mo);
    const day = Number(d);
    const dt = new Date(Number(y), month - 1, day);
    // Reject rollover: 02/30/2026 becomes Mar 2, which is not what the
    // bank's CSV meant, so require the components to round-trip exactly.
    if (
      Number.isNaN(dt.getTime()) ||
      dt.getMonth() !== month - 1 ||
      dt.getDate() !== day
    )
      return null;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

/** Parse a money cell: strips $, commas, spaces. Returns null when unparseable. */
export function parseCsvAmount(s: string): number | null {
  const cleaned = s.replace(/[$,\s]/g, "").replace(/[()]/g, (c) => (c === "(" ? "-" : ""));
  // Parentheses like (12.50) mean negative.
  const v = parseFloat(cleaned);
  return Number.isNaN(v) ? null : v;
}
