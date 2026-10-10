import { useState } from "react";
import { addTrip, deleteTrip } from "../db";
import { rateForDate, tripDeduction } from "../data/mileage-rates";
import { fmtDate, fmtMoney, todayISO, useLang, useStrings } from "../i18n";
import { downloadCsv, toCsv } from "../backup";
import EmptyState from "../components/EmptyState";
import type { Trip } from "../types";

interface Props {
  trips: Trip[];
  refresh: () => Promise<void>;
}

export default function Mileage({ trips, refresh }: Props) {
  const t = useStrings();
  const lang = useLang();
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [miles, setMiles] = useState("");
  const [purpose, setPurpose] = useState("");

  const year = todayISO().slice(0, 4);
  const currentRate = rateForDate(todayISO());

  const ytdTrips = trips.filter((tr) => tr.date.startsWith(year));
  const ytdDeduction = ytdTrips.reduce(
    (s, tr) => s + tripDeduction(tr.date, tr.miles),
    0
  );

  const reset = () => {
    setDate(todayISO());
    setMiles("");
    setPurpose("");
    setShowForm(false);
  };

  const save = async () => {
    const value = parseFloat(miles);
    if (!date || Number.isNaN(value) || value <= 0) return;
    await addTrip({
      date,
      miles: Math.round(value * 10) / 10,
      purpose: purpose.trim(),
    });
    reset();
    await refresh();
  };

  const remove = async (id: number) => {
    if (!window.confirm(t.mileage.confirmDelete)) return;
    await deleteTrip(id);
    await refresh();
  };

  const exportCsv = async () => {
    const sorted = [...ytdTrips].sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : 0
    );
    const rows = sorted.map((tr) => [
      tr.date,
      tr.miles.toFixed(2),
      tr.purpose,
      rateForDate(tr.date).toFixed(2),
      tripDeduction(tr.date, tr.miles).toFixed(2),
    ]);
    const headers = [
      t.mileage.date,
      t.mileage.miles,
      t.mileage.purpose,
      t.mileage.perMile.replace("{rate}", "").trim(),
      t.mileage.deduction,
    ];
    await downloadCsv(
      `cuentalibre-mileage-${year}.csv`,
      toCsv(headers, rows)
    );
  };

  const ordered = [...trips].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id
  );

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>🚗 {t.mileage.title}</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn secondary"
            onClick={exportCsv}
            disabled={trips.length === 0}
          >
            {t.mileage.export}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setShowForm(true)}
          >
            {t.mileage.new}
          </button>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">{t.mileage.ytdTitle}</div>
        <div className="stat-value">{fmtMoney(ytdDeduction, lang)}</div>
        <div className="row-sub" style={{ marginTop: 4 }}>
          {t.mileage.ytdSub.replace("{rate}", fmtMoney(currentRate, lang))}
        </div>
      </div>

      {showForm && (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>{t.mileage.new}</h2>
          <div className="form-grid">
            <div className="field">
              <label>{t.mileage.date}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label>{t.mileage.miles}</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={miles}
                onChange={(e) => setMiles(e.target.value)}
                placeholder={t.mileage.milesPh}
              />
            </div>
            <div className="field">
              <label>{t.mileage.purpose}</label>
              <input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder={t.mileage.purposePh}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn secondary" onClick={reset}>
              {t.mileage.cancel}
            </button>
            <button type="button" className="btn" onClick={save}>
              {t.mileage.save}
            </button>
          </div>
        </div>
      )}

      <div className="panel">
        {trips.length === 0 ? (
          <EmptyState
            icon="🚗"
            title={t.mileage.emptyTitle}
            body={t.mileage.emptyBody}
            actionLabel={t.mileage.new}
            onAction={() => setShowForm(true)}
          />
        ) : (
          <ul className="row-list">
            {ordered.map((tr) => (
              <li key={tr.id}>
                <div className="row-main">
                  <div className="row-title">
                    {tr.purpose.trim() || t.mileage.title}
                  </div>
                  <div className="row-sub">
                    {fmtDate(tr.date, lang)} · {tr.miles}{" "}
                    {t.mileage.perMile.replace(
                      "{rate}",
                      fmtMoney(rateForDate(tr.date), lang)
                    )}
                  </div>
                </div>
                <span className="row-amount">
                  {t.mileage.deduction}:{" "}
                  {fmtMoney(tripDeduction(tr.date, tr.miles), lang)}
                </span>
                <button
                  type="button"
                  className="btn danger-ghost small"
                  onClick={() => remove(tr.id)}
                >
                  {t.mileage.delete}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
