/**
 * IRS standard mileage rates for the business use of a car.
 * Rates are date-aware: the rate in effect on the trip's date applies.
 * Verified October 2026.
 */
export interface MileageRate {
  /** First day this rate applies (YYYY-MM-DD), inclusive. */
  effectiveFrom: string;
  /** Dollars per mile. */
  rate: number;
  source: string;
}

export const MILEAGE_RATES: MileageRate[] = [
  { effectiveFrom: "2025-01-01", rate: 0.7, source: "IRS Notice 2025-5" },
  { effectiveFrom: "2026-01-01", rate: 0.725, source: "IRS Notice 2026-10" },
  { effectiveFrom: "2026-07-01", rate: 0.76, source: "IRS Announcement 2026-11" },
];

export const MILEAGE_RATE_NOTE =
  "IRS standard mileage rates for business use of a car (IRS Notice 2025-5, IRS Notice 2026-10, IRS Announcement 2026-11). Verify the current rate with a tax preparer.";

/** The per-mile rate in effect on the given YYYY-MM-DD date. */
export function rateForDate(isoDate: string): number {
  let rate = MILEAGE_RATES[0].rate;
  for (const r of MILEAGE_RATES) {
    if (isoDate >= r.effectiveFrom) rate = r.rate;
    else break;
  }
  return rate;
}

/** Deduction in dollars for a trip: miles × the rate in effect that day. */
export function tripDeduction(date: string, miles: number): number {
  return Math.round(miles * rateForDate(date) * 100) / 100;
}
