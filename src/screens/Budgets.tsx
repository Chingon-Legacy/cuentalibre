import { useMemo, useState } from "react";
import { deleteBudget, upsertBudget } from "../db";
import { useBiz } from "../App";
import { fmtMoney, todayISO, useLang, useStrings } from "../i18n";
import EmptyState from "../components/EmptyState";
import type { Budget, Expense } from "../types";

interface Props {
  budgets: Budget[];
  expenses: Expense[];
  refresh: () => Promise<void>;
}

function currentMonth(): string {
  return todayISO().slice(0, 7); // YYYY-MM
}

/** Monthly spending limits per expense category, with progress bars. */
export default function Budgets({ budgets, expenses, refresh }: Props) {
  const t = useStrings();
  const lang = useLang();
  const { pack } = useBiz();
  const [month, setMonth] = useState(currentMonth());
  // Draft limit per category, so typing doesn't fight the saved value.
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const catLabel = (id: string) => {
    const c = pack.expense.find((x) => x.id === id);
    return c ? (lang === "es" ? c.es : c.en) : id;
  };

  const budgetFor = useMemo(() => {
    const m = new Map<string, Budget>();
    for (const b of budgets) {
      if (b.month === month) m.set(b.category, b);
    }
    return m;
  }, [budgets, month]);

  const spentByCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of expenses) {
      if (!e.date.startsWith(month)) continue;
      m.set(e.category, (m.get(e.category) ?? 0) + e.amount);
    }
    return m;
  }, [expenses, month]);

  const save = async (category: string) => {
    const raw = drafts[category];
    if (raw == null) return;
    const value = parseFloat(raw);
    setDrafts((d) => {
      const next = { ...d };
      delete next[category];
      return next;
    });
    if (Number.isNaN(value) || value <= 0) return;
    await upsertBudget({
      category,
      month,
      amount: Math.round(value * 100) / 100,
    });
    await refresh();
  };

  const remove = async (id: number) => {
    if (!window.confirm(t.budgets.confirmDelete)) return;
    await deleteBudget(id);
    await refresh();
  };

  const rows = pack.expense.map((c) => {
    const b = budgetFor.get(c.id);
    const spent = spentByCat.get(c.id) ?? 0;
    return { cat: c, budget: b ?? null, spent };
  });
  const withBudgets = rows.filter((r) => r.budget);

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>💰 {t.budgets.title}</h1>
          <p className="subtitle">{t.budgets.subtitle}</p>
        </div>
        <div className="field" style={{ minWidth: 160 }}>
          <label>{t.budgets.month}</label>
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon="💰"
            title={t.budgets.emptyTitle}
            body={t.budgets.emptyBody}
            actionLabel=""
            onAction={() => undefined}
          />
        </div>
      ) : (
        <div className="panel">
          {withBudgets.length === 0 && (
            <p className="subtitle" style={{ marginTop: 0 }}>
              {t.budgets.emptyBody}
            </p>
          )}
          <ul className="row-list">
            {rows.map(({ cat, budget, spent }) => {
              const pct =
                budget && budget.amount > 0
                  ? Math.round((spent / budget.amount) * 100)
                  : 0;
              const over = budget != null && spent > budget.amount;
              const near = budget != null && !over && pct >= 90;
              const draft = drafts[cat.id] ?? (budget ? String(budget.amount) : "");
              return (
                <li key={cat.id} className="stacked">
                  <div className="row-main">
                    <div className="row-title">{catLabel(cat.id)}</div>
                    {budget && (
                      <>
                        <div className="row-sub">
                          {fmtMoney(spent, lang)} {t.budgets.of}{" "}
                          {fmtMoney(budget.amount, lang)} {t.budgets.spent}
                          {over && (
                            <span className="badge late" style={{ marginLeft: 8 }}>
                              {t.home.budgetsOver} ·{" "}
                              {t.budgets.overBy.replace(
                                "{money}",
                                fmtMoney(spent - budget.amount, lang)
                              )}
                            </span>
                          )}
                          {near && (
                            <span className="badge waiting" style={{ marginLeft: 8 }}>
                              {t.home.budgetsNear}
                            </span>
                          )}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <div
                            className="goal-bar"
                            role="progressbar"
                            aria-valuenow={Math.min(100, pct)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className="goal-fill"
                              style={{
                                width: `${Math.min(100, pct)}%`,
                                background: over ? "var(--red)" : undefined,
                              }}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      marginTop: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <div className="field" style={{ minWidth: 140, flex: 1 }}>
                      <label>{t.budgets.limit}</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={draft}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [cat.id]: e.target.value }))
                        }
                        onBlur={() => save(cat.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        }}
                      />
                    </div>
                    {budget && (
                      <button
                        type="button"
                        className="btn danger-ghost small"
                        onClick={() => remove(budget.id)}
                      >
                        {t.budgets.delete}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
