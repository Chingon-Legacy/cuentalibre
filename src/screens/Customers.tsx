import { useMemo, useState } from "react";
import { useBiz } from "../App";
import { fmtDate, fmtMoney, todayISO, useLang, useStrings } from "../i18n";
import EmptyState from "../components/EmptyState";
import { invoiceTotal } from "../db";
import { printStatementHTML } from "../printDocs";
import { openPrintDocument } from "../printOpen";
import type { Invoice } from "../types";

interface Props {
  invoices: Invoice[];
}

interface CustomerRow {
  name: string;
  billed: number;
  paid: number;
  owes: number;
  invoices: Invoice[];
}

function StatementModal({
  row,
  onClose,
}: {
  row: CustomerRow;
  onClose: () => void;
}) {
  const t = useStrings();
  const lang = useLang();
  const { bizName } = useBiz();
  const today = todayISO();
  const [from, setFrom] = useState(() => `${today.slice(0, 4)}-01-01`);
  const [to, setTo] = useState(today);

  const list = useMemo(
    () =>
      row.invoices
        .filter((inv) => inv.due_date >= from && inv.due_date <= to)
        .sort((a, b) => a.due_date.localeCompare(b.due_date)),
    [row, from, to]
  );

  const totalOwed = useMemo(
    () =>
      list
        .filter((inv) => inv.status !== "paid")
        .reduce((sum, inv) => sum + invoiceTotal(inv), 0),
    [list]
  );

  const statusLabel = (inv: Invoice) => {
    if (inv.status === "paid") return t.invoices.paid;
    if (inv.status === "waiting" && inv.due_date < today) return t.invoices.late;
    return t.invoices.waiting;
  };

  /** Build a standalone statement document for the same date range the
   *  modal is showing, and open it where the user can print it or save
   *  it as a PDF (window.print() doesn't work in the installed app). */
  const doPrint = async () => {
    const billed = list.reduce((sum, inv) => sum + invoiceTotal(inv), 0);
    const paid = list
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + invoiceTotal(inv), 0);
    const html = printStatementHTML(
      {
        bizName: bizName || "CuentaLibre",
        customerName: row.name,
        from,
        to,
        rows: list.map((inv) => ({
          number: inv.number || "",
          date: inv.due_date,
          amount: invoiceTotal(inv),
          status: statusLabel(inv),
        })),
        totalBilled: billed,
        totalPaid: paid,
        balanceDue: totalOwed,
      },
      lang,
      t
    );
    await openPrintDocument(html, `statement-${row.name}`, lang);
  };

  const badge = (inv: Invoice) => {
    const late = inv.status === "waiting" && inv.due_date < today;
    return (
      <span
        className={`badge ${inv.status === "paid" ? "paid" : late ? "late" : "waiting"}`}
      >
        {inv.status === "paid"
          ? t.invoices.paid
          : late
            ? t.invoices.late
            : t.invoices.waiting}
      </span>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal print-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="invoice-paper">
          <div className="invoice-head">
            <div>
              <div className="invoice-biz">{bizName || "CuentaLibre"}</div>
              <div className="invoice-sub">{t.statement.title}</div>
            </div>
            <div className="invoice-num">
              <div className="label">{t.statement.billedTo}</div>
              <div className="value">{row.name}</div>
            </div>
          </div>

          <div className="report-controls no-print">
            <div className="field">
              <label>{t.statement.from}</label>
              <input
                type="date"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="field">
              <label>{t.statement.to}</label>
              <input
                type="date"
                value={to}
                min={from}
                max={today}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          <div className="row-sub" style={{ marginBottom: 12 }}>
            {fmtDate(from, lang)} – {fmtDate(to, lang)}
          </div>

          {list.length === 0 ? (
            <p>{t.statement.noInvoices}</p>
          ) : (
            <div className="table-scroll">
              <table className="report invoice-table responsive-table">
                <thead>
                  <tr>
                    <th>{t.statement.invoice}</th>
                    <th>{t.statement.date}</th>
                    <th className="num">{t.statement.amount}</th>
                    <th>{t.statement.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((inv) => (
                    <tr key={inv.id}>
                      <td data-label={t.statement.invoice}>
                        #{inv.number || "—"}
                      </td>
                      <td data-label={t.statement.date}>
                        {fmtDate(inv.due_date, lang)}
                      </td>
                      <td className="num" data-label={t.statement.amount}>
                        {fmtMoney(invoiceTotal(inv), lang)}
                      </td>
                      <td data-label={t.statement.status}>{badge(inv)}</td>
                    </tr>
                  ))}
                  <tr className="total">
                    <td colSpan={2} data-label={t.statement.totalOwed}>
                      {t.statement.totalOwed}
                    </td>
                    <td className="num" data-label={t.statement.amount}>
                      {fmtMoney(totalOwed, lang)}
                    </td>
                    <td data-label={t.statement.status} />
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="form-actions no-print">
            <button type="button" className="btn secondary" onClick={onClose}>
              {t.invoices.cancel}
            </button>
            <button type="button" className="btn" onClick={doPrint}>
              🖨 {t.statement.print}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Customers({ invoices }: Props) {
  const t = useStrings();
  const lang = useLang();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statementFor, setStatementFor] = useState<CustomerRow | null>(null);
  const today = todayISO();

  const rows: CustomerRow[] = useMemo(() => {
    const m = new Map<string, CustomerRow>();
    for (const inv of invoices) {
      const key = inv.customer.trim();
      let row = m.get(key);
      if (!row) {
        row = { name: key, billed: 0, paid: 0, owes: 0, invoices: [] };
        m.set(key, row);
      }
      const total = invoiceTotal(inv);
      row.billed += total;
      if (inv.status === "paid") row.paid += total;
      else row.owes += total;
      row.invoices.push(inv);
    }
    return [...m.values()].sort((a, b) => b.owes - a.owes || b.billed - a.billed);
  }, [invoices]);

  const toggle = (name: string) =>
    setExpanded((cur) => (cur === name ? null : name));

  return (
    <div className="page">
      <h1>👥 {t.customers.title}</h1>
      <p className="subtitle">{t.customers.subtitle}</p>

      <div className="panel">
        {rows.length === 0 ? (
          <EmptyState
            icon="👥"
            title={t.customers.emptyTitle}
            body={t.customers.emptyBody}
          />
        ) : (
          <ul className="row-list">
            {rows.map((r) => (
              <li key={r.name} className="stacked">
                <div className="row-line">
                  <div className="row-main">
                    <div className="row-title">{r.name}</div>
                    <div className="row-sub">
                      {t.customers.billed}: {fmtMoney(r.billed, lang)} ·{" "}
                      {t.customers.paid}: {fmtMoney(r.paid, lang)}
                    </div>
                  </div>
                  <span
                    className={`row-amount ${r.owes > 0 ? "negative" : "positive"}`}
                  >
                    {r.owes > 0 ? `${t.customers.owes}: ` : ""}
                    {fmtMoney(r.owes, lang)}
                  </span>
                  <button
                    type="button"
                    className="btn small secondary"
                    onClick={() => setStatementFor(r)}
                  >
                    🧾 {t.statement.button}
                  </button>
                  <button
                    type="button"
                    className="btn small secondary"
                    onClick={() => toggle(r.name)}
                  >
                    {expanded === r.name
                      ? t.customers.hideInvoices
                      : t.customers.showInvoices}
                  </button>
                </div>
                {expanded === r.name && (
                  <ul className="sub-list">
                    {[...r.invoices]
                      .sort((a, b) => b.due_date.localeCompare(a.due_date))
                      .map((inv) => {
                        const late =
                          inv.status === "waiting" && inv.due_date < today;
                        return (
                          <li key={inv.id}>
                            <span>
                              #{inv.number || "—"} · {fmtDate(inv.due_date, lang)}
                            </span>
                            <span
                              className={`badge ${
                                inv.status === "paid"
                                  ? "paid"
                                  : late
                                    ? "late"
                                    : "waiting"
                              }`}
                            >
                              {inv.status === "paid"
                                ? t.invoices.paid
                                : late
                                  ? t.invoices.late
                                  : t.invoices.waiting}
                            </span>
                            <span className="row-amount">
                              {fmtMoney(invoiceTotal(inv), lang)}
                            </span>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {statementFor && (
        <StatementModal row={statementFor} onClose={() => setStatementFor(null)} />
      )}
    </div>
  );
}
