import { useEffect, useMemo, useRef, useState } from "react";
import { useBiz } from "../App";
import { addExpense, deleteExpense, setExpensePhoto, updateExpense } from "../db";
import {
  deleteReceiptPhoto,
  fileToDownscaledDataUrl,
  isTauri,
  pickImageBytes,
  receiptPhotoUrl,
  saveReceiptPhoto,
  type PickedImage,
} from "../photos";
import { fmtDate, fmtMoney, todayISO, useLang, useStrings } from "../i18n";
import EmptyState from "../components/EmptyState";
import type { Expense } from "../types";
import CsvImport from "./CsvImport";

interface Props {
  expenses: Expense[];
  refresh: () => Promise<void>;
}

/** Resolves a stored photo value to a displayable thumbnail. */
function PhotoThumb({
  stored,
  onOpen,
}: {
  stored: string | null;
  onOpen: (url: string) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    receiptPhotoUrl(stored).then((u) => {
      if (live) setUrl(u);
    });
    return () => {
      live = false;
    };
  }, [stored]);
  if (!url) return null;
  return (
    <img
      src={url}
      className="receipt-thumb"
      alt=""
      onClick={(e) => {
        e.stopPropagation();
        onOpen(url);
      }}
    />
  );
}

export default function Expenses({ expenses, refresh }: Props) {
  const t = useStrings();
  const lang = useLang();
  const { pack } = useBiz();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(pack.expense[0]?.id ?? "other");
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  // Receipt photo state.
  const [photoCurrent, setPhotoCurrent] = useState<string | null>(null);
  const [photoNew, setPhotoNew] = useState<PickedImage | null>(null);
  const [photoNewUrl, setPhotoNewUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoCleared, setPhotoCleared] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const browserFileInput = useRef<HTMLInputElement>(null);

  const catLabel = (id: string) => {
    const c = pack.expense.find((x) => x.id === id);
    return c ? (lang === "es" ? c.es : c.en) : t.expenses.other;
  };

  const resetPhoto = () => {
    setPhotoCurrent(null);
    setPhotoNew(null);
    setPhotoNewUrl(null);
    setPhotoPreview(null);
    setPhotoCleared(false);
  };

  const reset = () => {
    setDescription("");
    setAmount("");
    setCategory(pack.expense[0]?.id ?? "other");
    setDate(todayISO());
    setEditing(null);
    setShowForm(false);
    resetPhoto();
  };

  const startCreate = () => {
    setDescription("");
    setAmount("");
    setCategory(pack.expense[0]?.id ?? "other");
    setDate(todayISO());
    setEditing(null);
    resetPhoto();
    setShowForm(true);
  };

  const startEdit = (e: Expense) => {
    setDescription(e.description);
    setAmount(String(e.amount));
    setCategory(e.category);
    setDate(e.date);
    setEditing(e);
    setPhotoCurrent(e.photo);
    setPhotoNew(null);
    setPhotoNewUrl(null);
    setPhotoCleared(false);
    setPhotoPreview(null);
    if (e.photo) receiptPhotoUrl(e.photo).then(setPhotoPreview);
    setShowForm(true);
  };

  const attachPhoto = async () => {
    if (isTauri()) {
      const img = await pickImageBytes();
      if (!img) return;
      setPhotoNew(img);
      setPhotoNewUrl(null);
      setPhotoCleared(false);
      setPhotoPreview(URL.createObjectURL(new Blob([img.bytes as BlobPart])));
    } else {
      browserFileInput.current?.click();
    }
  };

  const onBrowserPhoto = async (f: File | undefined) => {
    if (!f) return;
    try {
      const url = await fileToDownscaledDataUrl(f);
      setPhotoNewUrl(url);
      setPhotoNew(null);
      setPhotoCleared(false);
      setPhotoPreview(url);
    } catch {
      // Ignore unreadable files.
    }
  };

  const clearPhoto = () => {
    setPhotoNew(null);
    setPhotoNewUrl(null);
    setPhotoPreview(null);
    setPhotoCleared(true);
  };

  const save = async () => {
    const value = parseFloat(amount);
    if (!description.trim() || Number.isNaN(value) || value <= 0) return;
    const rounded = Math.round(value * 100) / 100;
    if (editing) {
      let finalPhoto = photoCurrent;
      if (photoCleared) {
        await deleteReceiptPhoto(photoCurrent);
        finalPhoto = null;
      } else if (photoNew || photoNewUrl) {
        await deleteReceiptPhoto(photoCurrent);
        if (isTauri() && photoNew) {
          finalPhoto = await saveReceiptPhoto(editing.id, photoNew);
        } else if (photoNewUrl) {
          finalPhoto = photoNewUrl;
        }
      }
      await updateExpense(editing.id, {
        description: description.trim(),
        amount: rounded,
        category,
        date,
        photo: finalPhoto,
      });
    } else {
      const id = await addExpense({
        description: description.trim(),
        amount: rounded,
        category,
        date,
      });
      if (isTauri() && photoNew) {
        await setExpensePhoto(id, await saveReceiptPhoto(id, photoNew));
      } else if (photoNewUrl) {
        await setExpensePhoto(id, photoNewUrl);
      }
    }
    reset();
    await refresh();
  };

  const remove = async (e: Expense) => {
    if (!window.confirm(t.expenses.confirmDelete)) return;
    await deleteReceiptPhoto(e.photo);
    await deleteExpense(e.id);
    await refresh();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((e) => {
      if (q && !e.description.toLowerCase().includes(q)) return false;
      if (catFilter !== "all" && e.category !== catFilter) return false;
      return true;
    });
  }, [expenses, search, catFilter]);

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>💸 {t.expenses.title}</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              setShowImport(!showImport);
              setShowForm(false);
            }}
          >
            🏦 {t.expenses.importCsv}
          </button>
          <button type="button" className="btn" onClick={startCreate}>
            {t.expenses.add}
          </button>
        </div>
      </div>

      {showImport && (
        <CsvImport
          expenses={expenses}
          onDone={refresh}
          onClose={() => setShowImport(false)}
        />
      )}

      {showForm && (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>
            {editing ? t.expenses.editTitle : t.expenses.add}
          </h2>
          <div className="form-grid">
            <div className="field full">
              <label>{t.expenses.description}</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.expenses.descriptionPh}
              />
            </div>
            <div className="field">
              <label>{t.expenses.amount}</label>
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
              <label>{t.expenses.date}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="field full">
              <label>{t.expenses.category}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {pack.expense.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === "es" ? c.es : c.en}
                  </option>
                ))}
              </select>
            </div>
            <div className="field full">
              <label>{t.expenses.receiptPhoto}</label>
              {photoPreview ? (
                <div className="photo-row">
                  <img src={photoPreview} className="receipt-preview" alt="" />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      className="btn small secondary"
                      onClick={attachPhoto}
                    >
                      {t.expenses.changePhoto}
                    </button>
                    <button
                      type="button"
                      className="btn small danger-ghost"
                      onClick={clearPhoto}
                    >
                      {t.expenses.removePhoto}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn secondary"
                  onClick={attachPhoto}
                >
                  📷 {t.expenses.attachPhoto}
                </button>
              )}
              <input
                ref={browserFileInput}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => onBrowserPhoto(e.target.files?.[0])}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn secondary" onClick={reset}>
              {t.expenses.cancel}
            </button>
            <button type="button" className="btn" onClick={save}>
              {editing ? t.expenses.saveChanges : t.expenses.save}
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
              placeholder={t.expenses.searchPh}
              aria-label={t.expenses.searchPh}
            />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 150 }}>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              aria-label={t.expenses.category}
            >
              <option value="all">{t.expenses.allCategories}</option>
              {pack.expense.map((c) => (
                <option key={c.id} value={c.id}>
                  {lang === "es" ? c.es : c.en}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="💸"
            title={t.expenses.emptyTitle}
            body={t.expenses.emptyBody}
            actionLabel={t.expenses.add}
            onAction={startCreate}
          />
        ) : (
          <ul className="row-list">
            {filtered.map((e) => (
              <li key={e.id}>
                {e.photo && <PhotoThumb stored={e.photo} onOpen={setViewingPhoto} />}
                <div className="row-main">
                  <div className="row-title">{e.description}</div>
                  <div className="row-sub">
                    {catLabel(e.category)} · {fmtDate(e.date, lang)}
                  </div>
                </div>
                <span className="row-amount negative">-{fmtMoney(e.amount, lang)}</span>
                <button
                  type="button"
                  className="btn small secondary"
                  onClick={() => startEdit(e)}
                >
                  {t.expenses.edit}
                </button>
                <button
                  type="button"
                  className="btn danger-ghost small"
                  onClick={() => remove(e)}
                >
                  {t.expenses.delete}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {viewingPhoto && (
        <div className="modal-overlay" onClick={() => setViewingPhoto(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <img src={viewingPhoto} className="receipt-full" alt="" />
            <div className="form-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setViewingPhoto(null)}
              >
                {t.expenses.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
