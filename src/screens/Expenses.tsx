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
import { daysBetween, normStr } from "../dupes";
import EmptyState from "../components/EmptyState";
import PayMethodSelect from "../components/PayMethodSelect";
import type { Expense, PayMethod, Recurrence } from "../types";
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
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [payMethod, setPayMethod] = useState<PayMethod | null>(null);
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
  // Non-blocking duplicate warning: the matching existing expense, if any.
  const [dupeWarn, setDupeWarn] = useState<Expense | null>(null);

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
    setRecurrence("none");
    setPayMethod(null);
    setEditing(null);
    setShowForm(false);
    setDupeWarn(null);
    resetPhoto();
  };

  const startCreate = () => {
    setDescription("");
    setAmount("");
    setCategory(pack.expense[0]?.id ?? "other");
    setDate(todayISO());
    setRecurrence("none");
    setPayMethod(null);
    setEditing(null);
    setDupeWarn(null);
    resetPhoto();
    setShowForm(true);
  };

  const startEdit = (e: Expense) => {
    setDescription(e.description);
    setAmount(String(e.amount));
    setCategory(e.category);
    setDate(e.date);
    setRecurrence("none");
    setPayMethod(e.pay_method ?? null);
    setEditing(e);
    setDupeWarn(null);
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

  /** Finds an existing expense that looks like a duplicate of the form:
   *  same amount, same normalized description, date within the last 7 days
   *  (including the entered date). Excludes the record being edited. */
  const findExpenseDupe = (): Expense | null => {
    const value = parseFloat(amount);
    if (Number.isNaN(value)) return null;
    const cents = Math.round(value * 100);
    const desc = normStr(description);
    if (!desc) return null;
    const entered = date;
    return (
      expenses.find((e) => {
        if (editing && e.id === editing.id) return false;
        const d = daysBetween(e.date, entered);
        return (
          Math.round(e.amount * 100) === cents &&
          normStr(e.description) === desc &&
          d >= 0 &&
          d <= 7
        );
      }) ?? null
    );
  };

  /** Persists the form. Only called after validation and the duplicate check. */
  const doSave = async () => {
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
        pay_method: payMethod,
      });
    } else {
      const id = await addExpense({
        description: description.trim(),
        amount: rounded,
        category,
        date,
        recurrence,
        pay_method: payMethod,
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

  /** Validates the form, then shows a friendly non-blocking duplicate warning
   *  before saving (never prevents the save — "Save anyway" always works). */
  const save = async () => {
    const value = parseFloat(amount);
    if (!description.trim() || Number.isNaN(value) || value <= 0) return;
    if (!dupeWarn) {
      const dup = findExpenseDupe();
      if (dup) {
        setDupeWarn(dup);
        return;
      }
    }
    await doSave();
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
          {dupeWarn && (
            <div
              role="alert"
              style={{
                background: "var(--amber-light)",
                border: "1px solid var(--amber)",
                borderRadius: 9,
                padding: "12px 14px",
                margin: "4px 0 12px",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px",
                  fontWeight: 600,
                  color: "var(--amber)",
                }}
              >
                ⚠️{" "}
                {t.dupes.warnExpense
                  .replace("{money}", fmtMoney(parseFloat(amount) || 0, lang))
                  .replace("{desc}", description.trim())
                  .replace("{date}", fmtDate(dupeWarn.date, lang))}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="btn" onClick={doSave}>
                  {t.dupes.saveAnyway}
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setDupeWarn(null)}
                >
                  {t.dupes.keepEditing}
                </button>
              </div>
            </div>
          )}
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
                  <div className="row-title">
                    {e.description}
                    {e.recurrence !== "none" && (
                      <span className="badge waiting" style={{ marginLeft: 8 }}>
                        🔁 {t.invoices.recurring}
                      </span>
                    )}
                  </div>
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
