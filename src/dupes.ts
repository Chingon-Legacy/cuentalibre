/**
 * Friendly duplicate-detection helpers.
 * Warnings are never blocking: they just help the user notice
 * a record that looks like one they already have.
 */

/** String normalize helper for duplicate matching: trim + lowercase. */
export function normStr(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Whole-day difference between two ISO dates (YYYY-MM-DD).
 * Positive when `b` is after `a` (e.g. daysBetween("2026-10-01", "2026-10-10") = 9).
 * Returns NaN when either date is not parseable.
 */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}
