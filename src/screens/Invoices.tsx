import { useState } from "react";
import { useBiz } from "../App";
import { addInvoice, deleteInvoice, setInvoiceStatus } from "../db";
import { fmtDate, fmtMoney, todayISO, useLang, useStrings } from "../i18n";
import type { Invoice } from "../types";

interface Props {
  invoices: Invoice[];
  refresh: () => Promise<void>;
}

export default function Invoices({ invoices, refresh }: Props) {
  const t = useStrings();
  const lang = useLang();
  const { pack } = useBiz();
  const [showForm, setShowForm] = useState(false);
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(pack.income[0]?.id ?? "other");
  const [dueDate, setDueDate] = useState(todayISO());
  const today = todayISO();

  const reset = () => {
    setCustomer("");
    setAmount("");
    setCategory(pack.income[0]?.id ?? "other");
    setDueDate(todayISO());
    setShowForm(false);
  };

  const create = async () => {
    const value = parseFloat(amount);
    if (!customer.trim() || Number.isNaN(value) || value <= 0) return;
    await addInvoice({
      customer: customer.trim(),
      amount: Math.round(value * 100) / 100,
      category,
      due_date: dueDate,
    });
    reset();
    await refresh();
  };

  const markPaid = async (id: number) => {
    await setInvoiceStatus(id, "paid");
    await refresh();
  };

  const remove = async (id: number) => {
    if (!window.confirm(t.invoices.confirmDelete)) return;
    await deleteInvoice(id);
    await refresh();
  };

  const badge = (inv: Invoice) => {
    if (inv.status === "paid")
      return <span className="badge paid">{t.invoices.paid}</span>;
    if (inv.due_date < today)
      return <span className="badge late">{t.invoices.late}</span>;
    return <span className="badge waiting">{t.invoices.waiting}</span>;
  };

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>🧾 {t.invoices.title}</h1>
        </div>
        <button type="button" className="btn" onClick={() => setShowForm((v) => !v)}>
          {t.invoices.new}
        </button>
      </div>

      {showForm && (
        <div className="panel">
          <div className="form-grid">
            <div className="field">
              <label>{t.invoices.customer}</label>
              <input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder={t.invoices.customerPh}
              />
            </div>
            <div className="field">
              <label>{t.invoices.amount}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="field">
              <label>{t.invoices.category}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {pack.income.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === "es" ? c.es : c.en}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t.invoices.dueDate}</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn secondary" onClick={reset}>
              {t.invoices.cancel}
            </button>
            <button type="button" className="btn" onClick={create}>
              {t.invoices.create}
            </button>
          </div>
        </div>
      )}

      <div className="panel">
        {invoices.length === 0 ? (
          <p className="empty-note">{t.invoices.empty}</p>
        ) : (
          <ul className="row-list">
            {invoices.map((inv) => (
              <li key={inv.id}>
                <div className="row-main">
                  <div className="row-title">{inv.customer}</div>
                  <div className="row-sub">
                    {t.invoices.dueDate}: {fmtDate(inv.due_date, lang)}
                  </div>
                </div>
                {badge(inv)}
                <span className="row-amount positive">{fmtMoney(inv.amount, lang)}</span>
                {inv.status === "waiting" && (
                  <button
                    type="button"
                    className="btn small secondary"
                    onClick={() => markPaid(inv.id)}
                  >
                    {t.invoices.markPaid}
                  </button>
                )}
                <button
                  type="button"
                  className="btn danger-ghost small"
                  onClick={() => remove(inv.id)}
                >
                  {t.invoices.delete}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
