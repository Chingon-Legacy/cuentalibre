import { useMemo, useState } from "react";
import { useBiz } from "../App";
import { addInvoice, calcTaxAmount, deleteInvoice, invoiceTotal, setInvoiceStatus, updateInvoice } from "../db";
import { getStateInfo } from "../data/us-states";
import { fmtDate, fmtMoney, todayISO, useLang, useStrings } from "../i18n";
import EmptyState from "../components/EmptyState";
import ServicePicker from "../components/ServicePicker";
import PayMethodSelect from "../components/PayMethodSelect";
import type { Invoice, PayMethod, Recurrence, Service } from "../types";

interface Props {
  invoices: Invoice[];
  services: Service[];
  refresh: () => Promise<void>;
}

type StatusFilter = "all" | "waiting" | "late" | "paid";

function InvoiceDetail({
  inv,
  onClose,
}: {
  inv: Invoice;
  onClose: () => void;
}) {
  const t = useStrings();
  const lang = useLang();
  const { bizName, pack } = useBiz();
  const today = todayISO();

  const catLabel = (id: string) => {
    const c = pack.income.find((x) => x.id === id);
    return c ? (lang === "es" ? c.es : c.en) : t.expenses.other;
  };

  const late = inv.status === "waiting" && inv.due_date < today;
  const total = invoiceTotal(inv);
  const due = inv.status === "paid" ? 0 : total;
  const payMethodLabel = !inv.pay_method
    ? null
    : inv.pay_method === "cash"
      ? t.paymethod.cash
      : inv.pay_method === "card"
        ? t.paymethod.card
        : inv.pay_method === "transfer"
          ? t.paymethod.transfer
          : t.paymethod.check;
  const ratePct =
    inv.tax_rate > 0
      ? `${(inv.tax_rate * 100).toFixed(2).replace(/\.?0+$/, "")}%`
      : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal print-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="invoice-paper">
          <div className="invoice-head">
            <div>
              <div className="invoice-biz">{bizName || "CuentaLibre"}</div>
              <div className="invoice-sub">CuentaLibre</div>
            </div>
            <div className="invoice-num">
              <div className="label">{t.invoices.number}</div>
              <div className="value">#{inv.number || "—"}</div>
            </div>
          </div>

          <div className="invoice-meta">
            <div>
              <div className="label">{t.invoices.billTo}</div>
              <div className="value">{inv.customer}</div>
            </div>
            <div>
              <div className="label">{t.invoices.issueDate}</div>
              <div className="value">{fmtDate(inv.created_at.slice(0, 10), lang)}</div>
            </div>
            <div>
              <div className="label">{t.invoices.dueDate}</div>
              <div className="value">{fmtDate(inv.due_date, lang)}</div>
            </div>
            <div>
              <div className="label">{t.invoices.status}</div>
              <div className="value">
                {inv.status === "paid"
                  ? t.invoices.paid
                  : late
                    ? t.invoices.late
                    : t.invoices.waiting}
              </div>
            </div>
            {payMethodLabel && (
              <div>
                <div className="label">{t.paymethod.label}</div>
                <div className="value">{payMethodLabel}</div>
              </div>
            )}
          </div>

          <table className="report invoice-table">
            <thead>
              <tr>
                <th>{t.invoices.category}</th>
                <th className="num">{t.invoices.amount}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{catLabel(inv.category)}</td>
                <td className="num">{fmtMoney(inv.amount, lang)}</td>
              </tr>
              {inv.tax_amount > 0 && (
                <tr>
                  <td>
                    {t.invoices.salesTax}
                    {ratePct ? ` (${ratePct})` : ""}
                  </td>
                  <td className="num">{fmtMoney(inv.tax_amount, lang)}</td>
                </tr>
              )}
              <tr className="total">
                <td>{t.invoices.amountDue}</td>
                <td className="num">{fmtMoney(due, lang)}</td>
              </tr>
            </tbody>
          </table>

          <div className="form-actions no-print">
            <button type="button" className="btn secondary" onClick={onClose}>
              {t.invoices.cancel}
            </button>
            <button type="button" className="btn" onClick={() => window.print()}>
              🖨 {t.invoices.print}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Invoices({ invoices, services, refresh }: Props) {
  const t = useStrings();
  const lang = useLang();
  const { pack, stateCode, bizName } = useBiz();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [viewing, setViewing] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(pack.income[0]?.id ?? "other");
  const [dueDate, setDueDate] = useState(todayISO());
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [taxOn, setTaxOn] = useState(false);
  const [taxRatePct, setTaxRatePct] = useState("");
  const [payMethod, setPayMethod] = useState<PayMethod | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const today = todayISO();

  /** State base rate as a percent string, e.g. "7" for 7%. */
  const stateRatePct = useMemo(() => {
    const info = getStateInfo(stateCode);
    if (!info || info.salesTax <= 0) return "";
    return (info.salesTax * 100).toFixed(2).replace(/\.?0+$/, "");
  }, [stateCode]);

  const parsedRate = useMemo(() => {
    const p = parseFloat(taxRatePct);
    return !Number.isNaN(p) && p > 0 ? p / 100 : 0;
  }, [taxRatePct]);

  const previewTax = useMemo(() => {
    const value = parseFloat(amount);
    if (!taxOn || Number.isNaN(value) || value <= 0) return 0;
    return calcTaxAmount(value, parsedRate);
  }, [amount, taxOn, parsedRate]);

  const reset = () => {
    setCustomer("");
    setAmount("");
    setCategory(pack.income[0]?.id ?? "other");
    setDueDate(todayISO());
    setRecurrence("none");
    setTaxOn(stateRatePct !== "");
    setTaxRatePct(stateRatePct);
    setPayMethod(null);
    setEditing(null);
    setShowForm(false);
  };

  const startCreate = () => {
    setCustomer("");
    setAmount("");
    setCategory(pack.income[0]?.id ?? "other");
    setDueDate(todayISO());
    setRecurrence("none");
    // Default to the business state's base rate; 0%-tax states get no tax line.
    setTaxOn(stateRatePct !== "");
    setTaxRatePct(stateRatePct);
    setPayMethod(null);
    setEditing(null);
    setShowForm(true);
  };

  const startEdit = (inv: Invoice) => {
    setCustomer(inv.customer);
    setAmount(String(inv.amount));
    setCategory(inv.category);
    setDueDate(inv.due_date);
    setRecurrence("none");
    setTaxOn(inv.tax_rate > 0);
    setTaxRatePct(
      inv.tax_rate > 0 ? (inv.tax_rate * 100).toFixed(2).replace(/\.?0+$/, "") : ""
    );
    setPayMethod(inv.pay_method ?? null);
    setEditing(inv);
    setShowForm(true);
  };

  const submit = async () => {
    const value = parseFloat(amount);
    if (!customer.trim() || Number.isNaN(value) || value <= 0) return;
    const rounded = Math.round(value * 100) / 100;
    const rate = taxOn ? parsedRate : 0;
    if (editing) {
      await updateInvoice(editing.id, {
        customer: customer.trim(),
        amount: rounded,
        category,
        due_date: dueDate,
        tax_rate: rate,
        pay_method: payMethod,
      });
    } else {
      await addInvoice({
        customer: customer.trim(),
        amount: rounded,
        category,
        due_date: dueDate,
        recurrence,
        tax_rate: rate,
        pay_method: payMethod,
      });
    }
    reset();
    await refresh();
  };

  const markPaid = async (id: number) => {
    await setInvoiceStatus(id, "paid");
    await refresh();
  };

  /** Open WhatsApp (web or app) with a polite, pre-written payment reminder. */
  const remind = (inv: Invoice) => {
    const msg = t.invoices.remindMsg
      .replace("{customer}", inv.customer)
      .replace("{biz}", bizName || "CuentaLibre")
      .replace("{number}", inv.number || "—")
      .replace("{amount}", fmtMoney(invoiceTotal(inv), lang))
      .replace("{date}", fmtDate(inv.due_date, lang));
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  };

  const remove = async (id: number) => {
    if (!window.confirm(t.invoices.confirmDelete)) return;
    await deleteInvoice(id);
    await refresh();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (q && !inv.customer.toLowerCase().includes(q)) return false;
      const late = inv.status === "waiting" && inv.due_date < today;
      if (statusFilter === "paid") return inv.status === "paid";
      if (statusFilter === "late") return late;
      if (statusFilter === "waiting")
        return inv.status === "waiting" && !late;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, search, statusFilter]);

  const badge = (inv: Invoice) => {
    if (inv.status === "paid")
      return <span className="badge paid">{t.invoices.paid}</span>;
    if (inv.due_date < today)
      return <span className="badge late">{t.invoices.late}</span>;
    return <span className="badge waiting">{t.invoices.waiting}</span>;
  };

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>🧾 {t.invoices.title}</h1>
        </div>
        <button type="button" className="btn" onClick={startCreate}>
          {t.invoices.new}
        </button>
      </div>

      {showForm && (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>
            {editing ? t.invoices.editTitle : t.invoices.new}
          </h2>
          <div className="form-grid">
            <ServicePicker
              services={services}
              onPick={(s) => setAmount(String(s.price))}
            />
            <div className="field">
              <label>{t.invoices.customer}</label>
              <input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder={t.invoices.customerPh}
              />
            </div>
            <div className="field">
              <label>{t.invoices.amount}</label>
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
              <label>{t.invoices.category}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {pack.income.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === "es" ? c.es : c.en}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t.invoices.dueDate}</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={taxOn}
                  onChange={(e) => {
                    setTaxOn(e.target.checked);
                    if (e.target.checked && !taxRatePct) setTaxRatePct(stateRatePct);
                  }}
                />
                {t.invoices.taxAdd}
              </label>
              {taxOn && (
                <>
                  <div className="tax-rate-row">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={taxRatePct}
                      onChange={(e) => setTaxRatePct(e.target.value)}
                      placeholder={stateRatePct || "0"}
                      aria-label={t.invoices.taxRate}
                    />
                    <span className="pct">%</span>
                    <span className="tax-preview">
                      {t.invoices.salesTax}: {fmtMoney(previewTax, lang)}
                    </span>
                  </div>
                  <p className="tax-note">{t.invoices.taxNote}</p>
                </>
              )}
            </div>
            {!editing && (
              <div className="field">
                <label>{t.invoices.repeat}</label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as Recurrence)}
                >
                  <option value="none">{t.invoices.repeatNone}</option>
                  <option value="weekly">{t.invoices.repeatWeekly}</option>
                  <option value="monthly">{t.invoices.repeatMonthly}</option>
                </select>
              </div>
            )}
            <PayMethodSelect value={payMethod} onChange={setPayMethod} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn secondary" onClick={reset}>
              {t.invoices.cancel}
            </button>
            <button type="button" className="btn" onClick={submit}>
              {editing ? t.invoices.saveChanges : t.invoices.create}
            </button>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="filter-bar">
          <div className="field" style={{ flex: 2 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.invoices.searchPh}
              aria-label={t.invoices.searchPh}
            />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 150 }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              aria-label={t.invoices.statusFilter}
            >
              <option value="all">{t.invoices.allStatuses}</option>
              <option value="waiting">{t.invoices.waiting}</option>
              <option value="late">{t.invoices.late}</option>
              <option value="paid">{t.invoices.paid}</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="🧾"
            title={t.invoices.emptyTitle}
            body={t.invoices.emptyBody}
            actionLabel={t.invoices.new}
            onAction={startCreate}
          />
        ) : (
          <ul className="row-list">
            {filtered.map((inv) => (
              <li key={inv.id}>
                <div className="row-main">
                  <div className="row-title">
                    #{inv.number || "—"} · {inv.customer}
                    {inv.recurrence !== "none" && (
                      <span className="badge waiting" style={{ marginLeft: 8 }}>
                        🔁 {t.invoices.recurring}
                      </span>
                    )}
                  </div>
                  <div className="row-sub">
                    {t.invoices.dueDate}: {fmtDate(inv.due_date, lang)}
                  </div>
                </div>
                {badge(inv)}
                <span className="row-amount positive">
                  {fmtMoney(invoiceTotal(inv), lang)}
                </span>
                <button
                  type="button"
                  className="btn small secondary"
                  onClick={() => setViewing(inv)}
                >
                  {t.invoices.view}
                </button>
                <button
                  type="button"
                  className="btn small secondary"
                  onClick={() => startEdit(inv)}
                >
                  {t.invoices.edit}
                </button>
                {inv.status === "waiting" && (
                  <button
                    type="button"
                    className="btn small secondary"
                    onClick={() => markPaid(inv.id)}
                  >
                    {t.invoices.markPaid}
                  </button>
                )}
                {inv.status === "waiting" && (
                  <button
                    type="button"
                    className="btn small secondary"
                    onClick={() => remind(inv)}
                    title={t.invoices.remind}
                  >
                    💬 {t.invoices.remind}
                  </button>
                )}
                <button
                  type="button"
                  className="btn danger-ghost small"
                  onClick={() => remove(inv.id)}
                >
                  {t.invoices.delete}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {viewing && <InvoiceDetail inv={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
