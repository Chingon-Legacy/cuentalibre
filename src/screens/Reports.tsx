import { useEffect, useMemo, useState } from "react";
import { useBiz } from "../App";
import { downloadCsv, downloadText, toCsv } from "../backup";
import { invoiceTotal } from "../db";
import { businessTypes } from "../data/categories";
import { US_STATES } from "../data/us-states";
import { tripDeduction } from "../data/mileage-rates";
import { fmtDate, fmtMoney, todayISO, useLang, useStrings } from "../i18n";
import { nfpDeadlineDate } from "./Home";
import type { Contractor, ContractorPayment, Donation, Expense, Invoice, Trip } from "../types";

type ReportId = "summary" | "income" | "expenses" | "owes" | "tax" | "monthly" | "taxguide";

interface Props {
  invoices: Invoice[];
  expenses: Expense[];
  contractors: Contractor[];
  contractorPayments: ContractorPayment[];
  trips: Trip[];
  donations: Donation[];
}

function firstOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function groupByCategory(items: { category: string; amount: number }[]): [string, number][] {
  const m = new Map<string, number>();
  for (const it of items) m.set(it.category, (m.get(it.category) ?? 0) + it.amount);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

const money = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

/* ------------------------------------------------------------------ */
/* Nonprofit annual IRS report helper (Form 990 series).               */
/*                                                                     */
/* The app PREPARES everything but CANNOT file — only the IRS website  */
/* accepts 990 filings. That is stated plainly in the UI, in both      */
/* languages. Thresholds follow the verified IRS rules:                */
/*   990-N:  gross receipts normally ≤ $50,000 (online-only, 8 items)   */
/*   990-EZ: receipts < $200,000 AND assets < $500,000                  */
/*   990:    receipts ≥ $200,000 OR assets ≥ $500,000                   */
/* Missing 3 consecutive years → automatic revocation of tax-exempt    */
/* status. Private foundations always file 990-PF (noted, not prepared).*/
/* ------------------------------------------------------------------ */

/** Which Form 990 applies, using the IRS gross-receipts thresholds. */
function formFor(receipts: number): "N" | "EZ" | "full" {
  if (receipts <= 50000) return "N";
  if (receipts < 200000) return "EZ";
  return "full";
}

/** Fiscal-year window for a tax year: starts the month after fiscal_year_end
 *  of the prior period, ends on fiscal_year_end of the tax year.
 *  E.g. December year-end + tax year 2026 → 2026-01-01 … 2026-12-31;
 *  June year-end + tax year 2026 → 2025-07-01 … 2026-06-30. */
function fiscalWindow(taxYear: number, fyEnd: number): [string, string] {
  const startMonth = (fyEnd % 12) + 1;
  const startYear = taxYear - (fyEnd === 12 ? 0 : 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  const lastDay = new Date(taxYear, fyEnd, 0).getDate();
  return [
    `${startYear}-${pad(startMonth)}-01`,
    `${taxYear}-${pad(fyEnd)}-${pad(lastDay)}`,
  ];
}

/** Map a nonprofit expense category to a 990 functional-expense bucket.
 *  A starting point only — the preparer confirms the split. */
function funcOf(catId: string): "program" | "fundraising" | "admin" {
  if (catId === "program-expenses" || catId === "grants-scholarships") return "program";
  if (catId === "fundraising-expenses") return "fundraising";
  return "admin";
}

function NfpAnnualReport({
  invoices,
  expenses,
  donations,
  catLabel,
}: {
  invoices: Invoice[];
  expenses: Expense[];
  donations: Donation[];
  catLabel: (id: string) => string;
}) {
  const t = useStrings();
  const lang = useLang();
  const { active, bizName } = useBiz();
  const fyEnd =
    active && active.fiscal_year_end >= 1 && active.fiscal_year_end <= 12
      ? active.fiscal_year_end
      : 12;

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const d of donations) set.add(Number(d.date.slice(0, 4)));
    for (const i of invoices) set.add(Number(i.due_date.slice(0, 4)));
    for (const e of expenses) set.add(Number(e.date.slice(0, 4)));
    set.add(new Date().getFullYear());
    return [...set].filter((y) => Number.isFinite(y) && y > 2000).sort((a, b) => b - a);
  }, [donations, invoices, expenses]);

  const [taxYear, setTaxYear] = useState<number>(() => new Date().getFullYear());

  const [winStart, winEnd] = useMemo(() => fiscalWindow(taxYear, fyEnd), [taxYear, fyEnd]);
  const inWindow = (d: string) => d >= winStart && d <= winEnd;

  const donInWindow = useMemo(
    () => donations.filter((d) => inWindow(d.date)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [donations, winStart, winEnd]
  );
  const paidInWindow = useMemo(
    () => invoices.filter((i) => i.status === "paid" && inWindow(i.due_date)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [invoices, winStart, winEnd]
  );
  const expInWindow = useMemo(
    () => expenses.filter((e) => inWindow(e.date)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expenses, winStart, winEnd]
  );

  const donationTotal = donInWindow.reduce((s, d) => s + d.amount, 0);
  const invoiceRevenue = paidInWindow.reduce((s, i) => s + invoiceTotal(i), 0);
  const grossReceipts = donationTotal + invoiceRevenue;

  const invoiceByCat = useMemo(() => groupByCategory(paidInWindow), [paidInWindow]);
  const expByCat = useMemo(() => groupByCategory(expInWindow), [expInWindow]);

  const funcTotals = useMemo(() => {
    const f = { program: 0, fundraising: 0, admin: 0 };
    for (const [c, a] of expByCat) f[funcOf(c)] += a;
    return f;
  }, [expByCat]);
  const expTotal = funcTotals.program + funcTotals.fundraising + funcTotals.admin;
  const netChange = grossReceipts - expTotal;

  const form = formFor(grossReceipts);
  const deadline = nfpDeadlineDate(fyEnd, taxYear);

  const checklist: { label: string; value: string | null }[] = [
    { label: t.nfp.cEin, value: active?.ein?.trim() ? active.ein : null },
    { label: t.nfp.cTaxYear, value: String(taxYear) },
    { label: t.nfp.cLegalName, value: bizName || null },
    { label: t.nfp.cAddress, value: null },
    { label: t.nfp.cWebsite, value: null },
    { label: t.nfp.cReceipts, value: `✓ ${fmtMoney(grossReceipts, lang)}` },
    { label: t.nfp.cNotTerminated, value: "✓" },
    { label: t.nfp.cOfficer, value: null },
  ];

  const downloadSummary = async () => {
    const headers = [t.reports.category, t.reports.amount];
    const rows: (string | number)[][] = [
      [t.nfp.grossReceipts, money(grossReceipts)],
      [`  ${t.donations.title}`, money(donationTotal)],
      ...invoiceByCat.map(([c, a]): (string | number)[] => [`  ${catLabel(c)}`, money(a)]),
      [t.nfp.expTotal, money(expTotal)],
      [`  ${t.nfp.expProgram}`, money(funcTotals.program)],
      [`  ${t.nfp.expFundraising}`, money(funcTotals.fundraising)],
      [`  ${t.nfp.expAdmin}`, money(funcTotals.admin)],
      [t.nfp.netAssets, money(netChange)],
    ];
    await downloadCsv(`cuentalibre-990-summary-${taxYear}.csv`, toCsv(headers, rows));
  };

  return (
    <div className="panel">
      <h2 style={{ marginTop: 0 }}>🏛️ {t.nfp.title}</h2>
      <p className="subtitle">{t.nfp.desc}</p>

      <div className="report-controls">
        <div className="field">
          <label>{t.nfp.taxYear}</label>
          <select value={taxYear} onChange={(e) => setTaxYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* (a) gross receipts for the selected tax year */}
      <div className="tax-block">
        <div className="tax-line">
          <span className="tax-name">💰 {t.nfp.grossReceipts}</span>
          <span className="tax-amount">{fmtMoney(grossReceipts, lang)}</span>
        </div>
        <p className="tax-why">{t.nfp.grossReceiptsWhy}</p>
        {grossReceipts === 0 && <p className="empty-note">{t.nfp.noData}</p>}
      </div>

      {/* (b) which form applies */}
      <div className="tax-block">
        <div className="tax-line">
          <span className="tax-name">
            📋 {form === "N" ? t.nfp.formN : form === "EZ" ? t.nfp.formEZ : t.nfp.formFull}
          </span>
        </div>
        <p className="tax-why">
          {(form === "N" ? t.nfp.formNWhy : form === "EZ" ? t.nfp.formEZWhy : t.nfp.formFullWhy).replace(
            "{money}",
            fmtMoney(grossReceipts, lang)
          )}
        </p>
      </div>

      {/* (c) deadline from fiscal year end */}
      <div className="tax-block">
        <div className="tax-line">
          <span className="tax-name">⏰ {t.nfp.deadlineTitle}</span>
          <span className="tax-amount">{fmtDate(deadline, lang)}</span>
        </div>
        <p className="tax-why">
          {t.nfp.deadlineLine
            .replace("{year}", String(taxYear))
            .replace("{date}", fmtDate(deadline, lang))}
        </p>
      </div>

      {/* (d) 3-year revocation warning */}
      <div className="tax-block">
        <div className="tax-line">
          <span className="tax-name">⚠️ {t.nfp.revocationTitle}</span>
        </div>
        <p className="tax-why">{t.nfp.revocationText}</p>
      </div>

      {/* (e) 990-N checklist + how to file */}
      {form === "N" && (
        <>
          <h3 style={{ marginTop: 24 }}>{t.nfp.checklistTitle}</h3>
          <p className="subtitle">{t.nfp.checklistSub}</p>
          <table className="report">
            <tbody>
              {checklist.map((c) => (
                <tr key={c.label}>
                  <td>{c.label}</td>
                  <td className="num">
                    {c.value ? (
                      <span>{c.value}</span>
                    ) : (
                      <span className="badge waiting">{t.nfp.toFill}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ marginTop: 24 }}>{t.nfp.howTitle}</h3>
          <p className="subtitle">{t.nfp.howSub}</p>
          <ol className="tour-list">
            <li>{t.nfp.how1}</li>
            <li>{t.nfp.how2}</li>
            <li>{t.nfp.how3}</li>
            <li>{t.nfp.how4}</li>
          </ol>
        </>
      )}

      {/* (f) 990-EZ / full: preparer financial summary */}
      {form !== "N" && (
        <>
          <h3 style={{ marginTop: 24 }}>{t.nfp.finTitle}</h3>
          <p className="subtitle">{t.nfp.finSub}</p>
          {active?.mission && (
            <p className="tax-why">
              <strong>{t.nonprofit.mission}:</strong> {active.mission}
            </p>
          )}
          <table className="report">
            <thead>
              <tr>
                <th>{t.reports.category}</th>
                <th className="num">{t.reports.amount}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="total">
                <td>{t.nfp.grossReceipts}</td>
                <td className="num">{fmtMoney(grossReceipts, lang)}</td>
              </tr>
              <tr>
                <td style={{ paddingLeft: 24 }}>{t.donations.title}</td>
                <td className="num">{fmtMoney(donationTotal, lang)}</td>
              </tr>
              {invoiceByCat.map(([c, a]) => (
                <tr key={c}>
                  <td style={{ paddingLeft: 24 }}>{catLabel(c)}</td>
                  <td className="num">{fmtMoney(a, lang)}</td>
                </tr>
              ))}
              <tr className="total">
                <td>{t.nfp.expTotal}</td>
                <td className="num">{fmtMoney(expTotal, lang)}</td>
              </tr>
              <tr>
                <td style={{ paddingLeft: 24 }}>{t.nfp.expProgram}</td>
                <td className="num">{fmtMoney(funcTotals.program, lang)}</td>
              </tr>
              <tr>
                <td style={{ paddingLeft: 24 }}>{t.nfp.expFundraising}</td>
                <td className="num">{fmtMoney(funcTotals.fundraising, lang)}</td>
              </tr>
              <tr>
                <td style={{ paddingLeft: 24 }}>{t.nfp.expAdmin}</td>
                <td className="num">{fmtMoney(funcTotals.admin, lang)}</td>
              </tr>
              <tr className="total">
                <td>{t.nfp.netAssets}</td>
                <td className="num">{fmtMoney(netChange, lang)}</td>
              </tr>
            </tbody>
          </table>
          <div className="field" style={{ marginTop: 12 }}>
            <button type="button" className="btn secondary" onClick={downloadSummary}>
              ⬇ {t.nfp.download}
            </button>
          </div>
        </>
      )}

      {/* private foundation note */}
      <div className="tax-block" style={{ marginTop: 24 }}>
        <p className="tax-why">ℹ️ {t.nfp.pfNote}</p>
      </div>

      {/* plain statement: the app cannot file */}
      <p className="tax-why" style={{ marginTop: 16 }}>
        <strong>🚫 {t.nfp.cannotFile}</strong>
      </p>
      <p className="disclaimer">{t.nfp.disclaimer}</p>
    </div>
  );
}

export default function Reports({ invoices, expenses, contractors, contractorPayments, trips, donations }: Props) {
  const t = useStrings();
  const lang = useLang();
  const { pack, active, bizName, isNonprofit } = useBiz();
  const [report, setReport] = useState<ReportId>("summary");
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(todayISO());

  // Switching to a nonprofit hides the for-profit tax reports —
  // drop back to the summary so nobody lands on a hidden view.
  useEffect(() => {
    if (isNonprofit && (report === "tax" || report === "taxguide")) {
      setReport("summary");
    }
  }, [isNonprofit, report]);

  const inRange = (d: string) => d >= from && d <= to;

  const paidInRange = useMemo(
    () => invoices.filter((i) => i.status === "paid" && inRange(i.due_date)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [invoices, from, to]
  );
  const expInRange = useMemo(
    () => expenses.filter((e) => inRange(e.date)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expenses, from, to]
  );
  const waitingInRange = useMemo(
    () =>
      invoices
        .filter((i) => i.status === "waiting" && inRange(i.due_date))
        .sort((a, b) => a.due_date.localeCompare(b.due_date)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [invoices, from, to]
  );

  const catLabel = (id: string) => {
    const c = [...pack.income, ...pack.expense].find((x) => x.id === id);
    return c ? (lang === "es" ? c.es : c.en) : t.expenses.other;
  };

  const moneyIn = paidInRange.reduce((s, i) => s + invoiceTotal(i), 0);
  const moneyOut = expInRange.reduce((s, e) => s + e.amount, 0);
  const taxCollected = paidInRange.reduce((s, i) => s + i.tax_amount, 0);
  const incomeByCat = useMemo(() => groupByCategory(paidInRange), [paidInRange]);
  const expensesByCat = useMemo(() => groupByCategory(expInRange), [expInRange]);

  const payMethodLabel = (m: string | null): string => {
    if (m === "cash") return t.paymethod.cash;
    if (m === "card") return t.paymethod.card;
    if (m === "transfer") return t.paymethod.transfer;
    if (m === "check") return t.paymethod.check;
    return t.paymethod.notSet;
  };

  /** [method, total] pairs sorted by total, for paid invoices or expenses in range. */
  const byPayMethod = (
    items: { pay_method: string | null; amount: number }[]
  ): [string, number][] => {
    const m = new Map<string, number>();
    for (const it of items) {
      const k = it.pay_method ?? "";
      m.set(k, (m.get(k) ?? 0) + it.amount);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };

  const inByMethod = useMemo(
    () => byPayMethod(paidInRange.map((i) => ({ pay_method: i.pay_method, amount: invoiceTotal(i) }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paidInRange, t]
  );
  const outByMethod = useMemo(
    () => byPayMethod(expInRange.map((e) => ({ pay_method: e.pay_method, amount: e.amount }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expInRange, t]
  );

  const months = useMemo(() => {
    const out: { key: string; label: string; in: number; out: number }[] = [];
    const [fy, fm] = from.split("-").map(Number);
    const [ty, tm] = to.split("-").map(Number);
    let y = fy;
    let m = fm;
    let guard = 0;
    while ((y < ty || (y === ty && m <= tm)) && guard < 120) {
      guard++;
      const key = `${y}-${String(m).padStart(2, "0")}`;
      const label = new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", {
        month: "long",
        year: "numeric",
      }).format(new Date(y, m - 1, 1));
      const inAmt = invoices
        .filter(
          (i) => i.status === "paid" && i.due_date.startsWith(key) && inRange(i.due_date)
        )
        .reduce((s, i) => s + invoiceTotal(i), 0);
      const outAmt = expenses
        .filter((e) => e.date.startsWith(key) && inRange(e.date))
        .reduce((s, e) => s + e.amount, 0);
      out.push({ key, label, in: inAmt, out: outAmt });
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, invoices, expenses, lang]);

  // Nonprofits get the 990 helper instead of the for-profit tax reports.
  const reportTypes: { id: ReportId; label: string }[] = isNonprofit
    ? [
        { id: "summary", label: t.reports.tSummary },
        { id: "income", label: t.reports.tIncomeByCat },
        { id: "expenses", label: t.reports.tExpensesByCat },
        { id: "owes", label: t.reports.tWhoOwes },
        { id: "monthly", label: t.reports.tMonthly },
      ]
    : [
        { id: "summary", label: t.reports.tSummary },
        { id: "income", label: t.reports.tIncomeByCat },
        { id: "expenses", label: t.reports.tExpensesByCat },
        { id: "owes", label: t.reports.tWhoOwes },
        { id: "tax", label: t.reports.tTax },
        { id: "taxguide", label: t.reports.tTaxGuide },
        { id: "monthly", label: t.reports.tMonthly },
      ];

  const pickReport = (id: ReportId) => {
    setReport(id);
    // The tax guide is most useful year-to-date.
    if (id === "taxguide") setFrom(`${new Date().getFullYear()}-01-01`);
  };

  const download = async () => {
    const name = `cuentalibre-${report}-${from}-to-${to}.csv`;
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    if (report === "summary") {
      headers = [t.reports.category, t.reports.amount];
      rows = [
        [t.reports.moneyIn, money(moneyIn)],
        [t.reports.moneyOut, money(moneyOut)],
        [t.reports.left, money(moneyIn - moneyOut)],
      ];
      if (inByMethod.length > 1 || outByMethod.length > 1) {
        rows.push([t.paymethod.breakdown, ""]);
        for (const [m, a] of inByMethod) {
          rows.push([`${t.reports.moneyIn} · ${payMethodLabel(m || null)}`, money(a)]);
        }
        for (const [m, a] of outByMethod) {
          rows.push([`${t.reports.moneyOut} · ${payMethodLabel(m || null)}`, money(a)]);
        }
      }
    } else if (report === "income") {
      headers = [t.reports.category, t.reports.amount];
      rows = incomeByCat.map(([c, a]) => [catLabel(c), money(a)]);
    } else if (report === "expenses") {
      headers = [t.reports.category, t.reports.amount];
      rows = expensesByCat.map(([c, a]) => [catLabel(c), money(a)]);
    } else if (report === "owes") {
      headers = [t.reports.customer, t.reports.amount, t.reports.dueDate, t.reports.status];
      rows = waitingInRange.map((i) => [i.customer, money(i.amount), i.due_date, t.reports.waiting]);
    } else if (report === "tax") {
      headers = [t.reports.category, t.reports.amount];
      rows = [
        [t.reports.moneyIn, money(moneyIn)],
        ...incomeByCat.map(([c, a]): (string | number)[] => [catLabel(c), money(a)]),
        [t.reports.moneyOut, money(moneyOut)],
        ...expensesByCat.map(([c, a]): (string | number)[] => [catLabel(c), money(a)]),
        [t.reports.taxCollected, money(taxCollected)],
        [t.reports.left, money(moneyIn - moneyOut)],
      ];
    } else if (report === "taxguide") {
      headers = [t.reports.category, t.reports.amount];
      rows = [
        [t.reports.taxIncome, money(moneyIn)],
        [t.reports.taxIncomeWhy, ""],
        [t.reports.taxExpenses, money(moneyOut)],
        ...expensesByCat.map(([c, a]): (string | number)[] => [catLabel(c), money(a)]),
        [t.reports.taxExpensesWhy, ""],
        [t.reports.taxCollected, money(taxCollected)],
        [t.reports.taxProfit, money(moneyIn - moneyOut)],
        [t.reports.taxProfitWhy, ""],
        [t.reports.keepRecordsTitle, ""],
        [t.reports.keepRecordsWhy, ""],
        [t.reports.disclaimer, ""],
      ];
    } else {
      headers = [t.reports.month, t.reports.moneyIn, t.reports.moneyOut, t.reports.left];
      rows = months.map((m) => [m.label, money(m.in), money(m.out), money(m.in - m.out)]);
    }
    await downloadCsv(name, toCsv(headers, rows));
  };

  /* ---------- one-tap tax package ---------- */

  const taxYears = useMemo(() => {
    const years = new Set<number>();
    for (const i of invoices) years.add(Number(i.due_date.slice(0, 4)));
    for (const e of expenses) years.add(Number(e.date.slice(0, 4)));
    for (const p of contractorPayments) years.add(Number(p.date.slice(0, 4)));
    years.add(new Date().getFullYear());
    return [...years].filter((y) => Number.isFinite(y) && y > 2000).sort((a, b) => b - a);
  }, [invoices, expenses, contractorPayments]);

  const [taxYear, setTaxYear] = useState<number>(() => new Date().getFullYear());
  const [pkgWorking, setPkgWorking] = useState(false);

  /** Builds the tax-package Markdown file in the current UI language. */
  const buildTaxPackage = (year: number): string => {
    const tp = t.taxpackage;
    const y = String(year);
    const L: string[] = [];

    const bt = businessTypes.find((b) => b.id === (active?.type ?? ""));
    const typeLabel = bt ? (lang === "es" ? bt.es : bt.en) : "";
    const stateName =
      US_STATES.find((s) => s.code === (active?.state ?? ""))?.name ?? active?.state ?? "";

    L.push(`# ${tp.docTitle.replace("{year}", y)} — ${bizName || "CuentaLibre"}`);
    L.push("");
    L.push(`${tp.business}: ${bizName || "CuentaLibre"}`);
    if (typeLabel) L.push(`${tp.typeL}: ${typeLabel}`);
    if (stateName) L.push(`${tp.stateL}: ${stateName}`);
    L.push("");

    const paidInYear = invoices.filter((i) => i.status === "paid" && i.due_date.startsWith(y));
    const expInYear = expenses.filter((e) => e.date.startsWith(y));
    const income = paidInYear.reduce((s, i) => s + invoiceTotal(i), 0);
    const out = expInYear.reduce((s, e) => s + e.amount, 0);
    const taxCollected = paidInYear.reduce((s, i) => s + i.tax_amount, 0);

    L.push(`## ${tp.profitSummary}`);
    L.push("");
    L.push(`- ${tp.income}: ${fmtMoney(income, lang)}`);
    L.push(`- ${tp.expensesW}: ${fmtMoney(out, lang)}`);
    L.push(`- ${tp.net}: ${fmtMoney(income - out, lang)}`);
    L.push("");

    L.push(`## ${tp.expensesByCat}`);
    L.push("");
    const expByCat = groupByCategory(expInYear);
    for (const [c, a] of expByCat) {
      L.push(`- ${catLabel(c)}: ${fmtMoney(a, lang)}`);
    }
    L.push(`- **${tp.total}: ${fmtMoney(out, lang)}**`);
    L.push("");

    L.push(`## ${tp.salesTaxCollected}`);
    L.push("");
    L.push(fmtMoney(taxCollected, lang));
    L.push("");

    L.push(`## ${tp.contractorTitle.replace("{year}", y)}`);
    L.push("");
    const payInYear = contractorPayments.filter((p) => p.date.startsWith(y));
    const totals = new Map<number, number>();
    for (const p of payInYear) {
      totals.set(p.contractor_id, (totals.get(p.contractor_id) ?? 0) + p.amount);
    }
    const rows = contractors
      .map((c) => ({ name: c.name, total: totals.get(c.id) ?? 0 }))
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);
    if (rows.length === 0) {
      L.push(tp.noContractors);
    } else {
      for (const r of rows) {
        const flag = r.total >= 600 ? ` ${tp.needs1099}` : "";
        L.push(`- ${r.name}: ${fmtMoney(r.total, lang)}${flag}`);
      }
    }
    L.push("");

    L.push(`## ${tp.mileageTitle.replace("{year}", y)}`);
    L.push("");
    L.push(tp.mileageSub);
    L.push("");
    const tripsInYear = trips.filter((tr) => tr.date.startsWith(y));
    if (tripsInYear.length === 0) {
      L.push(tp.noTrips);
    } else {
      const totalMiles = tripsInYear.reduce((s, tr) => s + tr.miles, 0);
      const totalDed = tripsInYear.reduce((s, tr) => s + tripDeduction(tr.date, tr.miles), 0);
      const roundedMiles = Math.round(totalMiles * 10) / 10;
      L.push(`- ${roundedMiles} ${tp.milesLabel}: ${fmtMoney(totalDed, lang)}`);
    }
    L.push("");

    L.push(`## ${tp.unpaidTitle.replace("{year}", y)}`);
    L.push("");
    L.push(tp.unpaidNote);
    L.push("");
    const unpaidEnd = invoices
      .filter((i) => i.status === "waiting" && i.due_date <= `${y}-12-31`)
      .sort((a, b) => a.due_date.localeCompare(b.due_date));
    if (unpaidEnd.length === 0) {
      L.push(tp.noUnpaid);
    } else {
      for (const i of unpaidEnd) {
        L.push(
          `- #${i.number || "—"} · ${i.customer}: ${fmtMoney(invoiceTotal(i), lang)} (${t.reports.dueDate}: ${i.due_date})`
        );
      }
    }
    L.push("");
    L.push("---");
    L.push("");
    L.push(`_${t.reports.disclaimer}_`);
    L.push("");
    L.push(`_${t.reports.keepRecordsWhy}_`);
    L.push("");
    L.push(`_${tp.preparedNote}_`);

    return L.join("\n");
  };

  const downloadPackage = async () => {
    setPkgWorking(true);
    try {
      await downloadText(
        `cuentalibre-tax-package-${taxYear}.md`,
        buildTaxPackage(taxYear),
        "Markdown"
      );
    } finally {
      setPkgWorking(false);
    }
  };

  const hasData =
    report === "summary"
      ? paidInRange.length > 0 || expInRange.length > 0
      : report === "income"
        ? incomeByCat.length > 0
        : report === "expenses"
          ? expensesByCat.length > 0
          : report === "owes"
            ? waitingInRange.length > 0
            : report === "tax"
              ? paidInRange.length > 0 || expInRange.length > 0
              : report === "taxguide"
                ? paidInRange.length > 0 || expInRange.length > 0
                : months.some((m) => m.in > 0 || m.out > 0);

  return (
    <div className="page">
      <h1>📊 {t.reports.title}</h1>
      <p className="subtitle">{t.reports.type}</p>

      {isNonprofit && (
        <NfpAnnualReport
          invoices={invoices}
          expenses={expenses}
          donations={donations}
          catLabel={catLabel}
        />
      )}

      <div className="panel">
        <div className="report-controls">
          <div className="field">
            <label>{t.reports.type}</label>
            <select value={report} onChange={(e) => pickReport(e.target.value as ReportId)}>
              {reportTypes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t.reports.from}</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field">
            <label>{t.reports.to}</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="field">
            <button type="button" className="btn secondary" onClick={download}>
              ⬇ {t.reports.download}
            </button>
          </div>
        </div>

        {!hasData ? (
          <p className="empty-note">{t.reports.noData}</p>
        ) : report === "summary" ? (
          <>
            <table className="report">
              <thead>
                <tr>
                  <th>{t.reports.category}</th>
                  <th className="num">{t.reports.amount}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{t.reports.moneyIn}</td>
                  <td className="num">{fmtMoney(moneyIn, lang)}</td>
                </tr>
                <tr>
                  <td>{t.reports.moneyOut}</td>
                  <td className="num">{fmtMoney(moneyOut, lang)}</td>
                </tr>
                <tr className="total">
                  <td>{t.reports.left}</td>
                  <td className="num">{fmtMoney(moneyIn - moneyOut, lang)}</td>
                </tr>
              </tbody>
            </table>
            {(inByMethod.length > 1 || outByMethod.length > 1) && (
              <>
                <h3 style={{ marginTop: 24 }}>💳 {t.paymethod.breakdown}</h3>
                <table className="report">
                  <tbody>
                    {inByMethod.map(([m, a]) => (
                      <tr key={`in-${m}`}>
                        <td style={{ paddingLeft: 24 }}>
                          {t.reports.moneyIn} · {payMethodLabel(m || null)}
                        </td>
                        <td className="num">{fmtMoney(a, lang)}</td>
                      </tr>
                    ))}
                    {outByMethod.map(([m, a]) => (
                      <tr key={`out-${m}`}>
                        <td style={{ paddingLeft: 24 }}>
                          {t.reports.moneyOut} · {payMethodLabel(m || null)}
                        </td>
                        <td className="num">{fmtMoney(a, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        ) : report === "income" || report === "expenses" ? (
          <table className="report">
            <thead>
              <tr>
                <th>{t.reports.category}</th>
                <th className="num">{t.reports.amount}</th>
              </tr>
            </thead>
            <tbody>
              {(report === "income" ? incomeByCat : expensesByCat).map(([c, a]) => (
                <tr key={c}>
                  <td>{catLabel(c)}</td>
                  <td className="num">{fmtMoney(a, lang)}</td>
                </tr>
              ))}
              <tr className="total">
                <td>{t.reports.amount}</td>
                <td className="num">
                  {fmtMoney(
                    (report === "income" ? incomeByCat : expensesByCat).reduce(
                      (s, [, a]) => s + a,
                      0
                    ),
                    lang
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        ) : report === "owes" ? (
          <table className="report">
            <thead>
              <tr>
                <th>{t.reports.customer}</th>
                <th className="num">{t.reports.amount}</th>
                <th>{t.reports.dueDate}</th>
              </tr>
            </thead>
            <tbody>
              {waitingInRange.map((i) => (
                <tr key={i.id}>
                  <td>{i.customer}</td>
                  <td className="num">{fmtMoney(i.amount, lang)}</td>
                  <td>{fmtDate(i.due_date, lang)}</td>
                </tr>
              ))}
              <tr className="total">
                <td>{t.reports.amount}</td>
                <td className="num">
                  {fmtMoney(waitingInRange.reduce((s, i) => s + i.amount, 0), lang)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        ) : report === "tax" ? (
          <>
            <p className="subtitle">💡 {t.reports.taxNote}</p>
            <table className="report">
              <thead>
                <tr>
                  <th>{t.reports.category}</th>
                  <th className="num">{t.reports.amount}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="total">
                  <td>{t.reports.moneyIn}</td>
                  <td className="num">{fmtMoney(moneyIn, lang)}</td>
                </tr>
                {incomeByCat.map(([c, a]) => (
                  <tr key={`i-${c}`}>
                    <td style={{ paddingLeft: 24 }}>{catLabel(c)}</td>
                    <td className="num">{fmtMoney(a, lang)}</td>
                  </tr>
                ))}
                <tr className="total">
                  <td>{t.reports.moneyOut}</td>
                  <td className="num">{fmtMoney(moneyOut, lang)}</td>
                </tr>
                {expensesByCat.map(([c, a]) => (
                  <tr key={`e-${c}`}>
                    <td style={{ paddingLeft: 24 }}>{catLabel(c)}</td>
                    <td className="num">{fmtMoney(a, lang)}</td>
                  </tr>
                ))}
                <tr>
                  <td>{t.reports.taxCollected}</td>
                  <td className="num">{fmtMoney(taxCollected, lang)}</td>
                </tr>
                <tr className="total">
                  <td>{t.reports.left}</td>
                  <td className="num">{fmtMoney(moneyIn - moneyOut, lang)}</td>
                </tr>
              </tbody>
            </table>
          </>
        ) : report === "taxguide" ? (
          <>
            <p className="subtitle">💡 {t.reports.taxNote}</p>
            <div className="tax-block">
              <div className="tax-line">
                <span className="tax-name">💰 {t.reports.taxIncome}</span>
                <span className="tax-amount">{fmtMoney(moneyIn, lang)}</span>
              </div>
              <p className="tax-why">{t.reports.taxIncomeWhy}</p>
            </div>
            <div className="tax-block">
              <div className="tax-line">
                <span className="tax-name">🧾 {t.reports.taxExpenses}</span>
                <span className="tax-amount">{fmtMoney(moneyOut, lang)}</span>
              </div>
              <p className="tax-why">{t.reports.taxExpensesWhy}</p>
              {expensesByCat.length > 0 && (
                <table className="report">
                  <thead>
                    <tr>
                      <th>{t.reports.category}</th>
                      <th className="num">{t.reports.amount}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expensesByCat.map(([c, a]) => (
                      <tr key={c}>
                        <td>{catLabel(c)}</td>
                        <td className="num">{fmtMoney(a, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="tax-block">
              <div className="tax-line">
                <span className="tax-name">✅ {t.reports.taxProfit}</span>
                <span className="tax-amount">{fmtMoney(moneyIn - moneyOut, lang)}</span>
              </div>
              <p className="tax-why">{t.reports.taxProfitWhy}</p>
            </div>
            <div className="tax-block">
              <div className="tax-line">
                <span className="tax-name">🗂️ {t.reports.keepRecordsTitle}</span>
              </div>
              <p className="tax-why">{t.reports.keepRecordsWhy}</p>
            </div>
            <p className="disclaimer">{t.reports.disclaimer}</p>
          </>
        ) : (
          <table className="report">
            <thead>
              <tr>
                <th>{t.reports.month}</th>
                <th className="num">{t.reports.moneyIn}</th>
                <th className="num">{t.reports.moneyOut}</th>
                <th className="num">{t.reports.left}</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.key}>
                  <td style={{ textTransform: "capitalize" }}>{m.label}</td>
                  <td className="num">{fmtMoney(m.in, lang)}</td>
                  <td className="num">{fmtMoney(m.out, lang)}</td>
                  <td className="num">{fmtMoney(m.in - m.out, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* The one-tap for-profit tax package doesn't apply to nonprofits —
          they get the 990 helper above instead. */}
      {!isNonprofit && (
        <div className="panel tax-package">
          <h2 style={{ marginTop: 0 }}>📦 {t.taxpackage.title}</h2>
          <p className="subtitle">{t.taxpackage.desc}</p>
          <div className="report-controls" style={{ marginBottom: 0 }}>
            <div className="field">
              <label>{t.taxpackage.year}</label>
              <select value={taxYear} onChange={(e) => setTaxYear(Number(e.target.value))}>
                {taxYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <button type="button" className="btn" disabled={pkgWorking} onClick={downloadPackage}>
                {t.taxpackage.btn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
