import { useMemo, useState } from "react";
import { useBiz } from "../App";
import { downloadCsv, toCsv } from "../backup";
import { fmtDate, fmtMoney, todayISO, useLang, useStrings } from "../i18n";
import type { Expense, Invoice } from "../types";

type ReportId = "summary" | "income" | "expenses" | "owes" | "tax" | "monthly" | "taxguide";

interface Props {
  invoices: Invoice[];
  expenses: Expense[];
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

export default function Reports({ invoices, expenses }: Props) {
  const t = useStrings();
  const lang = useLang();
  const { pack } = useBiz();
  const [report, setReport] = useState<ReportId>("summary");
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(todayISO());

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

  const moneyIn = paidInRange.reduce((s, i) => s + i.amount, 0);
  const moneyOut = expInRange.reduce((s, e) => s + e.amount, 0);
  const incomeByCat = useMemo(() => groupByCategory(paidInRange), [paidInRange]);
  const expensesByCat = useMemo(() => groupByCategory(expInRange), [expInRange]);

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
        .reduce((s, i) => s + i.amount, 0);
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

  const reportTypes: { id: ReportId; label: string }[] = [
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
        [t.reports.taxProfit, money(moneyIn - moneyOut)],
        [t.reports.taxProfitWhy, ""],
      ];
    } else {
      headers = [t.reports.month, t.reports.moneyIn, t.reports.moneyOut, t.reports.left];
      rows = months.map((m) => [m.label, money(m.in), money(m.out), money(m.in - m.out)]);
    }
    await downloadCsv(name, toCsv(headers, rows));
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
    </div>
  );
}
