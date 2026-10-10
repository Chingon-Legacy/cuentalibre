import { useEffect, useMemo, useState } from "react";
import { useBiz } from "../App";
import HintBar from "../components/HintBar";
import { downloadCsv, downloadText, toCsv } from "../backup";
import { invoiceTotal } from "../db";
import { businessTypes } from "../data/categories";
import { US_STATES } from "../data/us-states";
import { tripDeduction } from "../data/mileage-rates";
import { fmtDate, fmtMoney, todayISO, useLang, useStrings } from "../i18n";
import { nfpDeadlineDate } from "./Home";
import type { Bill, Contractor, ContractorPayment, Donation, Expense, Invoice, Loan, LoanPayment, Trip } from "../types";

type ReportId = "summary" | "income" | "expenses" | "owes" | "tax" | "monthly" | "taxguide" | "accountant";

interface Props {
  invoices: Invoice[];
  expenses: Expense[];
  bills: Bill[];
  contractors: Contractor[];
  contractorPayments: ContractorPayment[];
  trips: Trip[];
  donations: Donation[];
  loans: Loan[];
  loanPayments: LoanPayment[];
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
      <HintBar id="nineNinety" text={t.hints.nineNinety} />

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
          <div className="table-scroll">
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
          </div>

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
          <div className="table-scroll">
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
          </div>
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

export default function Reports({ invoices, expenses, bills, contractors, contractorPayments, trips, donations, loans, loanPayments }: Props) {
  const t = useStrings();
  const lang = useLang();
  const { pack, active, bizName, isNonprofit, accountingMethod } = useBiz();
  const isAccrual = accountingMethod === "accrual";
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

  // Cash: income counts when the customer pays. Accrual: income counts when
  // the invoice is sent (paid or waiting).
  const incomeInRange = useMemo(
    () => invoices.filter((i) => (isAccrual || i.status === "paid") && inRange(i.due_date)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [invoices, from, to, isAccrual]
  );
  const expInRange = useMemo(
    () => expenses.filter((e) => inRange(e.date)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expenses, from, to]
  );
  // Accrual: an unpaid bill counts as an expense once the bill exists.
  // (Paying a bill creates the matching expense, so each bill counts once.)
  const unpaidBillsInRange = useMemo(
    () => bills.filter((b) => b.status === "unpaid" && inRange(b.due_date)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bills, from, to]
  );
  // "Who owes me" is a snapshot of what's currently owed — not date-range
  // filtered, since it's about outstanding balances, not a time period.
  const waitingNow = useMemo(
    () =>
      invoices
        .filter((i) => i.status === "waiting")
        .sort((a, b) => a.due_date.localeCompare(b.due_date)),
    [invoices]
  );

  const catLabel = (id: string) => {
    const c = [...pack.income, ...pack.expense].find((x) => x.id === id);
    return c ? (lang === "es" ? c.es : c.en) : t.expenses.other;
  };

  // Donations are money received — they count as money-in for nonprofits
  // under both accounting methods.
  const donationsInRange = useMemo(
    () => (isNonprofit ? donations.filter((d) => inRange(d.date)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [donations, from, to, isNonprofit]
  );
  const donationInTotal = donationsInRange.reduce((s, d) => s + d.amount, 0);

  const moneyIn = incomeInRange.reduce((s, i) => s + invoiceTotal(i), 0) + donationInTotal;
  const moneyOut =
    expInRange.reduce((s, e) => s + e.amount, 0) +
    (isAccrual ? unpaidBillsInRange.reduce((s, b) => s + b.amount, 0) : 0);
  const taxCollected = incomeInRange.reduce((s, i) => s + i.tax_amount, 0);
  const incomeByCat = useMemo(() => groupByCategory(incomeInRange), [incomeInRange]);
  const expensesByCat = useMemo(() => groupByCategory(expInRange), [expInRange]);

  /* Accountant export: every transaction in one flat list, oldest first. */
  interface AcctRow { date: string; type: string; who: string; category: string; amount: number }
  const accountantRows: AcctRow[] = useMemo(() => {
    const rows: AcctRow[] = [];
    for (const i of invoices) {
      if (!inRange(i.due_date)) continue;
      rows.push({
        date: i.due_date,
        type: `${t.reports.acctInvoice} #${i.number} (${i.status === "paid" ? t.reports.paid : t.reports.waiting})`,
        who: i.customer,
        category: catLabel(i.category),
        amount: invoiceTotal(i),
      });
    }
    for (const e of expenses) {
      if (!inRange(e.date)) continue;
      rows.push({ date: e.date, type: t.reports.acctExpense, who: e.description, category: catLabel(e.category), amount: e.amount });
    }
    for (const b of bills) {
      if (!inRange(b.due_date)) continue;
      rows.push({ date: b.due_date, type: `${t.reports.acctBill} (${b.status === "paid" ? t.reports.paid : t.reports.waiting})`, who: b.payee, category: catLabel(b.category), amount: b.amount });
    }
    if (isNonprofit) {
      for (const d of donations) {
        if (!inRange(d.date)) continue;
        rows.push({ date: d.date, type: t.reports.acctDonation, who: d.donor, category: d.campaign || "—", amount: d.amount });
      }
    }
    const contractorName = (id: number) => contractors.find((c) => c.id === id)?.name ?? "";
    for (const p of contractorPayments) {
      if (!inRange(p.date)) continue;
      rows.push({ date: p.date, type: t.reports.acctContractor, who: contractorName(p.contractor_id), category: p.note || "—", amount: p.amount });
    }
    const loanName = (id: number) => loans.find((l) => l.id === id)?.name ?? "";
    for (const p of loanPayments) {
      if (!inRange(p.date)) continue;
      rows.push({ date: p.date, type: t.reports.acctLoan, who: loanName(p.loan_id), category: p.note || "—", amount: p.amount });
    }
    rows.sort((a, b) => a.date.localeCompare(b.date));
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, expenses, bills, donations, contractorPayments, loanPayments, contractors, loans, from, to, isNonprofit, lang]);

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
    () => byPayMethod(incomeInRange.map((i) => ({ pay_method: i.pay_method, amount: invoiceTotal(i) }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [incomeInRange, t]
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
      const inAmt =
        invoices
          .filter(
            (i) => (isAccrual || i.status === "paid") && i.due_date.startsWith(key) && inRange(i.due_date)
          )
          .reduce((s, i) => s + invoiceTotal(i), 0) +
        (isNonprofit
          ? donations
              .filter((d) => d.date.startsWith(key) && inRange(d.date))
              .reduce((s, d) => s + d.amount, 0)
          : 0);
      const outAmt =
        expenses
          .filter((e) => e.date.startsWith(key) && inRange(e.date))
          .reduce((s, e) => s + e.amount, 0) +
        (isAccrual
          ? bills
              .filter((b) => b.status === "unpaid" && b.due_date.startsWith(key) && inRange(b.due_date))
              .reduce((s, b) => s + b.amount, 0)
          : 0);
      out.push({ key, label, in: inAmt, out: outAmt });
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, invoices, expenses, bills, donations, lang, isAccrual, isNonprofit]);

  // Nonprofits get the 990 helper instead of the for-profit tax reports.
  const reportTypes: { id: ReportId; label: string }[] = isNonprofit
    ? [
        { id: "summary", label: t.reports.tSummary },
        { id: "income", label: t.reports.tIncomeByCat },
        { id: "expenses", label: t.reports.tExpensesByCat },
        { id: "owes", label: t.reports.tWhoOwes },
        { id: "monthly", label: t.reports.tMonthly },
        { id: "accountant", label: t.reports.tAccountant },
      ]
    : [
        { id: "summary", label: t.reports.tSummary },
        { id: "income", label: t.reports.tIncomeByCat },
        { id: "expenses", label: t.reports.tExpensesByCat },
        { id: "owes", label: t.reports.tWhoOwes },
        { id: "tax", label: t.reports.tTax },
        { id: "taxguide", label: t.reports.tTaxGuide },
        { id: "monthly", label: t.reports.tMonthly },
        { id: "accountant", label: t.reports.tAccountant },
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
      rows = waitingNow.map((i) => [i.customer, money(invoiceTotal(i)), i.due_date, t.reports.waiting]);
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
    } else if (report === "accountant") {
      headers = [t.reports.acctDate, t.reports.acctType, t.reports.acctWho, t.reports.acctCategory, t.reports.acctAmount];
      rows = accountantRows.map((r) => [r.date, r.type, r.who, r.category, money(r.amount)]);
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
    L.push(`${tp.methodL}: ${isAccrual ? tp.methodAccrual : tp.methodCash}`);
    L.push("");

    // Cash: income counts when the customer pays. Accrual: when billed.
    // Accrual expenses include unpaid bills (each bill counts once — paying
    // it creates the matching expense instead).
    const incomeInYear = invoices.filter(
      (i) => (isAccrual || i.status === "paid") && i.due_date.startsWith(y)
    );
    const expInYear = expenses.filter((e) => e.date.startsWith(y));
    const unpaidBillsInYear = isAccrual
      ? bills.filter((b) => b.status === "unpaid" && b.due_date.startsWith(y))
      : [];
    const income = incomeInYear.reduce((s, i) => s + invoiceTotal(i), 0);
    const out =
      expInYear.reduce((s, e) => s + e.amount, 0) +
      unpaidBillsInYear.reduce((s, b) => s + b.amount, 0);
    const taxCollected = incomeInYear.reduce((s, i) => s + i.tax_amount, 0);

    L.push(`## ${tp.profitSummary}`);
    L.push("");
    L.push(`- ${isAccrual ? tp.incomeAccrual : tp.income}: ${fmtMoney(income, lang)}`);
    L.push(`- ${tp.expensesW}: ${fmtMoney(out, lang)}`);
    L.push(`- ${tp.net}: ${fmtMoney(income - out, lang)}`);
    L.push("");

    L.push(`## ${tp.expensesByCat}`);
    L.push("");
    const expByCat = groupByCategory([
      ...expInYear,
      ...unpaidBillsInYear.map((b) => ({ category: b.category, amount: b.amount })),
    ]);
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
    L.push(isAccrual ? tp.unpaidNoteAccrual : tp.unpaidNote);
    L.push("");
    const unpaidEnd = invoices
      .filter((i) => i.status === "waiting" && i.due_date <= `${y}-12-31`)
      .sort((a, b) => a.due_date.localeCompare(b.due_date));
    if (unpaidEnd.length === 0) {
      L.push(tp.noUnpaid);
    } else {
      for (const i of unpaidEnd) {
        L.push(
          `- #${i.number || "—"} · ${i.customer}: ${fmtMoney(invoiceTotal(i), lang)} (${t.reports.dueDate}: ${fmtDate(i.due_date, lang)})`
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
      ? incomeInRange.length > 0 || expInRange.length > 0 || donationInTotal > 0
      : report === "income"
        ? incomeByCat.length > 0
        : report === "expenses"
          ? expensesByCat.length > 0
          : report === "owes"
            ? waitingNow.length > 0
            : report === "tax"
              ? incomeInRange.length > 0 || expInRange.length > 0
              : report === "taxguide"
                ? incomeInRange.length > 0 || expInRange.length > 0
                : report === "accountant"
                  ? accountantRows.length > 0
                  : months.some((m) => m.in > 0 || m.out > 0);

  return (
    <div className="page">
      <h1>📊 {t.reports.title}</h1>
      <p className="subtitle">{t.reports.subtitle}</p>
      <HintBar id="reports" text={t.hints.reports} />

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
          {/* "Who owes me" is a current snapshot — no date range applies. */}
          {report !== "owes" && (
          <div className="field">
            <label>{t.reports.from}</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          )}
          {report !== "owes" && (
          <div className="field">
            <label>{t.reports.to}</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          )}
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
            <div className="table-scroll">
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
            </div>
            {(inByMethod.length > 1 || outByMethod.length > 1) && (
              <>
                <h3 style={{ marginTop: 24 }}>💳 {t.paymethod.breakdown}</h3>
                <div className="table-scroll">
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
                </div>
              </>
            )}
          </>
        ) : report === "income" || report === "expenses" ? (
          <div className="table-scroll">
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
          </div>
        ) : report === "owes" ? (
          <div className="table-scroll">
          <table className="report">
            <thead>
              <tr>
                <th>{t.reports.customer}</th>
                <th className="num">{t.reports.amount}</th>
                <th>{t.reports.dueDate}</th>
              </tr>
            </thead>
            <tbody>
              {waitingNow.map((i) => (
                <tr key={i.id}>
                  <td>{i.customer}</td>
                  <td className="num">{fmtMoney(invoiceTotal(i), lang)}</td>
                  <td>{fmtDate(i.due_date, lang)}</td>
                </tr>
              ))}
              <tr className="total">
                <td>{t.reports.amount}</td>
                <td className="num">
                  {fmtMoney(waitingNow.reduce((s, i) => s + invoiceTotal(i), 0), lang)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
          </div>
        ) : report === "tax" ? (
          <>
            <p className="subtitle">💡 {t.reports.taxNote}</p>
            <div className="table-scroll">
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
            </div>
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
                <div className="table-scroll">
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
                </div>
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
        ) : report === "accountant" ? (
          <>
            <p className="subtitle">📎 {t.reports.acctDesc}</p>
            <div className="table-scroll">
            <table className="report responsive-table">
              <thead>
                <tr>
                  <th>{t.reports.acctDate}</th>
                  <th>{t.reports.acctType}</th>
                  <th>{t.reports.acctWho}</th>
                  <th>{t.reports.acctCategory}</th>
                  <th className="num">{t.reports.acctAmount}</th>
                </tr>
              </thead>
              <tbody>
                {accountantRows.map((r, idx) => (
                  <tr key={idx}>
                    <td data-label={t.reports.acctDate}>{fmtDate(r.date, lang)}</td>
                    <td data-label={t.reports.acctType}>{r.type}</td>
                    <td data-label={t.reports.acctWho}>{r.who}</td>
                    <td data-label={t.reports.acctCategory}>{r.category}</td>
                    <td className="num" data-label={t.reports.acctAmount}>{fmtMoney(r.amount, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        ) : (
          <div className="table-scroll">
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
          </div>
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
