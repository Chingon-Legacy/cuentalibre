import { useEffect, useMemo, useState } from "react";
import { fmtDate, fmtMoney, todayISO, useLang, useStrings } from "../i18n";
import { useBiz } from "../App";
import { saveWork } from "../backup";
import { getSetting, invoiceTotal } from "../db";
import type { Bill, Expense, Invoice, Screen } from "../types";

interface Props {
  invoices: Invoice[];
  expenses: Expense[];
  bills: Bill[];
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

function monthKey(offset: number): string {
  const d = new Date();
  const t = new Date(d.getFullYear(), d.getMonth() - offset, 1);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
}

function plusDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Plain-words insights computed from this business's invoices,
 * expenses, and bills. Shows at most 3 warm one-liners; the whole
 * panel hides when there's nothing worth saying.
 */
function Insights({
  invoices,
  expenses,
  bills,
}: {
  invoices: Invoice[];
  expenses: Expense[];
  bills: Bill[];
}) {
  const t = useStrings();
  const lang = useLang();
  const { pack } = useBiz();

  const catLabel = (id: string) => {
    const c = [...pack.income, ...pack.expense].find((x) => x.id === id);
    return c ? (lang === "es" ? c.es : c.en) : t.expenses.other;
  };

  const notes = useMemo(() => {
    const out: string[] = [];
    const today = todayISO();

    // (a) late unpaid invoices
    const late = invoices.filter((i) => i.status === "waiting" && i.due_date < today);
    if (late.length > 0) {
      const total = late.reduce((s, i) => s + invoiceTotal(i), 0);
      out.push(
        t.insights.late
          .replace("{n}", String(late.length))
          .replace("{money}", fmtMoney(total, lang))
      );
    }

    // (b) unpaid bills due in the next 7 days
    const soon = bills.filter(
      (b) => b.status === "unpaid" && b.due_date >= today && b.due_date <= plusDays(today, 7)
    );
    if (soon.length > 0) {
      const total = soon.reduce((s, b) => s + b.amount, 0);
      out.push(t.insights.billsSoon.replace("{money}", fmtMoney(total, lang)));
    }

    // (c) top expense category this month vs last month (only if ≥120% of last)
    const thisM = new Map<string, number>();
    const lastM = new Map<string, number>();
    const tk = monthKey(0);
    const lk = monthKey(1);
    for (const e of expenses) {
      if (e.date.startsWith(tk)) thisM.set(e.category, (thisM.get(e.category) ?? 0) + e.amount);
      else if (e.date.startsWith(lk)) lastM.set(e.category, (lastM.get(e.category) ?? 0) + e.amount);
    }
    let topCat = "";
    let topAmt = 0;
    for (const [c, a] of thisM) {
      if (a > topAmt) {
        topAmt = a;
        topCat = c;
      }
    }
    let spikeShown = false;
    if (topCat) {
      const lastAmt = lastM.get(topCat) ?? 0;
      if (lastAmt > 0 && topAmt >= lastAmt * 1.2) {
        const pct = Math.round(((topAmt - lastAmt) / lastAmt) * 100);
        out.push(
          t.insights.catUp
            .replace("{category}", catLabel(topCat))
            .replace("{pct}", String(pct))
        );
        spikeShown = true;
      }
    }

    // (d) biggest expense category this month (skipped when (c) already covers it)
    if (!spikeShown && topCat) {
      out.push(
        t.insights.topCat
          .replace("{category}", catLabel(topCat))
          .replace("{money}", fmtMoney(topAmt, lang))
      );
    }

    return out.slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, expenses, bills, t, lang, pack]);

  if (notes.length === 0) return null;

  return (
    <div className="panel">
      <h2 style={{ marginTop: 0 }}>{t.insights.title}</h2>
      <ul className="insight-list">
        {notes.map((n, i) => (
          <li key={i}>{n}</li>
        ))}
      </ul>
    </div>
  );
}

/** Friendly monthly income goal: progress bar fed by this month's paid invoices. */
function GoalCard({ invoices }: { invoices: Invoice[] }) {
  const t = useStrings();
  const lang = useLang();
  const { activeId } = useBiz();
  const [goal, setGoal] = useState<number | null>(null);

  useEffect(() => {
    if (activeId == null) {
      setGoal(null);
      return;
    }
    getSetting(`incomeGoal:${activeId}`)
      .then((v) => {
        const n = v ? parseFloat(v) : NaN;
        setGoal(v && !Number.isNaN(n) && n > 0 ? Math.round(n * 100) / 100 : null);
      })
      .catch(() => setGoal(null));
  }, [activeId]);

  if (goal == null) return null;

  const mk = monthKey(0);
  const done = invoices
    .filter((i) => i.status === "paid" && i.due_date.startsWith(mk))
    .reduce((s, i) => s + invoiceTotal(i), 0);
  const pct = Math.min(100, Math.round((done / goal) * 100));
  const monthName = new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", {
    month: "long",
  }).format(new Date());
  const reached = done >= goal;

  return (
    <div className="panel">
      <h2 style={{ marginTop: 0 }}>
        🎯 {t.goal.cardTitle.replace("{month}", monthName)}
      </h2>
      <p style={{ margin: "4px 0 8px" }}>
        {t.goal.of
          .replace("{done}", fmtMoney(done, lang))
          .replace("{goal}", fmtMoney(goal, lang))}
      </p>
      <div className="goal-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="goal-fill" style={{ width: `${pct}%` }} />
      </div>
      {reached ? (
        <p style={{ margin: "8px 0 0" }}>
          <strong>{t.goal.reached}</strong>
        </p>
      ) : (
        <p className="row-sub" style={{ margin: "8px 0 0" }}>
          {t.goal.remaining.replace("{money}", fmtMoney(goal - done, lang))}
        </p>
      )}
    </div>
  );
}

