/**
 * US state sales-tax data for CuentaLibre's state-law support.
 *
 * STATE BASE rates only — city/county/local taxes may add more.
 * The app must always present these as a starting point and tell the
 * user to verify their local rate. Never tax advice.
 *
 * Source: Tax Foundation, "State and Local Sales Tax Rates, Midyear 2026"
 * (July 2026 data).
 */

export const TAX_DATA_EFFECTIVE_AS_OF = "2026-07";
export const TAX_DATA_SOURCE =
  "Tax Foundation, State and Local Sales Tax Rates, Midyear 2026 (July 2026 data). State base rates only; city/county taxes may add more.";

export interface UsStateInfo {
  /** Two-letter code, e.g. "IN". */
  code: string;
  /** Display name — same in English and Spanish (standard practice). */
  name: string;
  /** State base sales-tax rate as a decimal fraction, e.g. 0.07 = 7%. */
  salesTax: number;
  /** Whether the state itself levies a sales tax. */
  hasSalesTax: boolean;
  /** Whether the state levies an individual income tax. */
  hasIncomeTax: boolean;
}

export const US_STATES: UsStateInfo[] = [
  { code: "AL", name: "Alabama", salesTax: 0.04, hasSalesTax: true, hasIncomeTax: true },
  { code: "AK", name: "Alaska", salesTax: 0, hasSalesTax: false, hasIncomeTax: false },
  { code: "AZ", name: "Arizona", salesTax: 0.056, hasSalesTax: true, hasIncomeTax: true },
  { code: "AR", name: "Arkansas", salesTax: 0.065, hasSalesTax: true, hasIncomeTax: true },
  { code: "CA", name: "California", salesTax: 0.0725, hasSalesTax: true, hasIncomeTax: true },
  { code: "CO", name: "Colorado", salesTax: 0.029, hasSalesTax: true, hasIncomeTax: true },
  { code: "CT", name: "Connecticut", salesTax: 0.0635, hasSalesTax: true, hasIncomeTax: true },
  { code: "DE", name: "Delaware", salesTax: 0, hasSalesTax: false, hasIncomeTax: true },
  { code: "DC", name: "District of Columbia", salesTax: 0.06, hasSalesTax: true, hasIncomeTax: true },
  { code: "FL", name: "Florida", salesTax: 0.06, hasSalesTax: true, hasIncomeTax: false },
  { code: "GA", name: "Georgia", salesTax: 0.04, hasSalesTax: true, hasIncomeTax: true },
  { code: "HI", name: "Hawaii", salesTax: 0.04, hasSalesTax: true, hasIncomeTax: true },
  { code: "ID", name: "Idaho", salesTax: 0.06, hasSalesTax: true, hasIncomeTax: true },
  { code: "IL", name: "Illinois", salesTax: 0.0625, hasSalesTax: true, hasIncomeTax: true },
  { code: "IN", name: "Indiana", salesTax: 0.07, hasSalesTax: true, hasIncomeTax: true },
  { code: "IA", name: "Iowa", salesTax: 0.06, hasSalesTax: true, hasIncomeTax: true },
  { code: "KS", name: "Kansas", salesTax: 0.065, hasSalesTax: true, hasIncomeTax: true },
  { code: "KY", name: "Kentucky", salesTax: 0.06, hasSalesTax: true, hasIncomeTax: true },
  { code: "LA", name: "Louisiana", salesTax: 0.05, hasSalesTax: true, hasIncomeTax: true },
  { code: "ME", name: "Maine", salesTax: 0.055, hasSalesTax: true, hasIncomeTax: true },
  { code: "MD", name: "Maryland", salesTax: 0.06, hasSalesTax: true, hasIncomeTax: true },
  { code: "MA", name: "Massachusetts", salesTax: 0.0625, hasSalesTax: true, hasIncomeTax: true },
  { code: "MI", name: "Michigan", salesTax: 0.06, hasSalesTax: true, hasIncomeTax: true },
  { code: "MN", name: "Minnesota", salesTax: 0.0688, hasSalesTax: true, hasIncomeTax: true },
  { code: "MS", name: "Mississippi", salesTax: 0.07, hasSalesTax: true, hasIncomeTax: true },
  { code: "MO", name: "Missouri", salesTax: 0.0423, hasSalesTax: true, hasIncomeTax: true },
  { code: "MT", name: "Montana", salesTax: 0, hasSalesTax: false, hasIncomeTax: true },
  { code: "NE", name: "Nebraska", salesTax: 0.055, hasSalesTax: true, hasIncomeTax: true },
  { code: "NV", name: "Nevada", salesTax: 0.0685, hasSalesTax: true, hasIncomeTax: false },
  { code: "NH", name: "New Hampshire", salesTax: 0, hasSalesTax: false, hasIncomeTax: false },
  { code: "NJ", name: "New Jersey", salesTax: 0.0663, hasSalesTax: true, hasIncomeTax: true },
  { code: "NM", name: "New Mexico", salesTax: 0.0488, hasSalesTax: true, hasIncomeTax: true },
  { code: "NY", name: "New York", salesTax: 0.04, hasSalesTax: true, hasIncomeTax: true },
  { code: "NC", name: "North Carolina", salesTax: 0.0475, hasSalesTax: true, hasIncomeTax: true },
  { code: "ND", name: "North Dakota", salesTax: 0.05, hasSalesTax: true, hasIncomeTax: true },
  { code: "OH", name: "Ohio", salesTax: 0.0575, hasSalesTax: true, hasIncomeTax: true },
  { code: "OK", name: "Oklahoma", salesTax: 0.045, hasSalesTax: true, hasIncomeTax: true },
  { code: "OR", name: "Oregon", salesTax: 0, hasSalesTax: false, hasIncomeTax: true },
  { code: "PA", name: "Pennsylvania", salesTax: 0.06, hasSalesTax: true, hasIncomeTax: true },
  { code: "RI", name: "Rhode Island", salesTax: 0.07, hasSalesTax: true, hasIncomeTax: true },
  { code: "SC", name: "South Carolina", salesTax: 0.06, hasSalesTax: true, hasIncomeTax: true },
  { code: "SD", name: "South Dakota", salesTax: 0.042, hasSalesTax: true, hasIncomeTax: false },
  { code: "TN", name: "Tennessee", salesTax: 0.07, hasSalesTax: true, hasIncomeTax: false },
  { code: "TX", name: "Texas", salesTax: 0.0625, hasSalesTax: true, hasIncomeTax: false },
  { code: "UT", name: "Utah", salesTax: 0.061, hasSalesTax: true, hasIncomeTax: true },
  { code: "VT", name: "Vermont", salesTax: 0.06, hasSalesTax: true, hasIncomeTax: true },
  { code: "VA", name: "Virginia", salesTax: 0.053, hasSalesTax: true, hasIncomeTax: true },
  { code: "WA", name: "Washington", salesTax: 0.065, hasSalesTax: true, hasIncomeTax: false },
  { code: "WV", name: "West Virginia", salesTax: 0.06, hasSalesTax: true, hasIncomeTax: true },
  { code: "WI", name: "Wisconsin", salesTax: 0.05, hasSalesTax: true, hasIncomeTax: true },
  { code: "WY", name: "Wyoming", salesTax: 0.04, hasSalesTax: true, hasIncomeTax: false },
];

export function getStateInfo(code: string): UsStateInfo | undefined {
  return US_STATES.find((s) => s.code === code);
}
