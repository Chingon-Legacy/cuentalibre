import { fmtDate, fmtMoney, todayISO, useLang, useStrings } from "../i18n";
import type { Expense, Invoice, Screen } from "../types";

interface Props {
  invoices: Invoice[];
  expenses: Expense[];
  go: (s: Screen) => void;
}

export default function Home({ invoices, expenses, go }: Props) {
  const t = useStrings();
  const lang = useLang();
  const today = todayISO();

  const moneyIn = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.amount, 0);
  const moneyOut = expenses.reduce((s, e) => s + e.amount, 0);
  const left = moneyIn - moneyOut;

  const unpaid = invoices
    .filter((i) => i.status === "waiting")
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  const recent = [...expenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div className="page">
      <h1>{t.nav.home}</h1>
      <p className="subtitle">{t.home.subtitle}</p>

      <div className="stat-grid">
        <div className="stat-card in">
          <div className="stat-label">{t.home.moneyIn}</div>
          <div className="stat-value">{fmtMoney(moneyIn, lang)}</div>
        </div>
        <div className="stat-card out">
          <div className="stat-label">{t.home.moneyOut}</div>
          <div className="stat-value">{fmtMoney(moneyOut, lang)}</div>
        </div>
        <div className="stat-card left">
          <div className="stat-label">{t.home.whatsLeft}</div>
          <div className="stat-value">{fmtMoney(left, lang)}</div>
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="toolbar">
            <h2 style={{ margin: 0 }}>🧾 {t.home.whoOwesMe}</h2>
            <button type="button" className="btn small" onClick={() => go("invoices")}>
              {t.home.newInvoice}
            </button>
          </div>
          {unpaid.length === 0 ? (
            <p className="empty-note">{t.home.nothingOwed}</p>
          ) : (
            <ul className="row-list">
              {unpaid.slice(0, 5).map((i) => {
                const late = i.due_date < today;
                return (
                  <li key={i.id}>
                    <div className="row-main">
                      <div className="row-title">{i.customer}</div>
                      <div className="row-sub">
                        {t.home.due} {fmtDate(i.due_date, lang)}
                      </div>
                    </div>
                    <span className={`badge${late ? " late" : " waiting"}`}>
                      {late ? t.invoices.late : t.invoices.waiting}
                    </span>
                    <span className="row-amount positive">{fmtMoney(i.amount, lang)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="panel">
          <div className="toolbar">
            <h2 style={{ margin: 0 }}>💸 {t.home.recentExpenses}</h2>
            <button type="button" className="btn small" onClick={() => go("expenses")}>
              {t.home.addExpense}
            </button>
          </div>
          {recent.length === 0 ? (
            <p className="empty-note">{t.home.noExpensesYet}</p>
          ) : (
            <ul className="row-list">
              {recent.map((e) => (
                <li key={e.id}>
                  <div className="row-main">
                    <div className="row-title">{e.description}</div>
                    <div className="row-sub">{fmtDate(e.date, lang)}</div>
                  </div>
                  <span className="row-amount negative">-{fmtMoney(e.amount, lang)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