/** Gentle reminder to save a backup when the last one is 14+ days old. */
function BackupNudge() {
  const t = useStrings();
  const [dismissed, setDismissed] = useState(false);
  const [stale, setStale] = useState(false);

  const check = () => {
    getSetting("lastBackupAt")
      .then((v) => {
        const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
        setStale(!v || v < cutoff);
      })
      .catch(() => undefined);
  };

  useEffect(check, []);

  if (dismissed || !stale) return null;

  return (
    <div className="panel">
      <h2 style={{ marginTop: 0 }}>{t.home.backupNudgeTitle}</h2>
      <p style={{ margin: "4px 0 12px" }}>{t.home.backupNudge}</p>
      <div className="form-actions" style={{ justifyContent: "flex-start" }}>
        <button
          type="button"
          className="btn"
          onClick={async () => {
            const ok = await saveWork();
            if (ok) check();
          }}
        >
          {t.home.saveNow}
        </button>
        <button type="button" className="btn secondary" onClick={() => setDismissed(true)}>
          {t.home.dismiss}
        </button>
      </div>
    </div>
  );
}

/** Friendly "tax savings jar": set aside a % of this month's paid income. */
function TaxJarCard({ invoices }: { invoices: Invoice[] }) {
  const t = useStrings();
  const lang = useLang();
  const { activeId } = useBiz();
  const [pct, setPct] = useState(25);

  useEffect(() => {
    if (activeId == null) return;
    getSetting(`taxJarPercent:${activeId}`)
      .then((v) => {
        const n = v ? parseFloat(v) : NaN;
        setPct(!Number.isNaN(n) && n >= 0 && n <= 100 ? n : 25);
      })
      .catch(() => setPct(25));
  }, [activeId]);

  const mk = monthKey(0);
  const income = invoices
    .filter((i) => i.status === "paid" && i.due_date.startsWith(mk))
    .reduce((s, i) => s + invoiceTotal(i), 0);

  return (
    <div className="panel">
      <h2 style={{ marginTop: 0 }}>🏦 {t.taxjar.title}</h2>
      {income <= 0 ? (
        <p style={{ margin: 0 }}>{t.taxjar.noIncome}</p>
      ) : (
        <>
          <p style={{ margin: "4px 0 8px" }}>
            <strong>
              {t.taxjar.setAside.replace("{money}", fmtMoney((income * pct) / 100, lang))}
            </strong>
          </p>
          <p className="row-sub" style={{ margin: "0 0 8px" }}>
            {t.taxjar.basedOn
              .replace("{money}", fmtMoney(income, lang))
              .replace("{pct}", String(pct))}
          </p>
          <p className="row-sub" style={{ margin: 0, fontSize: 13 }}>
            {t.taxjar.note}
          </p>
        </>
      )}
    </div>
  );
}

