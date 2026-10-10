import { useState } from "react";
import { useBiz } from "../App";
import {
  addTimeEntry,
  deleteTimeEntry,
  markTimeEntriesInvoiced,
  addInvoice,
} from "../db";
import { fmtDate, fmtMoney, todayISO, useLang, useStrings } from "../i18n";
import EmptyState from "../components/EmptyState";
import type { Service, TimeEntry } from "../types";

interface Props {
  entries: TimeEntry[];
  services: Service[];
  refresh: () => Promise<void>;
}

/** Due date = today + 14 days, returned as YYYY-MM-DD. */
function dueIn14Days(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

export default function Time({ entries, services, refresh }: Props) {
  const t = useStrings();
  const lang = useLang();
  const { pack } = useBiz();
  const incomeCategory = pack.income[0]?.id ?? "other";

  // Log-hours form state.
  const [showForm, setShowForm] = useState(false);
  const [customer, setCustomer] = useState("");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState("");
  const [date, setDate] = useState(todayISO());

  // Selection of uninvoiced entries for the "create invoice" flow.
  const [selected, setSelected] = useState<number[]>([]);
  const [rate, setRate] = useState("");
  const [justCreated, setJustCreated] = useState(false);

  const resetForm = () => {
    setCustomer("");
    setDescription("");
    setHours("");
    setDate(todayISO());
    setShowForm(false);
  };

  const saveEntry = async () => {
    const hrs = parseFloat(hours);
    if (!customer.trim() || !description.trim() || Number.isNaN(hrs) || hrs <= 0)
      return;
    await addTimeEntry({
      customer: customer.trim(),
      description: description.trim(),
      hours: Math.round(hrs * 100) / 100,
      date,
    });
    resetForm();
    await refresh();
  };

  const removeEntry = async (id: number) => {
    if (!window.confirm(t.time.confirmDelete)) return;
    await deleteTimeEntry(id);
    setSelected((s) => s.filter((x) => x !== id));
    await refresh();
  };

  /**
   * Prefill the hourly rate when a saved service's name matches the first
   * selected entry's description (case-insensitive).
   */
  const prefillRate = (ids: number[]) => {
    const first = entries.find((e) => ids.includes(e.id));
    if (!first) {
      setRate("");
      return;
    }
    const match = services.find(
      (s) =>
        s.name.trim().toLowerCase() === first.description.trim().toLowerCase()
    );
    if (match) setRate(String(match.price));
  };

  const toggleSelect = (id: number) => {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    setSelected(next);
    prefillRate(next);
  };

  const selectedEntries = entries.filter(
    (e) => selected.includes(e.id) && e.invoiced === 0
  );
  const rateValue = parseFloat(rate);
  const previewTotal =
    !Number.isNaN(rateValue) && rateValue > 0
      ? selectedEntries.reduce((s, e) => s + e.hours, 0) * rateValue
      : 0;

  const createInvoices = async () => {
    if (selectedEntries.length === 0) return;
    if (Number.isNaN(rateValue) || rateValue <= 0) return;
    // One invoice per customer.
    const byCustomer = new Map<string, number>();
    for (const e of selectedEntries) {
      byCustomer.set(e.customer, (byCustomer.get(e.customer) ?? 0) + e.hours);
    }
    const due = dueIn14Days();
    for (const [cust, hrs] of byCustomer) {
      await addInvoice({
        customer: cust,
        amount: Math.round(hrs * rateValue * 100) / 100,
        category: incomeCategory,
        due_date: due,
        recurrence: "none",
        tax_rate: 0,
      });
    }
    await markTimeEntriesInvoiced(selectedEntries.map((e) => e.id));
    setSelected([]);
    setRate("");
    setJustCreated(true);
    window.setTimeout(() => setJustCreated(false), 4000);
    await refresh();
  };

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>⏱️ {t.time.title}</h1>
          <p className="subtitle">{t.time.subtitle}</p>
        </div>
        <button type="button" className="btn" onClick={() => setShowForm(true)}>
          {t.time.new}
        </button>
      </div>

      {showForm && (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>{t.time.new}</h2>
          <div className="form-grid">
            <div className="field">
              <label>{t.time.customer}</label>
              <input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder={t.time.customerPh}
              />
            </div>
            <div className="field">
              <label>{t.time.description}</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.time.descriptionPh}
              />
            </div>
            <div className="field">
              <label>{t.time.hours}</label>
              <input
                type="number"
                min="0"
                step="0.25"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
            <div className="field">
              <label>{t.time.date}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn secondary" onClick={resetForm}>
              {t.time.cancel}
            </button>
            <button type="button" className="btn" onClick={saveEntry}>
              {t.time.save}
            </button>
          </div>
        </div>
      )}

      <div className="panel">
        {entries.length === 0 ? (
          <EmptyState
            icon="⏱️"
            title={t.time.emptyTitle}
            body={t.time.emptyBody}
            actionLabel={t.time.new}
            onAction={() => setShowForm(true)}
          />
        ) : (
          <ul className="row-list">
            {entries.map((e) => (
              <li key={e.id}>
                {e.invoiced === 0 && (
                  <input
                    type="checkbox"
                    checked={selected.includes(e.id)}
                    onChange={() => toggleSelect(e.id)}
                    aria-label={t.time.uninvoiced}
                  />
                )}
                <div className="row-main">
                  <div className="row-title">{e.customer}</div>
                  <div className="row-sub">
                    {e.description} · {t.time.hours}: {e.hours} ·{" "}
                    {fmtDate(e.date, lang)}
                  </div>
                </div>
                {e.invoiced === 1 ? (
                  <span className="badge paid">{t.time.invoiced}</span>
                ) : (
                  <span className="badge">{t.time.uninvoiced}</span>
                )}
                <button
                  type="button"
                  className="btn danger-ghost small"
                  onClick={() => removeEntry(e.id)}
                >
                  {t.time.delete}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedEntries.length > 0 && (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>
            {t.time.createInvoice} —{" "}
            {t.time.selected.replace("{n}", String(selectedEntries.length))}
          </h2>
          <div className="form-grid">
            <div className="field">
              <label>{t.time.rate}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder={t.time.ratePh}
              />
            </div>
            <div className="field">
              <label>{t.time.total}</label>
              <div className="row-amount">
                {fmtMoney(previewTotal, lang)}
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                setSelected([]);
                setRate("");
              }}
            >
              {t.time.cancel}
            </button>
            <button
              type="button"
              className="btn"
              onClick={createInvoices}
              disabled={Number.isNaN(rateValue) || rateValue <= 0}
            >
              {t.time.createInvoice}
            </button>
          </div>
        </div>
      )}

      {justCreated && (
        <div className="panel" role="status">
          <strong>{t.time.created}</strong>
        </div>
      )}
    </div>
  );
}
