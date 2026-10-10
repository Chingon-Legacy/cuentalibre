import { useState } from "react";
import {
  addPurchaseOrder,
  deletePurchaseOrder,
  setPurchaseOrderStatus,
} from "../db";
import { fmtMoney, useLang, useStrings } from "../i18n";
import EmptyState from "../components/EmptyState";
import type { PurchaseOrder, PurchaseOrderStatus } from "../types";

interface Props {
  orders: PurchaseOrder[];
  refresh: () => Promise<void>;
}

/** A simple paper trail of orders placed with vendors. */
export default function PurchaseOrders({ orders, refresh }: Props) {
  const t = useStrings();
  const lang = useLang();

  const [showForm, setShowForm] = useState(false);
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");

  const reset = () => {
    setVendor("");
    setAmount("");
    setShowForm(false);
  };

  const save = async () => {
    const value = parseFloat(amount);
    if (!vendor.trim() || Number.isNaN(value) || value <= 0) return;
    await addPurchaseOrder({
      vendor: vendor.trim(),
      amount: Math.round(value * 100) / 100,
    });
    reset();
    await refresh();
  };

  const setStatus = async (id: number, s: PurchaseOrderStatus) => {
    await setPurchaseOrderStatus(id, s);
    await refresh();
  };

  const remove = async (id: number) => {
    if (!window.confirm(t.purchaseorders.confirmDelete)) return;
    await deletePurchaseOrder(id);
    await refresh();
  };

  const statusBadge = (s: PurchaseOrderStatus) =>
    s === "received" ? (
      <span className="badge paid">{t.purchaseorders.received}</span>
    ) : (
      <span className="badge waiting">{t.purchaseorders.ordered}</span>
    );

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>🧾 {t.purchaseorders.title}</h1>
          <p className="subtitle">{t.purchaseorders.subtitle}</p>
        </div>
        <button type="button" className="btn" onClick={() => setShowForm(!showForm)}>
          {t.purchaseorders.new}
        </button>
      </div>

      {showForm && (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>{t.purchaseorders.new}</h2>
          <div className="form-grid">
            <div className="field">
              <label>{t.purchaseorders.vendor}</label>
              <input
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder={t.purchaseorders.vendorPh}
              />
            </div>
            <div className="field">
              <label>{t.purchaseorders.amount}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn secondary" onClick={reset}>
              {t.purchaseorders.cancel}
            </button>
            <button type="button" className="btn" onClick={save}>
              {t.purchaseorders.create}
            </button>
          </div>
        </div>
      )}

      <div className="panel">
        {orders.length === 0 ? (
          <EmptyState
            icon="🧾"
            title={t.purchaseorders.emptyTitle}
            body={t.purchaseorders.emptyBody}
            actionLabel={t.purchaseorders.new}
            onAction={() => setShowForm(true)}
          />
        ) : (
          <ul className="row-list">
            {orders.map((o) => (
              <li key={o.id}>
                <div className="row-main">
                  <div className="row-title">
                    #{o.number} · {o.vendor} {statusBadge(o.status)}
                  </div>
                  <div className="row-sub">{fmtMoney(o.amount, lang)}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {o.status === "ordered" && (
                    <button
                      type="button"
                      className="btn small"
                      onClick={() => setStatus(o.id, "received")}
                    >
                      {t.purchaseorders.markReceived}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn danger-ghost small"
                    onClick={() => remove(o.id)}
                  >
                    {t.purchaseorders.delete}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