/** Percent change of this year's year-to-date value vs last year's. */
function yoyDir(
  thisV: number,
  lastV: number
): { dir: "up" | "down" | "same"; pct: number } {
  if (lastV === 0) return thisV > 0 ? { dir: "up", pct: 100 } : { dir: "same", pct: 0 };
  const pct = Math.round(((thisV - lastV) / lastV) * 100);
  if (Math.abs(pct) <= 5) return { dir: "same", pct: 0 };
  return pct > 0 ? { dir: "up", pct } : { dir: "down", pct: -pct };
}

/** Year-over-year: this year to date vs the same stretch last year. */
function YoYCard({ invoices, expenses }: { invoices: Invoice[]; expenses: Expense[] }) {
  const t = useStrings();
  const lang = useLang();
  const today = todayISO();
  const y = today.slice(0, 4);
  const lastY = String(Number(y) - 1);
  const lastEnd = `${lastY}${today.slice(4)}`;

  const inRange = (d: string, start: string, end: string) => d >= start && d <= end;

  const ytdIncome = (last: boolean) =>
    invoices
      .filter(
        (i) =>
          i.status === "paid" &&
          inRange(i.due_date, `${last ? lastY : y}-01-01`, last ? lastEnd : today)
      )
      .reduce((s, i) => s + invoiceTotal(i), 0);

  const ytdOut = (last: boolean) =>
    expenses
      .filter((e) =>
        inRange(e.date, `${last ? lastY : y}-01-01`, last ? lastEnd : today)
      )
      .reduce((s, e) => s + e.amount, 0);

  const lastIncome = ytdIncome(true);
  const lastOut = ytdOut(true);
  if (lastIncome === 0 && lastOut === 0) return null;

  const inc = yoyDir(ytdIncome(false), lastIncome);
  const out = yoyDir(ytdOut(false), lastOut);

  const incomeLine =
    inc.dir === "same"
      ? t.yoy.incomeSame
      : (inc.dir === "up" ? t.yoy.incomeUp : t.yoy.incomeDown).replace(
          "{pct}",
          String(inc.pct)
        );
  const outLine =
    out.dir === "same"
      ? t.yoy.expensesSame
      : (out.dir === "up" ? t.yoy.expensesUp : t.yoy.expensesDown).replace(
          "{pct}",
          String(out.pct)
        );

  return (
    <div className="panel">
      <h2 style={{ marginTop: 0 }}>📊 {t.yoy.title}</h2>
      <p className="row-sub" style={{ margin: "0 0 8px" }}>
        {t.yoy.ytdNote.replace("{date}", fmtDate(today, lang))}
      </p>
      <ul className="insight-list">
        <li>{incomeLine}</li>
        <li>{outLine}</li>
      </ul>
    </div>
  );
}

export default function Home({ invoices, expenses, bills, go }: Props) {
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

  const unpaidBills = bills
    .filter((b) => b.status === "unpaid")
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  const totalOwed = unpaidBills.reduce((s, b) => s + b.amount, 0);

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

      <Insights invoices={invoices} expenses={expenses} bills={bills} />

      <BackupNudge />

      <GoalCard invoices={invoices} />

      <TaxJarCard invoices={invoices} />

      <YoYCard invoices={invoices} expenses={expenses} />

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
            <button type="button" className="btn small tour-new-invoice" onClick={() => go("invoices")}>
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
            <h2 style={{ margin: 0 }}>📄 {t.home.billsDue}</h2>
            <button type="button" className="btn small" onClick={() => go("bills")}>
              {t.bills.new}
            </button>
          </div>
          {unpaidBills.length === 0 ? (
            <p className="empty-note">{t.home.noBillsDue}</p>
          ) : (
            <>
              <p className="row-sub" style={{ margin: "0 0 8px" }}>
                {t.home.totalOwed}: <strong>{fmtMoney(totalOwed, lang)}</strong>
              </p>
              <ul className="row-list">
                {unpaidBills.slice(0, 5).map((b) => {
                  const late = b.due_date < today;
                  return (
                    <li key={b.id}>
                      <div className="row-main">
                        <div className="row-title">{b.payee}</div>
                        <div className="row-sub">
                          {t.home.due} {fmtDate(b.due_date, lang)}
                        </div>
                      </div>
                      <span className={`badge${late ? " late" : " waiting"}`}>
                        {late ? t.bills.overdue : t.bills.unpaid}
                      </span>
                      <span className="row-amount negative">
                        {fmtMoney(b.amount, lang)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
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
