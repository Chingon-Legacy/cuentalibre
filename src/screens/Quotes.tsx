import { useState } from "react";
import { useBiz } from "../App";
import { addInvoice, addQuote, deleteQuote, setQuoteStatus, updateQuote } from "../db";
import { getStateInfo } from "../data/us-states";
import { fmtDate, fmtMoney, useLang, useStrings } from "../i18n";
import EmptyState from "../components/EmptyState";
import ServicePicker from "../components/ServicePicker";
import type { Quote, QuoteStatus, Service } from "../types";

interface Props {
  quotes: Quote[];
  services: Service[];
  refresh: () => Promise<void>;
}

/** Due date 14 days out for invoices created from quotes. */
function plus14Days(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function Quotes({ quotes, services, refresh }: Props) {
  const t = useStrings();
  const lang = useLang();
  const { pack, stateCode } = useBiz();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Quote | null>(null);
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(pack.income[0]?.id ?? "other");
  const [validUntil, setValidUntil] = useState(plus14Days());
  const [note, setNote] = useState<string | null>(null);

  const reset = () => {
    setCustomer("");
    setAmount("");
    setCategory(pack.income[0]?.id ?? "other");
    setValidUntil(plus14Days());
    setEditing(null);
    setShowForm(false);
  };

  const startCreate = () => {
    reset();
    setShowForm(true);
  };

  const startEdit = (q: Quote) => {
    setCustomer(q.customer);
    setAmount(String(q.amount));
    setCategory(q.category);
    setValidUntil(q.valid_until);
    setEditing(q);
    setShowForm(true);
  };

  const save = async () => {
    const value = parseFloat(amount);
    if (!customer.trim() || Number.isNaN(value) || value <= 0) return;
    const rounded = Math.round(value * 100) / 100;
    if (editing) {
      await updateQuote(editing.id, {
        customer: customer.trim(),
        amount: rounded,
        category,
        valid_until: validUntil,
      });
    } else {
      await addQuote({
        customer: customer.trim(),
        amount: rounded,
        category,
        valid_until: validUntil,
      });
    }
    reset();
    await refresh();
  };

  const setStatus = async (id: number, s: QuoteStatus) => {
    await setQuoteStatus(id, s);
    await refresh();
  };

  const remove = async (id: number) => {
    if (!window.confirm(t.quotes.confirmDelete)) return;
    await deleteQuote(id);
    await refresh();
  };

  const convertToInvoice = async (q: Quote) => {
    const info = getStateInfo(stateCode);
    await addInvoice({
      customer: q.customer,
      amount: q.amount,
      category: q.category,
      due_date: plus14Days(),
      tax_rate: info && info.salesTax > 0 ? info.salesTax : 0,
    });
    await setQuoteStatus(q.id, "accepted");
    setNote(t.quotes.converted);
    await refresh();
  };

  const statusLabel = (s: QuoteStatus) =>
    s === "draft"
      ? t.quotes.draft
      : s === "sent"
        ? t.quotes.sent
        : s === "accepted"
          ? t.quotes.accepted
          : t.quotes.declined;

  const badgeClass = (s: QuoteStatus) =>
    s === "accepted" ? "badge paid" : s === "declined" ? "badge late" : "badge waiting";

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>📝 {t.quotes.title}</h1>
          <p className="subtitle">{t.quotes.subtitle}</p>
        </div>
        <button type="button" className="btn" onClick={startCreate}>
          {t.quotes.new}
        </button>
      </div>

      {note && (
        <div className="panel">
          <p className="status-note">{note}</p>
        </div>
      )}

      {showForm && (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>
            {editing ? t.quotes.editTitle : t.quotes.new}
          </h2>
          <div className="form-grid">
            <ServicePicker
              services={services}
              onPick={(s) => setAmount(String(s.price))}
            />
            <div className="field">
              <label>{t.quotes.customer}</label>
              <input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder={t.quotes.customerPh}
              />
            </div>
            <div className="field">
              <label>{t.quotes.amount}</label>
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
              <label>{t.quotes.category}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {pack.income.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === "es" ? c.es : c.en}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t.quotes.validUntil}</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn secondary" onClick={reset}>
              {t.quotes.cancel}
            </button>
            <button type="button" className="btn" onClick={save}>
              {editing ? t.quotes.saveChanges : t.quotes.create}
            </button>
          </div>
        </div>
      )}

      <div className="panel">
        {quotes.length === 0 ? (
          <EmptyState
            icon="📝"
            title={t.quotes.emptyTitle}
            body={t.quotes.emptyBody}
            actionLabel={t.quotes.new}
            onAction={startCreate}
          />
        ) : (
          <ul className="row-list">
            {quotes.map((q) => (
              <li key={q.id}>
                <div className="row-main">
                  <div className="row-title">
                    #{q.number || "—"} · {q.customer}
                  </div>
                  <div className="row-sub">
                    {t.quotes.validUntil}: {fmtDate(q.valid_until, lang)}
                  </div>
                </div>
                <span className={badgeClass(q.status)}>{statusLabel(q.status)}</span>
                <span className="row-amount positive">{fmtMoney(q.amount, lang)}</span>
                <button
                  type="button"
                  className="btn small secondary"
                  onClick={() => startEdit(q)}
                >
                  {t.quotes.edit}
                </button>
                {q.status === "draft" && (
                  <button
                    type="button"
                    className="btn small secondary"
                    onClick={() => setStatus(q.id, "sent")}
                  >
                    {t.quotes.markSent}
                  </button>
                )}
                {q.status === "sent" && (
                  <>
                    <button
                      type="button"
                      className="btn small secondary"
                      onClick={() => setStatus(q.id, "accepted")}
                    >
                      {t.quotes.markAccepted}
                    </button>
                    <button
                      type="button"
                      className="btn small secondary"
                      onClick={() => setStatus(q.id, "declined")}
                    >
                      {t.quotes.markDeclined}
                    </button>
                  </>
                )}
                {q.status === "accepted" && (
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => convertToInvoice(q)}
                  >
                    🧾 {t.quotes.convert}
                  </button>
                )}
                <button
                  type="button"
                  className="btn danger-ghost small"
                  onClick={() => remove(q.id)}
                >
                  {t.quotes.delete}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
