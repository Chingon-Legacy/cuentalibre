import { useMemo, useState } from "react";
import {
  addLoan,
  addLoanPayment,
  deleteLoan,
  deleteLoanPayment,
} from "../db";
import { fmtDate, fmtMoney, todayISO, useLang, useStrings } from "../i18n";
import EmptyState from "../components/EmptyState";
import type { Loan, LoanPayment } from "../types";

interface Props {
  loans: Loan[];
  payments: LoanPayment[];
  refresh: () => Promise<void>;
}

/** Money you borrowed, and how fast you're paying it back. */
export default function Loans({ loans, payments, refresh }: Props) {
  const t = useStrings();
  const lang = useLang();

  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Add-loan form.
  const [loanName, setLoanName] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanDate, setLoanDate] = useState(todayISO());
  const [loanNote, setLoanNote] = useState("");

  // Log-payment form (inside the expanded loan).
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(todayISO());
  const [payNote, setPayNote] = useState("");

  const paidByLoan = useMemo(() => {
    const m = new Map<number, number>();
    for (const p of payments) {
      m.set(p.loan_id, (m.get(p.loan_id) ?? 0) + p.amount);
    }
    return m;
  }, [payments]);

  const expanded = loans.find((l) => l.id === expandedId) ?? null;
  const expandedPayments = expanded
    ? payments.filter((p) => p.loan_id === expanded.id)
    : [];

  const toggleExpand = (loan: Loan) => {
    if (expandedId === loan.id) {
      setExpandedId(null);
      setShowPayForm(false);
    } else {
      setExpandedId(loan.id);
      setShowPayForm(false);
      setPayAmount("");
      setPayNote("");
      setPayDate(todayISO());
    }
  };

  const add = async () => {
    const value = parseFloat(loanAmount);
    if (!loanName.trim() || Number.isNaN(value) || value <= 0) return;
    await addLoan({
      name: loanName.trim(),
      borrowed_amount: Math.round(value * 100) / 100,
      date_borrowed: loanDate,
      note: loanNote.trim(),
    });
    setLoanName("");
    setLoanAmount("");
    setLoanDate(todayISO());
    setLoanNote("");
    setShowAdd(false);
    await refresh();
  };

  const remove = async (id: number) => {
    if (!window.confirm(t.loans.confirmDelete)) return;
    await deleteLoan(id);
    if (expandedId === id) setExpandedId(null);
    await refresh();
  };

  const logPayment = async () => {
    const value = parseFloat(payAmount);
    if (!expanded || Number.isNaN(value) || value <= 0) return;
    await addLoanPayment({
      loan_id: expanded.id,
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
    await deleteLoanPayment(id);
    await refresh();
  };

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>🏦 {t.loans.title}</h1>
        </div>
        <button type="button" className="btn" onClick={() => setShowAdd(!showAdd)}>
          {t.loans.new}
        </button>
      </div>

      {showAdd && (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>{t.loans.new}</h2>
          <div className="form-grid">
            <div className="field">
              <label>{t.loans.name}</label>
              <input
                value={loanName}
                onChange={(e) => setLoanName(e.target.value)}
                placeholder={t.loans.namePh}
              />
            </div>
            <div className="field">
              <label>{t.loans.borrowed}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="field">
              <label>{t.loans.dateBorrowed}</label>
              <input
                type="date"
                value={loanDate}
                onChange={(e) => setLoanDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label>{t.loans.note}</label>
              <input
                value={loanNote}
                onChange={(e) => setLoanNote(e.target.value)}
              />
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn secondary"
              onClick={() => setShowAdd(false)}
            >
              {t.loans.cancel}
            </button>
            <button type="button" className="btn" onClick={add}>
              {t.loans.create}
            </button>
          </div>
        </div>
      )}

      <div className="panel">
        {loans.length === 0 ? (
          <EmptyState
            icon="🏦"
            title={t.loans.emptyTitle}
            body={t.loans.emptyBody}
            actionLabel={t.loans.new}
            onAction={() => setShowAdd(true)}
          />
        ) : (
          <ul className="row-list">
            {loans.map((l) => {
              const paid = paidByLoan.get(l.id) ?? 0;
              const balance = Math.max(0, l.borrowed_amount - paid);
              const pct =
                l.borrowed_amount > 0
                  ? Math.min(100, Math.round((paid / l.borrowed_amount) * 100))
                  : 0;
              const paidOff = l.borrowed_amount > 0 && balance <= 0;
              const open = expandedId === l.id;
              return (
                <li key={l.id} className="stacked">
                  <button
                    type="button"
                    onClick={() => toggleExpand(l)}
                    aria-expanded={open}
                    aria-label={l.name}
                    style={{
                      all: "unset",
                      display: "block",
                      width: "100%",
                      cursor: "pointer",
                      boxSizing: "border-box",
                    }}
                  >
                    <div className="row-main">
                      <div className="row-title">
                        {l.name}
                        {paidOff && (
                          <span className="badge paid" style={{ marginLeft: 8 }}>
                            {t.loans.paidOff}
                          </span>
                        )}
                      </div>
                      <div className="row-sub">
                        {t.loans.borrowed}: {fmtMoney(l.borrowed_amount, lang)} ·{" "}
                        {t.loans.paidSoFar}: {fmtMoney(paid, lang)} ·{" "}
                        {t.loans.balance}: {fmtMoney(balance, lang)}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <div
                          className="goal-bar"
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div className="goal-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="row-sub" style={{ marginTop: 4 }}>
                          {t.loans.progress.replace("{pct}", String(pct))}
                        </div>
                      </div>
                    </div>
                  </button>

                  {open && expanded && (
                    <div style={{ marginTop: 12 }}>
                      {!showPayForm ? (
                        <button
                          type="button"
                          className="btn small"
                          onClick={() => setShowPayForm(true)}
                        >
                          {t.loans.logPayment}
                        </button>
                      ) : (
                        <div className="form-grid" style={{ marginBottom: 16 }}>
                          <div className="field">
                            <label>{t.loans.paymentAmount}</label>
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
                            <label>{t.loans.paymentDate}</label>
                            <input
                              type="date"
                              value={payDate}
                              onChange={(e) => setPayDate(e.target.value)}
                            />
                          </div>
                          <div className="field full">
                            <label>{t.loans.note}</label>
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
                              {t.loans.cancel}
                            </button>
                            <button type="button" className="btn" onClick={logPayment}>
                              {t.loans.logPayment}
                            </button>
                          </div>
                        </div>
                      )}

                      {expandedPayments.length > 0 && (
                        <ul className="row-list">
                          {expandedPayments.map((p) => (
                            <li key={p.id}>
                              <div className="row-main">
                                <div className="row-title">
                                  {fmtMoney(p.amount, lang)}
                                </div>
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
                                {t.loans.delete}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="form-actions" style={{ marginTop: 12 }}>
                        <button
                          type="button"
                          className="btn danger-ghost small"
                          onClick={() => remove(expanded.id)}
                        >
                          {t.loans.delete}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
