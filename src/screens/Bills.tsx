import { useState } from "react";
import { useBiz } from "../App";
import { addBill, deleteBill, payBill, updateBill } from "../db";
import { fmtDate, fmtMoney, todayISO, useLang, useStrings } from "../i18n";
import EmptyState from "../components/EmptyState";
import type { Bill } from "../types";

interface Props {
  bills: Bill[];
  refresh: () => Promise<void>;
}

export default function Bills({ bills, refresh }: Props) {
  const t = useStrings();
  const lang = useLang();
  const { pack } = useBiz();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);
  const [payee, setPayee] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(pack.expense[0]?.id ?? "other");
  const [dueDate, setDueDate] = useState(todayISO());
  const today = todayISO();

  const reset = () => {
    setPayee("");
    setAmount("");
    setCategory(pack.expense[0]?.id ?? "other");
    setDueDate(todayISO());
    setEditing(null);
    setShowForm(false);
  };

  const startCreate = () => {
    reset();
    setShowForm(true);
  };

  const startEdit = (b: Bill) => {
    setPayee(b.payee);
    setAmount(String(b.amount));
    setCategory(b.category);
    setDueDate(b.due_date);
    setEditing(b);
    setShowForm(true);
  };

  const save = async () => {
    const value = parseFloat(amount);
    if (!payee.trim() || Number.isNaN(value) || value <= 0) return;
    const rounded = Math.round(value * 100) / 100;
    if (editing) {
      await updateBill(editing.id, {
        payee: payee.trim(),
        amount: rounded,
        category,
        due_date: dueDate,
      });
    } else {
      await addBill({ payee: payee.trim(), amount: rounded, category, due_date: dueDate });
    }
    reset();
    await refresh();
  };

  const markPaid = async (id: number) => {
    await payBill(id);
    await refresh();
  };

  const remove = async (id: number) => {
    if (!window.confirm(t.bills.confirmDelete)) return;
    await deleteBill(id);
    await refresh();
  };

  const badge = (b: Bill) => {
    if (b.status === "paid") return <span className="badge paid">{t.bills.paid}</span>;
    if (b.due_date < today) return <span className="badge late">{t.bills.overdue}</span>;
    // Due within 7 days gets an amber "due soon" badge.
    const soon = new Date();
    soon.setDate(soon.getDate() + 7);
    const soonIso = soon.toISOString().slice(0, 10);
    if (b.due_date <= soonIso)
      return <span className="badge waiting">{t.bills.dueSoon}</span>;
    return <span className="badge">{t.bills.unpaid}</span>;
  };

  const totalOwed = bills
    .filter((b) => b.status === "unpaid")
    .reduce((s, b) => s + b.amount, 0);

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>📄 {t.bills.title}</h1>
          {totalOwed > 0 && (
            <div className="row-sub" style={{ marginTop: 4 }}>
              {t.bills.totalOwed}:{" "}
              <strong>{fmtMoney(totalOwed, lang)}</strong>
            </div>
          )}
        </div>
        <button type="button" className="btn" onClick={startCreate}>
          {t.bills.new}
        </button>
      </div>

      {showForm && (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>
            {editing ? t.bills.editTitle : t.bills.new}
          </h2>
          <div className="form-grid">
            <div className="field">
              <label>{t.bills.payee}</label>
              <input
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                placeholder={t.bills.payeePh}
              />
            </div>
            <div className="field">
              <label>{t.bills.amount}</label>
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
              <label>{t.bills.category}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {pack.expense.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === "es" ? c.es : c.en}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t.bills.dueDate}</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <p className="tax-note">{t.bills.paidNote}</p>
          <div className="form-actions">
            <button type="button" className="btn secondary" onClick={reset}>
              {t.bills.cancel}
            </button>
            <button type="button" className="btn" onClick={save}>
              {editing ? t.bills.saveChanges : t.bills.create}
            </button>
          </div>
        </div>
      )}

      <div className="panel">
        {bills.length === 0 ? (
          <EmptyState
            icon="📄"
            title={t.bills.emptyTitle}
            body={t.bills.emptyBody}
            actionLabel={t.bills.new}
            onAction={startCreate}
          />
        ) : (
          <ul className="row-list">
            {bills.map((b) => (
              <li key={b.id}>
                <div className="row-main">
                  <div className="row-title">{b.payee}</div>
                  <div className="row-sub">
                    {t.bills.dueDate}: {fmtDate(b.due_date, lang)}
                  </div>
                </div>
                {badge(b)}
                <span className="row-amount negative">
                  {fmtMoney(b.amount, lang)}
                </span>
                <button
                  type="button"
                  className="btn small secondary"
                  onClick={() => startEdit(b)}
                >
                  {t.bills.edit}
                </button>
                {b.status === "unpaid" && (
                  <button
                    type="button"
                    className="btn small secondary"
                    onClick={() => markPaid(b.id)}
                  >
                    {t.bills.markPaid}
                  </button>
                )}
                <button
                  type="button"
                  className="btn danger-ghost small"
                  onClick={() => remove(b.id)}
                >
                  {t.bills.delete}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
