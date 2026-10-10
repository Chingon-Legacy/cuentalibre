import { useMemo, useState } from "react";
import { fmtDate, fmtMoney, useLang, useStrings } from "../i18n";
import EmptyState from "../components/EmptyState";
import type { Donation } from "../types";

interface Props {
  donations: Donation[];
}

interface DonorRow {
  name: string;
  total: number;
  byYear: { year: string; total: number }[];
  donations: Donation[];
}

export default function Donors({ donations }: Props) {
  const t = useStrings();
  const lang = useLang();
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows: DonorRow[] = useMemo(() => {
    const m = new Map<string, DonorRow>();
    for (const d of donations) {
      const key = d.donor.trim();
      let row = m.get(key);
      if (!row) {
        row = { name: key, total: 0, byYear: [], donations: [] };
        m.set(key, row);
      }
      row.total += d.amount;
      row.donations.push(d);
    }
    for (const row of m.values()) {
      const years = new Map<string, number>();
      for (const d of row.donations) {
        const y = d.date.slice(0, 4);
        years.set(y, (years.get(y) ?? 0) + d.amount);
      }
      row.byYear = [...years.entries()]
        .map(([year, total]) => ({ year, total }))
        .sort((a, b) => b.year.localeCompare(a.year));
      row.donations.sort((a, b) => b.date.localeCompare(a.date));
    }
    return [...m.values()].sort((a, b) => b.total - a.total);
  }, [donations]);

  const toggle = (name: string) => setExpanded((cur) => (cur === name ? null : name));

  return (
    <div className="page">
      <h1>🙏 {t.donors.title}</h1>
      <p className="subtitle">{t.donors.subtitle}</p>

      <div className="panel">
        {rows.length === 0 ? (
          <EmptyState
            icon="🙏"
            title={t.donors.emptyTitle}
            body={t.donors.emptyBody}
          />
        ) : (
          <ul className="row-list">
            {rows.map((r) => (
              <li key={r.name} className="stacked">
                <div className="row-line">
                  <div className="row-main">
                    <div className="row-title">{r.name}</div>
                    <div className="row-sub">
                      {r.byYear
                        .map((y) => `${y.year}: ${fmtMoney(y.total, lang)}`)
                        .join(" · ")}
                    </div>
                  </div>
                  <span className="row-amount positive">
                    {t.donors.donated}: {fmtMoney(r.total, lang)}
                  </span>
                  <button
                    type="button"
                    className="btn small secondary"
                    onClick={() => toggle(r.name)}
                  >
                    {expanded === r.name ? t.donors.hideDonations : t.donors.showDonations}
                  </button>
                </div>
                {expanded === r.name && (
                  <ul className="sub-list">
                    {r.donations.map((d) => (
                      <li key={d.id}>
                        <span>{fmtDate(d.date, lang)}</span>
                        {d.campaign && <span>{d.campaign}</span>}
                        <span className="row-amount positive">
                          {fmtMoney(d.amount, lang)}
                        </span>
                      </li>
                    ))}
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
