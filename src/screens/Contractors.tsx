import { useMemo, useState } from "react";
import {
  addContractor,
  addContractorPayment,
  deleteContractor,
  deleteContractorPayment,
  getContractors,
} from "../db";
import { downloadCsv, toCsv } from "../backup";
import { fmtDate, fmtMoney, todayISO, useLang, useStrings } from "../i18n";
import EmptyState from "../components/EmptyState";
import type { Contractor, ContractorPayment } from "../types";

interface Props {
  contractors: Contractor[];
  payments: ContractorPayment[];
  refresh: () => Promise<void>;
}

/** IRS 1099-NEC filing threshold for the year. */
const NEC_THRESHOLD = 600;

export default function Contractors({ contractors, payments, refresh }: Props) {
  const t = useStrings();
  const lang = useLang();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(todayISO());
  const [payNote, setPayNote] = useState("");
  const [showPayForm, setShowPayForm] = useState(false);
  const [year, setYear] = useState(() => String(new Date().getFullYear()));

  const years = useMemo(() => {
    const ys = new Set<string>();
    for (const p of payments) ys.add(p.date.slice(0, 4));
    ys.add(String(new Date().getFullYear()));
    return [...ys].sort().reverse();
  }, [payments]);

  const yearPayments = useMemo(
    () => payments.filter((p) => p.date.startsWith(year)),
    [payments, year]
  );

  const totals = useMemo(() => {
    const m = new Map<number, number>();
    for (const p of yearPayments) {
      m.set(p.contractor_id, (m.get(p.contractor_id) ?? 0) + p.amount);
    }
    return m;
  }, [yearPayments]);

  const selected = contractors.find((c) => c.id === selectedId) ?? null;
  const selectedPayments = selected
    ? payments.filter((p) => p.contractor_id === selected.id)
    : [];

  const add = async () => {
    if (!name.trim()) return;
    await addContractor({ name: name.trim(), note: note.trim() });
    setName("");
    setNote("");
    setShowAdd(false);
    const fresh = await getContractors();
    const created = fresh.find((c) => c.name === name.trim());
    if (created) setSelectedId(created.id);
    await refresh();
  };

  const remove = async (id: number) => {
    if (!window.confirm(t.contractors.confirmDelete)) return;
    await deleteContractor(id);
    if (selectedId === id) setSelectedId(null);
    await refresh();
  };

  const logPayment = async () => {
    const value = parseFloat(payAmount);
    if (!selected || Number.isNaN(value) || value <= 0) return;
    await addContractorPayment({
      contractor_id: selected.id,
      amount: Math.round(value * 100) / 100,
      date: payDate,
      note: payNote.trim(),
    });
    setPayAmount("");
    setPayNote("");
    setPayDate(todayISO());
    setShowPayForm(false);
    await refresh();
  };

  const removePayment = async (id: number) => {
    if (!window.confirm(t.contractors.confirmDeletePayment)) return;
    await deleteContractorPayment(id);
    await refresh();
  };

  const exportSummary = async () => {
    const rows = contractors.map((c) => [
      c.name,
      totals.get(c.id) ?? 0,
      (totals.get(c.id) ?? 0) >= NEC_THRESHOLD ? "1099-NEC" : "",
    ]);
    await downloadCsv(
      `cuentalibre-contractors-${year}.csv`,
      toCsv([t.contractors.name, `${t.contractors.totalYear} ${year}`, "1099-NEC"], rows)
    );
  };

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>🤝 {t.contractors.title}</h1>
          <p className="subtitle">{t.contractors.subtitle}</p>
        </div>
        <button type="button" className="btn" onClick={() => setShowAdd(!showAdd)}>
          {t.contractors.new}
        </button>
      </div>

      <div className="panel">
        <p className="tax-note" style={{ marginTop: 0 }}>
          ℹ️ {t.contractors.banner}
        </p>
      </div>

      {showAdd && (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>{t.contractors.new}</h2>
          <div className="form-grid">
            <div className="field">
              <label>{t.contractors.name}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.contractors.namePh}
              />
            </div>
            <div className="field">
              <label>{t.contractors.note}</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.contractors.notePh}
              />
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn secondary"
              onClick={() => setShowAdd(false)}
            >
              {t.contractors.cancel}
            </button>
            <button type="button" className="btn" onClick={add}>
              {t.contractors.add}
            </button>
          </div>
        </div>
      )}

      <div className="two-col">
        <div className="panel">
          <div className="toolbar">
            <h2 style={{ margin: 0 }}>{t.contractors.title}</h2>
            <div className="field" style={{ minWidth: 120 }}>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                aria-label={t.contractors.year}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {contractors.length === 0 ? (
            <EmptyState
              icon="🤝"
              title={t.contractors.emptyTitle}
              body={t.contractors.emptyBody}
              actionLabel={t.contractors.new}
              onAction={() => setShowAdd(true)}
            />
          ) : (
            <ul className="row-list">
              {contractors.map((c) => {
                const total = totals.get(c.id) ?? 0;
                const over = total >= NEC_THRESHOLD;
                return (
                  <li
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    style={{ cursor: "pointer" }}
                    className={selectedId === c.id ? "selected-row" : ""}
                  >
                    <div className="row-main">
                      <div className="row-title">{c.name}</div>
                      <div className="row-sub">
                        {t.contractors.totalYear} {year}: {fmtMoney(total, lang)}{" "}
                        {t.contractors.ofThreshold} {fmtMoney(NEC_THRESHOLD, lang)}
                        {over && (
                          <span className="badge late" style={{ marginLeft: 8 }}>
                            {t.contractors.overThreshold}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn danger-ghost small"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(c.id);
                      }}
                    >
                      {t.contractors.delete}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="form-actions" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn secondary"
              onClick={exportSummary}
              disabled={contractors.length === 0}
            >
              ⬇ {t.contractors.exportCsv}
            </button>
          </div>
        </div>

        <div className="panel">
          <h2 style={{ marginTop: 0 }}>
            {selected ? `${selected.name} — ${t.contractors.payments}` : t.contractors.selectContractor}
          </h2>
          {selected && (
            <>
              {!showPayForm ? (
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowPayForm(true)}
                >
                  {t.contractors.addPayment}
                </button>
              ) : (
                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div className="field">
                    <label>{t.contractors.amount}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="field">
                    <label>{t.contractors.date}</label>
                    <input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                    />
                  </div>
                  <div className="field full">
                    <label>{t.contractors.paymentNote}</label>
                    <input
                      value={payNote}
                      onChange={(e) => setPayNote(e.target.value)}
                    />
                  </div>
                  <div className="form-actions full">
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => setShowPayForm(false)}
                    >
                      {t.contractors.cancel}
                    </button>
                    <button type="button" className="btn" onClick={logPayment}>
                      {t.contractors.save}
                    </button>
                  </div>
                </div>
              )}
              {selectedPayments.length === 0 ? (
                <p className="empty-note">{t.contractors.noPayments}</p>
              ) : (
                <ul className="row-list">
                  {selectedPayments.map((p) => (
                    <li key={p.id}>
                      <div className="row-main">
                        <div className="row-title">{fmtMoney(p.amount, lang)}</div>
                        <div className="row-sub">
                          {fmtDate(p.date, lang)}
                          {p.note ? ` · ${p.note}` : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn danger-ghost small"
                        onClick={() => removePayment(p.id)}
                      >
                        {t.contractors.deletePayment}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
