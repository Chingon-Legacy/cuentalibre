import { useState } from "react";
import { useBiz } from "../App";
import { addDonation, deleteDonation, updateDonation } from "../db";
import { fmtDate, fmtMoney, todayISO, useLang, useStrings } from "../i18n";
import EmptyState from "../components/EmptyState";
import type { Donation } from "../types";

interface Props {
  donations: Donation[];
  refresh: () => Promise<void>;
}

function ReceiptModal({ d, onClose }: { d: Donation; onClose: () => void }) {
  const t = useStrings();
  const lang = useLang();
  const { bizName, active } = useBiz();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal print-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="invoice-paper">
          <div className="invoice-head">
            <div>
              <div className="invoice-biz">{bizName || "CuentaLibre"}</div>
              <div className="invoice-sub">{t.receipt.title}</div>
            </div>
            <div className="invoice-num">
              <div className="label">{t.receipt.dateLine}</div>
              <div className="value">{fmtDate(d.date, lang)}</div>
            </div>
          </div>

          <table className="report invoice-table">
            <tbody>
              <tr>
                <td className="label">{t.receipt.orgLine}</td>
                <td className="value">{bizName || "CuentaLibre"}</td>
              </tr>
              {active?.ein && (
                <tr>
                  <td className="label">{t.receipt.einLine}</td>
                  <td className="value">{active.ein}</td>
                </tr>
              )}
              <tr>
                <td className="label">{t.receipt.donorLine}</td>
                <td className="value">{d.donor}</td>
              </tr>
              <tr>
                <td className="label">{t.receipt.amountLine}</td>
                <td className="value num">
                  <strong>{fmtMoney(d.amount, lang)}</strong>
                </td>
              </tr>
              {d.campaign && (
                <tr>
                  <td className="label">{t.receipt.campaignLine}</td>
                  <td className="value">{d.campaign}</td>
                </tr>
              )}
            </tbody>
          </table>

          <p className="tax-why" style={{ marginTop: 16 }}>
            {t.receipt.noGoods}
          </p>
          <p className="tax-why">{t.receipt.keepIt}</p>

          <div className="form-actions no-print">
            <button type="button" className="btn secondary" onClick={onClose}>
              {t.receipt.close}
            </button>
            <button type="button" className="btn" onClick={() => window.print()}>
              🖨 {t.receipt.print}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Donations({ donations, refresh }: Props) {
  const t = useStrings();
  const lang = useLang();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Donation | null>(null);
  const [receiptFor, setReceiptFor] = useState<Donation | null>(null);
  const [donor, setDonor] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [campaign, setCampaign] = useState("");

  const reset = () => {
    setDonor("");
    setAmount("");
    setDate(todayISO());
    setCampaign("");
    setEditing(null);
    setShowForm(false);
  };

  const startCreate = () => {
    reset();
    setShowForm(true);
  };

  const startEdit = (d: Donation) => {
    setDonor(d.donor);
    setAmount(String(d.amount));
    setDate(d.date);
    setCampaign(d.campaign);
    setEditing(d);
    setShowForm(true);
  };

  const submit = async () => {
    const value = parseFloat(amount);
    if (!donor.trim() || Number.isNaN(value) || value <= 0) return;
    const rounded = Math.round(value * 100) / 100;
    const input = { donor: donor.trim(), amount: rounded, date, campaign: campaign.trim() };
    if (editing) {
      await updateDonation(editing.id, input);
    } else {
      await addDonation(input);
    }
    reset();
    await refresh();
  };

  const remove = async (d: Donation) => {
    if (!window.confirm(t.donations.confirmDelete)) return;
    await deleteDonation(d.id);
    await refresh();
  };

  return (
    <div className="page">
      <div className="toolbar">
        <h1 style={{ margin: 0 }}>❤️ {t.donations.title}</h1>
        <button type="button" className="btn" onClick={startCreate}>
          ＋ {t.donations.new}
        </button>
      </div>
      <p className="subtitle">&nbsp;</p>

      <div className="panel">
        {donations.length === 0 ? (
          <EmptyState
            icon="❤️"
            title={t.donations.emptyTitle}
            body={t.donations.emptyBody}
          />
        ) : (
          <ul className="row-list">
            {donations.map((d) => (
              <li key={d.id}>
                <div className="row-main">
                  <div className="row-title">{d.donor}</div>
                  <div className="row-sub">
                    {fmtDate(d.date, lang)}
                    {d.campaign ? ` · ${d.campaign}` : ""}
                  </div>
                </div>
                <span className="row-amount positive">{fmtMoney(d.amount, lang)}</span>
                <button
                  type="button"
                  className="btn small secondary"
                  onClick={() => setReceiptFor(d)}
                >
                  🧾 {t.donations.receipt}
                </button>
                <button
                  type="button"
                  className="btn small secondary"
                  onClick={() => startEdit(d)}
                >
                  {t.donations.edit}
                </button>
                <button
                  type="button"
                  className="btn small danger-ghost"
                  onClick={() => remove(d)}
                >
                  {t.donations.delete}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={reset}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-pad">
              <h2 style={{ marginTop: 0 }}>
                {editing ? t.donations.save : t.donations.new}
              </h2>
              <div className="field">
                <label>{t.donations.donor}</label>
                <input
                  type="text"
                  value={donor}
                  autoFocus
                  maxLength={80}
                  placeholder={t.donations.donorPh}
                  onChange={(e) => setDonor(e.target.value)}
                />
              </div>
              <div className="field">
                <label>{t.donations.amount}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="field">
                <label>{t.donations.date}</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="field">
                <label>{t.donations.campaign}</label>
                <input
                  type="text"
                  value={campaign}
                  maxLength={80}
                  placeholder={t.donations.campaignPh}
                  onChange={(e) => setCampaign(e.target.value)}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn secondary" onClick={reset}>
                  {t.donations.cancel}
                </button>
                <button type="button" className="btn" onClick={submit}>
                  {editing ? t.donations.save : t.donations.create}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {receiptFor && (
        <ReceiptModal d={receiptFor} onClose={() => setReceiptFor(null)} />
      )}
    </div>
  );
}
