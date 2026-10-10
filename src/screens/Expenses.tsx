import { useState } from "react";
import { useBiz } from "../App";
import { addExpense, deleteExpense } from "../db";
import { fmtDate, fmtMoney, todayISO, useLang, useStrings } from "../i18n";
import type { Expense } from "../types";

interface Props {
  expenses: Expense[];
  refresh: () => Promise<void>;
}

export default function Expenses({ expenses, refresh }: Props) {
  const t = useStrings();
  const lang = useLang();
  const { pack } = useBiz();
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(pack.expense[0]?.id ?? "other");
  const [date, setDate] = useState(todayISO());

  const catLabel = (id: string) => {
    const c = pack.expense.find((x) => x.id === id);
    return c ? (lang === "es" ? c.es : c.en) : t.expenses.other;
  };

  const reset = () => {
    setDescription("");
    setAmount("");
    setCategory(pack.expense[0]?.id ?? "other");
    setDate(todayISO());
    setShowForm(false);
  };

  const save = async () => {
    const value = parseFloat(amount);
    if (!description.trim() || Number.isNaN(value) || value <= 0) return;
    await addExpense({
      description: description.trim(),
      amount: Math.round(value * 100) / 100,
      category,
      date,
    });
    reset();
    await refresh();
  };

  const remove = async (id: number) => {
    if (!window.confirm(t.expenses.confirmDelete)) return;
    await deleteExpense(id);
    await refresh();
  };

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>💸 {t.expenses.title}</h1>
        </div>
        <button type="button" className="btn" onClick={() => setShowForm((v) => !v)}>
          {t.expenses.add}
        </button>
      </div>

      {showForm && (
        <div className="panel">
          <div className="form-grid">
            <div className="field full">
              <label>{t.expenses.description}</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.expenses.descriptionPh}
              />
            </div>
            <div className="field">
              <label>{t.expenses.amount}</label>
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
              <label>{t.expenses.date}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="field full">
              <label>{t.expenses.category}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {pack.expense.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === "es" ? c.es : c.en}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn secondary" onClick={reset}>
              {t.expenses.cancel}
            </button>
            <button type="button" className="btn" onClick={save}>
              {t.expenses.save}
            </button>
          </div>
        </div>
      )}

      <div className="panel">
        {expenses.length === 0 ? (
          <p className="empty-note">{t.expenses.empty}</p>
        ) : (
          <ul className="row-list">
            {expenses.map((e) => (
              <li key={e.id}>
                <div className="row-main">
                  <div className="row-title">{e.description}</div>
                  <div className="row-sub">
                    {catLabel(e.category)} · {fmtDate(e.date, lang)}
                  </div>
                </div>
                <span className="row-amount negative">-{fmtMoney(e.amount, lang)}</span>
                <button
                  type="button"
                  className="btn danger-ghost small"
                  onClick={() => remove(e.id)}
                >
                  {t.expenses.delete}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
