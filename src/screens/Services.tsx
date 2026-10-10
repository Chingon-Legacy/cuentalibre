import { useState } from "react";
import { addService, deleteService, updateService } from "../db";
import { fmtMoney, useLang, useStrings } from "../i18n";
import EmptyState from "../components/EmptyState";
import type { Service } from "../types";

interface Props {
  services: Service[];
  refresh: () => Promise<void>;
}

export default function Services({ services, refresh }: Props) {
  const t = useStrings();
  const lang = useLang();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const reset = () => {
    setName("");
    setPrice("");
    setEditing(null);
    setShowForm(false);
  };

  const startCreate = () => {
    reset();
    setShowForm(true);
  };

  const startEdit = (s: Service) => {
    setName(s.name);
    setPrice(String(s.price));
    setEditing(s);
    setShowForm(true);
  };

  const save = async () => {
    const value = parseFloat(price);
    if (!name.trim() || Number.isNaN(value) || value <= 0) return;
    const rounded = Math.round(value * 100) / 100;
    if (editing) {
      await updateService(editing.id, { name: name.trim(), price: rounded });
    } else {
      await addService({ name: name.trim(), price: rounded });
    }
    reset();
    await refresh();
  };

  const remove = async (id: number) => {
    if (!window.confirm(t.services.confirmDelete)) return;
    await deleteService(id);
    await refresh();
  };

  return (
    <div className="page">
      <div className="toolbar">
        <h1 style={{ margin: 0 }}>🏷️ {t.services.title}</h1>
        <button type="button" className="btn" onClick={startCreate}>
          {t.services.new}
        </button>
      </div>

      {showForm && (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>
            {editing ? t.services.saveChanges : t.services.new}
          </h2>
          <div className="form-grid">
            <div className="field">
              <label>{t.services.name}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.services.namePh}
              />
            </div>
            <div className="field">
              <label>{t.services.price}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn secondary" onClick={reset}>
              {t.services.cancel}
            </button>
            <button type="button" className="btn" onClick={save}>
              {editing ? t.services.saveChanges : t.services.create}
            </button>
          </div>
        </div>
      )}

      <div className="panel">
        {services.length === 0 ? (
          <EmptyState
            icon="🏷️"
            title={t.services.emptyTitle}
            body={t.services.emptyBody}
            actionLabel={t.services.new}
            onAction={startCreate}
          />
        ) : (
          <ul className="row-list">
            {services.map((s) => (
              <li key={s.id}>
                <div className="row-main">
                  <div className="row-title">{s.name}</div>
                </div>
                <span className="row-amount">{fmtMoney(s.price, lang)}</span>
                <button
                  type="button"
                  className="btn small secondary"
                  onClick={() => startEdit(s)}
                >
                  {t.services.edit}
                </button>
                <button
                  type="button"
                  className="btn danger-ghost small"
                  onClick={() => remove(s.id)}
                >
                  {t.services.delete}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
