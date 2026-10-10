import { useMemo } from "react";
import { fmtDate, fmtMoney, todayISO, useLang, useStrings } from "../i18n";
import { invoiceTotal } from "../db";
import type { Expense, Invoice, Screen } from "../types";

interface Props {
  invoices: Invoice[];
  expenses: Expense[];
  go: (s: Screen) => void;
}

/** Hand-rolled SVG grouped bar chart: last 6 months, in vs out, with net. */
function CashflowChart({
  invoices,
  expenses,
}: {
  invoices: Invoice[];
  expenses: Expense[];
}) {
  const t = useStrings();
  const lang = useLang();

  const months = useMemo(() => {
    const out: { key: string; label: string; in: number; out: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", {
        month: "short",
      }).format(d);
      out.push({ key, label, in: 0, out: 0 });
    }
    for (const inv of invoices) {
      if (inv.status !== "paid") continue;
      const m = out.find((x) => inv.due_date.startsWith(x.key));
      if (m) m.in += invoiceTotal(inv);
    }
    for (const e of expenses) {
      const m = out.find((x) => e.date.startsWith(x.key));
      if (m) m.out += e.amount;
    }
    return out;
  }, [invoices, expenses, lang]);

  const W = 640;
  const H = 280;
  const padL = 8;
  const padT = 16;
  const labelH = 64;
  const chartH = H - padT - labelH;
  const max = Math.max(1, ...months.map((m) => Math.max(m.in, m.out)));
  const groupW = (W - padL * 2) / months.length;
  const barW = Math.min(34, groupW / 3);
  const y = (v: number) => padT + chartH - (v / max) * chartH;

  return (
    <div>
      <div className="chart-legend">
        <span>
          <i className="swatch in" /> {t.home.moneyIn}
        </span>
        <span>
          <i className="swatch out" /> {t.home.moneyOut}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="cashflow-chart"
        role="img"
        aria-label={t.home.cashflowTitle}
      >
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={padL}
            x2={W - padL}
            y1={padT + chartH * (1 - f)}
            y2={padT + chartH * (1 - f)}
            className="gridline"
          />
        ))}
        {months.map((m, i) => {
          const gx = padL + i * groupW;
          const inH = (m.in / max) * chartH;
          const outH = (m.out / max) * chartH;
          const net = m.in - m.out;
          return (
            <g key={m.key}>
              <rect
                x={gx + groupW / 2 - barW - 3}
                y={y(m.in)}
                width={barW}
                height={Math.max(inH, 2)}
                rx={4}
                className="bar-in"
              >
                <title>{`${m.label}: ${t.home.moneyIn} ${fmtMoney(m.in, lang)}`}</title>
              </rect>
              <rect
                x={gx + groupW / 2 + 3}
                y={y(m.out)}
                width={barW}
                height={Math.max(outH, 2)}
                rx={4}
                className="bar-out"
              >
                <title>{`${m.label}: ${t.home.moneyOut} ${fmtMoney(m.out, lang)}`}</title>
              </rect>
              <text
                x={gx + groupW / 2}
                y={H - 40}
                textAnchor="middle"
                className="chart-month"
              >
                {m.label}
              </text>
              <text
                x={gx + groupW / 2}
                y={H - 18}
                textAnchor="middle"
                className={`chart-net ${net < 0 ? "neg" : "pos"}`}
              >
                {fmtMoney(net, lang)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Next federal quarterly estimated-tax due date (Jan 15 / Apr 15 / Jun 15 / Sep 15). */
function nextQuarterlyDue(): string {
  const y = new Date().getFullYear();
  const today = todayISO();
  const dates = [`${y}-01-15`, `${y}-04-15`, `${y}-06-15`, `${y}-09-15`];
  for (const d of dates) {
    if (d >= today) return d;
  }
  return `${y + 1}-01-15`;
}

export default function Home({ invoices, expenses, go }: Props) {
  const t = useStrings();
  const lang = useLang();
  const today = todayISO();

  const moneyIn = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + invoiceTotal(i), 0);
  const moneyOut = expenses.reduce((s, e) => s + e.amount, 0);
  const left = moneyIn - moneyOut;

  const unpaid = invoices
    .filter((i) => i.status === "waiting")
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  const recent = [...expenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div className="page">
      <h1>{t.nav.home}</h1>
      <p className="subtitle">{t.home.subtitle}</p>

      <div className="stat-grid">
        <div className="stat-card in">
          <div className="stat-label">{t.home.moneyIn}</div>
          <div className="stat-value">{fmtMoney(moneyIn, lang)}</div>
        </div>
        <div className="stat-card out">
          <div className="stat-label">{t.home.moneyOut}</div>
          <div className="stat-value">{fmtMoney(moneyOut, lang)}</div>
        </div>
        <div className="stat-card left">
          <div className="stat-label">{t.home.whatsLeft}</div>
          <div className="stat-value">{fmtMoney(left, lang)}</div>
        </div>
      </div>

      <div className="panel tax-reminder">
        <h2 style={{ marginTop: 0 }}>🧾 {t.home.taxTitle}</h2>
        <p style={{ margin: "4px 0" }}>
          <strong>
            {t.home.taxNext}: {fmtDate(nextQuarterlyDue(), lang)}
          </strong>
        </p>
        <p className="tax-note" style={{ margin: 0 }}>
          {t.home.taxSub}
        </p>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>📈 {t.home.cashflowTitle}</h2>
        <CashflowChart invoices={invoices} expenses={expenses} />
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="toolbar">
            <h2 style={{ margin: 0 }}>🧾 {t.home.whoOwesMe}</h2>
            <button type="button" className="btn small" onClick={() => go("invoices")}>
              {t.home.newInvoice}
            </button>
          </div>
          {unpaid.length === 0 ? (
            <p className="empty-note">{t.home.nothingOwed}</p>
          ) : (
            <ul className="row-list">
              {unpaid.slice(0, 5).map((i) => {
                const late = i.due_date < today;
                return (
                  <li key={i.id}>
                    <div className="row-main">
                      <div className="row-title">{i.customer}</div>
                      <div className="row-sub">
                        {t.home.due} {fmtDate(i.due_date, lang)}
                      </div>
                    </div>
                    <span className={`badge${late ? " late" : " waiting"}`}>
                      {late ? t.invoices.late : t.invoices.waiting}
                    </span>
                    <span className="row-amount positive">
                      {fmtMoney(invoiceTotal(i), lang)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="panel">
          <div className="toolbar">
            <h2 style={{ margin: 0 }}>💸 {t.home.recentExpenses}</h2>
            <button type="button" className="btn small" onClick={() => go("expenses")}>
              {t.home.addExpense}
            </button>
          </div>
          {recent.length === 0 ? (
            <p className="empty-note">{t.home.noExpensesYet}</p>
          ) : (
            <ul className="row-list">
              {recent.map((e) => (
                <li key={e.id}>
                  <div className="row-main">
                    <div className="row-title">{e.description}</div>
                    <div className="row-sub">{fmtDate(e.date, lang)}</div>
                  </div>
                  <span className="row-amount negative">-{fmtMoney(e.amount, lang)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
