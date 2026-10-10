# US State Sales Tax — Research for CuentaLibre state-law support

Source: Tax Foundation, "State and Local Sales Tax Rates, Midyear 2026" (July 2026 data).
Table: STATE BASE sales tax rates. City/county/local additions vary widely —
the app must present these as a starting point and tell the user to verify
their local rate. Never present as legal/tax advice.

States with 0% state sales tax: Alaska, Delaware, Montana, New Hampshire, Oregon.
(Alaska allows local sales taxes; the others have none at all.)

| State | Base rate |
|---|---|
| AL | 4.00% |
| AK | 0.00% |
| AZ | 5.60% |
| AR | 6.50% |
| CA | 7.25% |
| CO | 2.90% |
| CT | 6.35% |
| DE | 0.00% |
| FL | 6.00% |
| GA | 4.00% |
| HI | 4.00% |
| ID | 6.00% |
| IL | 6.25% |
| IN | 7.00% |
| IA | 6.00% |
| KS | 6.50% |
| KY | 6.00% |
| LA | 5.00% |
| ME | 5.50% |
| MD | 6.00% |
| MA | 6.25% |
| MI | 6.00% |
| MN | 6.88% |
| MS | 7.00% |
| MO | 4.23% |
| MT | 0.00% |
| NE | 5.50% |
| NV | 6.85% |
| NH | 0.00% |
| NJ | 6.63% |
| NM | 4.88% |
| NY | 4.00% |
| NC | 4.75% |
| ND | 5.00% |
| OH | 5.75% |
| OK | 4.50% |
| OR | 0.00% |
| PA | 6.00% |
| RI | 7.00% |
| SC | 6.00% |
| SD | 4.20% |
| TN | 7.00% |
| TX | 6.25% |
| UT | 6.10% |
| VT | 6.00% |
| VA | 5.30% |
| WA | 6.50% |
| DC | 6.00% |
| WV | 6.00% |
| WI | 5.00% |
| WY | 4.00% |

States with NO individual income tax (2026): AK, FL, NV, SD, TN, TX, WA, WY, NH.

## Feature spec (next build, after the "super functional" batch)

1. `src/data/us-states.ts`: the table above as data, with `effectiveAsOf: "2026-07"`
   and a source note. Include `hasSalesTax` and `hasIncomeTax` flags per state.
2. Onboarding: add a 4th step — "What state is your business in?" (bilingual
   state picker). Store as `businessState` setting. Also editable in Settings.
3. Invoices: optional sales-tax line. Default rate = the business state's base
   rate; editable per invoice (including 0%); stored on the invoice record.
   Tax amount included in totals, printable invoice, and reports.
   Always show the plain-language note: base state rate only — city/county tax
   may add more; verify locally.
4. Home: tax-reminders card — next federal quarterly estimated due dates
   (Jan 15 / Apr 15 / Jun 15 / Sep 15) in plain words, bilingual.
5. Tax summary report: add record-keeping guidance (keep records 7 years —
   covers IRS and most states), bilingual.
6. Disclaimer strings (EN/ES), shown in Settings → About and on the tax report:
   "CuentaLibre is not a tax professional. Tax rates change — verify your
   state and local rates with a tax preparer."
   / "CuentaLibre no es un profesional de impuestos. Las tasas cambian —
   verifica tus tasas estatales y locales con un preparador."

## What this is NOT (be honest in-app)
- Not a real-time tax engine: 13,000+ local jurisdictions exist and rates
  change constantly. The app gives the state base rate as a starting point
  and always lets the user override it.
- Not legal advice: the disclaimer is mandatory, not optional.
