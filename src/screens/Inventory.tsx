import { useState } from "react";
import {
  addProduct,
  adjustProduct,
  deleteProduct,
  updateProduct,
} from "../db";
import { useStrings } from "../i18n";
import EmptyState from "../components/EmptyState";
import type { Product } from "../types";

interface Props {
  products: Product[];
  refresh: () => Promise<void>;
}

/** Simple stock counts: + / − to adjust, a low-stock number, gentle nudges. */
export default function Inventory({ products, refresh }: Props) {
  const t = useStrings();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [low, setLow] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editLow, setEditLow] = useState("");

  const fmtQty = (n: number) =>
    Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");

  const add = async () => {
    const q = parseFloat(qty);
    const l = parseFloat(low);
    if (!name.trim() || Number.isNaN(q) || q < 0) return;
    await addProduct({
      name: name.trim(),
      quantity: Math.round(q * 100) / 100,
      low_threshold: Number.isNaN(l) || l < 0 ? 0 : Math.round(l * 100) / 100,
    });
    setName("");
    setQty("");
    setLow("");
    setShowAdd(false);
    await refresh();
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditQty(String(p.quantity));
    setEditLow(String(p.low_threshold));
  };

  const saveEdit = async () => {
    const q = parseFloat(editQty);
    const l = parseFloat(editLow);
    if (editingId == null || !editName.trim() || Number.isNaN(q) || q < 0) return;
    await updateProduct(editingId, {
      name: editName.trim(),
      quantity: Math.round(q * 100) / 100,
      low_threshold: Number.isNaN(l) || l < 0 ? 0 : Math.round(l * 100) / 100,
    });
    setEditingId(null);
    await refresh();
  };

  const remove = async (id: number) => {
    if (!window.confirm(t.inventory.confirmDelete)) return;
    await deleteProduct(id);
    await refresh();
  };

  const bump = async (id: number, delta: number) => {
    await adjustProduct(id, delta);
    await refresh();
  };

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>📦 {t.inventory.title}</h1>
          <p className="subtitle">{t.inventory.subtitle}</p>
        </div>
        <button type="button" className="btn" onClick={() => setShowAdd(!showAdd)}>
          {t.inventory.new}
        </button>
      </div>

      {showAdd && (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>{t.inventory.new}</h2>
          <div className="form-grid">
            <div className="field">
              <label>{t.inventory.name}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.inventory.namePh}
              />
            </div>
            <div className="field">
              <label>{t.inventory.quantity}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="field">
              <label>{t.inventory.lowAt}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={low}
                onChange={(e) => setLow(e.target.value)}
                placeholder="0"
              />
              <div className="row-sub">{t.inventory.lowAtHint}</div>
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn secondary"
              onClick={() => setShowAdd(false)}
            >
              {t.inventory.cancel}
            </button>
            <button type="button" className="btn" onClick={add}>
              {t.inventory.save}
            </button>
          </div>
        </div>
      )}

      <div className="panel">
        {products.length === 0 ? (
          <EmptyState
            icon="📦"
            title={t.inventory.emptyTitle}
            body={t.inventory.emptyBody}
            actionLabel={t.inventory.new}
            onAction={() => setShowAdd(true)}
          />
        ) : (
          <ul className="row-list">
            {products.map((p) => {
              const isLow = p.quantity <= p.low_threshold;
              const editing = editingId === p.id;
              return (
                <li key={p.id} className="stacked">
                  {editing ? (
                    <div>
                      <div className="form-grid">
                        <div className="field">
                          <label>{t.inventory.name}</label>
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        </div>
                        <div className="field">
                          <label>{t.inventory.quantity}</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                          />
                        </div>
                        <div className="field">
                          <label>{t.inventory.lowAt}</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editLow}
                            onChange={(e) => setEditLow(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-actions">
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() => setEditingId(null)}
                        >
                          {t.inventory.cancel}
                        </button>
                        <button type="button" className="btn" onClick={saveEdit}>
                          {t.inventory.save}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="row-main">
                        <div className="row-title">
                          {p.name}
                          {isLow && (
                            <span className="badge waiting" style={{ marginLeft: 8 }}>
                              {t.inventory.low}
                            </span>
                          )}
                        </div>
                        <div className="row-sub">
                          {fmtQty(p.quantity)} {t.inventory.left} ·{" "}
                          {t.inventory.lowAt}: {fmtQty(p.low_threshold)}
                        </div>
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
                        <button
                          type="button"
                          className="btn small secondary"
                          onClick={() => bump(p.id, -1)}
                          aria-label={`${p.name} −1`}
                        >
                          − 1
                        </button>
                        <button
                          type="button"
                          className="btn small secondary"
                          onClick={() => bump(p.id, 1)}
                          aria-label={`${p.name} +1`}
                        >
                          + 1
                        </button>
                        <button
                          type="button"
                          className="btn small secondary"
                          onClick={() => startEdit(p)}
                        >
                          {t.inventory.edit}
                        </button>
                        <button
                          type="button"
                          className="btn danger-ghost small"
                          onClick={() => remove(p.id)}
                        >
                          {t.inventory.delete}
                        </button>
                      </div>
                    </>
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
