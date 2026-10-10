import { useMemo, useState } from "react";
import { fmtDate, fmtMoney, todayISO, useLang, useStrings } from "../i18n";
import { invoiceTotal } from "../db";
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

export default function Customers({ invoices }: Props) {
  const t = useStrings();
  const lang = useLang();
  const [expanded, setExpanded] = useState<string | null>(null);
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
      <p className="subtitle">&nbsp;</p>

      <div className="panel">
        {rows.length === 0 ? (
          <p className="empty-note">{t.customers.empty}</p>
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
    </div>
  );
}
