import { useEffect, useState } from "react";
import { useBiz, useLangState } from "../App";
import { openBackup, saveWork } from "../backup";
import { deleteBusiness, getSetting, setSetting } from "../db";
import { businessTypes } from "../data/categories";
import { US_STATES } from "../data/us-states";
import { fmtDate, useLang, useStrings } from "../i18n";
import AddBusinessModal from "../components/AddBusinessModal";
import UpdateDialog from "../components/UpdateDialog";
import { openDonate } from "../components/SupportDialog";
import { checkForAppUpdate } from "../updater";
import type { Update } from "@tauri-apps/plugin-updater";
import type { AccountingMethod, Business, Lang } from "../types";

const APP_VERSION = "0.1.2";

function bizTypeLabel(b: Business, lang: Lang): string {
  if (b.entity_type === "nonprofit") {
    return `💝 ${lang === "es" ? "Organización sin fines de lucro" : "Nonprofit organization"}`;
  }
  const meta = businessTypes.find((x) => x.id === b.type);
  return meta ? `${meta.icon} ${lang === "es" ? meta.es : meta.en}` : b.type;
}

const MONTH_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function Settings({ refresh }: { refresh: () => Promise<void> }) {
  const t = useStrings();
  const lang = useLang();
  const { lang: cur, setLang } = useLangState();
  const {
    businesses,
    active,
    activeId,
    isNonprofit,
    accountingMethod,
    updateActiveBusiness,
    updateActiveNonprofit,
    updateActiveAccountingMethod,
    deleteActiveBusiness,
    resyncAfterRestore,
  } = useBiz();
  const [note, setNote] = useState<{ msg: string; error: boolean } | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [manualUpdate, setManualUpdate] = useState<Update | null>(null);
  const [updateNote, setUpdateNote] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [remindersOn, setRemindersOn] = useState(true);
  const [showAddBiz, setShowAddBiz] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [taxJar, setTaxJar] = useState("25");
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [ein, setEin] = useState("");
  const [fyEnd, setFyEnd] = useState(12);
  const [mission, setMission] = useState("");
  const [nfpSaved, setNfpSaved] = useState(false);

  useEffect(() => {
    getSetting("remindersOn")
      .then((v) => setRemindersOn(v !== "0"))
      .catch(() => undefined);
  }, []);

  // Keep the rename field in sync when the active business changes.
  useEffect(() => {
    setName(active?.name ?? "");
  }, [activeId, active?.name]);

  // Nonprofit fields, stored per business.
  useEffect(() => {
    if (!active) return;
    setEin(active.ein);
    setFyEnd(
      active.fiscal_year_end >= 1 && active.fiscal_year_end <= 12
        ? active.fiscal_year_end
        : 12
    );
    setMission(active.mission);
  }, [activeId, active?.ein, active?.fiscal_year_end, active?.mission]);

  const saveNonprofit = async () => {
    await updateActiveNonprofit({
      ein: ein.trim(),
      fiscal_year_end: fyEnd,
      mission: mission.trim(),
    });
    setNfpSaved(true);
    setTimeout(() => setNfpSaved(false), 2500);
  };

  const monthName = (m: number) =>
    new Date(2000, m - 1, 1).toLocaleString(lang === "es" ? "es" : "en", {
      month: "long",
    });

  // Monthly income goal, stored per business.
  useEffect(() => {
    if (activeId == null) {
      setGoal("");
      return;
    }
    getSetting(`incomeGoal:${activeId}`)
      .then((v) => setGoal(v ?? ""))
      .catch(() => undefined);
  }, [activeId]);

  const saveGoal = () => {
    if (activeId == null) return;
    const v = goal.trim();
    if (v !== "" && (Number.isNaN(parseFloat(v)) || parseFloat(v) < 0)) {
      setGoal("");
      return;
    }
    setSetting(`incomeGoal:${activeId}`, v).catch(() => undefined);
  };

  // Tax-jar percent, stored per business; 25% when empty or invalid.
  useEffect(() => {
    if (activeId == null) {
      setTaxJar("25");
      return;
    }
    getSetting(`taxJarPercent:${activeId}`)
      .then((v) => setTaxJar(v ?? "25"))
      .catch(() => undefined);
  }, [activeId]);

  const saveTaxJar = () => {
    if (activeId == null) return;
    const v = taxJar.trim();
    const n = parseFloat(v);
    if (v === "" || Number.isNaN(n) || n < 0 || n > 100) {
      setTaxJar("25");
      setSetting(`taxJarPercent:${activeId}`, "25").catch(() => undefined);
      return;
    }
    setSetting(`taxJarPercent:${activeId}`, v).catch(() => undefined);
  };

  const loadLastBackupAt = () => {
    getSetting("lastBackupAt")
      .then((v) => setLastBackupAt(v ?? null))
      .catch(() => undefined);
  };

  useEffect(loadLastBackupAt, []);

  const toggleReminders = async () => {
    const next = !remindersOn;
    setRemindersOn(next);
    try {
      await setSetting("remindersOn", next ? "1" : "0");
    } catch {
      // Not fatal — the toggle just won't stick this time.
    }
  };

  const saveName = () => {
    if (!active) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === active.name) {
      setName(active.name);
      return;
    }
    updateActiveBusiness({ name: trimmed, type: active.type, state: active.state }).catch(
      () => setName(active.name)
    );
  };

  const saveType = (type: string) => {
    if (!active || type === active.type) return;
    updateActiveBusiness({ name: active.name, type, state: active.state }).catch(() => undefined);
  };

  const saveState = (state: string) => {
    if (!active || state === active.state) return;
    updateActiveBusiness({ name: active.name, type: active.type, state }).catch(() => undefined);
  };

  const saveMethod = (m: AccountingMethod) => {
    if (m === accountingMethod) return;
    updateActiveAccountingMethod(m).catch(() => undefined);
  };

  const removeBiz = async (b: Business) => {
    if (businesses.length <= 1) return;
    if (!window.confirm(t.settings.confirmDeleteBiz.replace("{name}", b.name))) return;
    setWorking(true);
    try {
      if (b.id === activeId) {
        await deleteActiveBusiness();
      } else {
        await deleteBusiness(b.id);
        await resyncAfterRestore();
      }
    } finally {
      setWorking(false);
    }
  };

  const doSave = async () => {
    setWorking(true);
    setNote(null);
    try {
      const ok = await saveWork();
      if (ok) {
        setNote({ msg: t.settings.saved, error: false });
        loadLastBackupAt();
      }
    } catch {
      setNote({ msg: t.settings.restoreFailed, error: true });
    } finally {
      setWorking(false);
    }
  };

  const doOpen = async () => {
    if (!window.confirm(t.settings.confirmRestore)) return;
    setWorking(true);
    setNote(null);
    try {
      const res = await openBackup();
      if (res === "ok") {
        // Backups can carry different businesses — reload the list,
        // re-pick the active one (stored choice, else the first), refresh.
        await resyncAfterRestore();
        await refresh();
        setNote({ msg: t.settings.restored, error: false });
      } else if (res === "invalid") {
        setNote({ msg: t.settings.restoreFailed, error: true });
      }
    } catch {
      setNote({ msg: t.settings.restoreFailed, error: true });
    } finally {
      setWorking(false);
    }
  };

  const doCheckUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateNote(null);
    try {
      const u = await checkForAppUpdate();
      if (u) {
        setManualUpdate(u);
      } else {
        setUpdateNote(t.updater.upToDate);
      }
    } finally {
      setCheckingUpdate(false);
    }
  };

  const closeManualUpdate = () => {
    // UpdateDialog already released the Rust-side resource on close.
    setManualUpdate(null);
  };

  return (
    <div className="page">
      <h1>⚙️ {t.settings.title}</h1>
      <p className="subtitle">{t.settings.subtitle}</p>

      <div className="panel">
        <div className="settings-row">
          <div>
            <div className="label">{t.settings.language}</div>
          </div>
          <div className="lang-toggle" style={{ background: "var(--blue-light)" }}>
            {(["en", "es"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                className={cur === l ? "active" : ""}
                style={cur === l ? undefined : { color: "var(--blue)" }}
                onClick={() => setLang(l)}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="label">{t.settings.remindersTitle}</div>
            <div className="desc">{t.settings.remindersDesc}</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={remindersOn}
            aria-label={t.settings.remindersTitle}
            className={`switch${remindersOn ? " on" : ""}`}
            onClick={toggleReminders}
          />
        </div>
      </div>

      <div className="panel">
        <h2>🏢 {t.settings.bizTitle}</h2>

        <div className="settings-row">
          <div>
            <div className="label">{t.settings.businessName}</div>
          </div>
          <div className="field" style={{ minWidth: 220 }}>
            <input
              type="text"
              value={name}
              maxLength={80}
              placeholder={t.settings.businessName}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
            />
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="label">{t.settings.entityType}</div>
            <div className="desc">
              {isNonprofit ? t.nonprofit.entityNonprofit : t.nonprofit.entityForProfit}
            </div>
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="label">{t.settings.businessState}</div>
          </div>
          <div className="field" style={{ minWidth: 220 }}>
            <select value={active?.state ?? ""} onChange={(e) => saveState(e.target.value)}>
              <option value="" disabled>
                {t.onboarding.statePh}
              </option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Trade type applies to for-profits only — nonprofits use the
            nonprofit category pack. */}
        {!isNonprofit && (
          <div className="settings-row">
            <div>
              <div className="label">{t.settings.businessType}</div>
            </div>
            <div className="field" style={{ minWidth: 220 }}>
              <select value={active?.type ?? "freelancer"} onChange={(e) => saveType(e.target.value)}>
                {businessTypes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.icon} {lang === "es" ? b.es : b.en}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {isNonprofit && (
          <>
            <div className="settings-row">
              <div>
                <div className="label">{t.nonprofit.ein}</div>
                <div className="desc">{t.nonprofit.einDesc}</div>
              </div>
              <div className="field" style={{ minWidth: 220 }}>
                <input
                  type="text"
                  value={ein}
                  maxLength={12}
                  placeholder="12-3456789"
                  aria-label={t.nonprofit.ein}
                  onChange={(e) => setEin(e.target.value)}
                  onBlur={saveNonprofit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  }}
                />
              </div>
            </div>

            <div className="settings-row">
              <div>
                <div className="label">{t.nonprofit.fiscalYearEnd}</div>
                <div className="desc">{t.nonprofit.fiscalYearEndDesc}</div>
              </div>
              <div className="field" style={{ minWidth: 220 }}>
                <select
                  value={fyEnd}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    setFyEnd(m);
                    updateActiveNonprofit({
                      ein: ein.trim(),
                      fiscal_year_end: m,
                      mission: mission.trim(),
                    }).catch(() => undefined);
                  }}
                >
                  {MONTH_KEYS.map((m) => (
                    <option key={m} value={m}>
                      {monthName(m)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="settings-row">
              <div>
                <div className="label">{t.nonprofit.mission}</div>
                <div className="desc">{t.nonprofit.missionDesc}</div>
              </div>
              <div className="field" style={{ minWidth: 220 }}>
                <textarea
                  value={mission}
                  rows={3}
                  maxLength={500}
                  aria-label={t.nonprofit.mission}
                  onChange={(e) => setMission(e.target.value)}
                  onBlur={saveNonprofit}
                />
              </div>
            </div>

            {nfpSaved && <p className="status-note">✓ {t.settings.nonprofitSaved}</p>}
          </>
        )}

        {!isNonprofit && (
          <div className="settings-row">
            <div>
              <div className="label">🎯 {t.settings.incomeGoal}</div>
            </div>
            <div className="field" style={{ minWidth: 220 }}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={goal}
                placeholder="0.00"
                aria-label={t.settings.incomeGoal}
                onChange={(e) => setGoal(e.target.value)}
                onBlur={saveGoal}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
              />
            </div>
          </div>
        )}

        {/* The tax-savings jar is a for-profit tool — nonprofits don't pay
            income tax on their revenue. */}
        {!isNonprofit && (
          <div className="settings-row">
            <div>
              <div className="label">🏦 {t.settings.taxJarTitle}</div>
              <div className="desc">{t.settings.taxJarDesc}</div>
            </div>
          <div className="field" style={{ minWidth: 220 }}>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={taxJar}
              placeholder="25"
              aria-label={t.settings.taxJarPercent}
              onChange={(e) => setTaxJar(e.target.value)}
              onBlur={saveTaxJar}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
            />
          </div>
        </div>
        )}

        <ul className="row-list biz-list">
          {businesses.map((b) => (
            <li key={b.id}>
              <div className="row-main">
                <div className="row-title">
                  {b.name}
                  {b.id === activeId && (
                    <span className="badge waiting" style={{ marginLeft: 8 }}>
                      ✓
                    </span>
                  )}
                </div>
                <div className="row-sub">{bizTypeLabel(b, lang)}</div>
              </div>
              <button
                type="button"
                className="btn danger-ghost small"
                disabled={working || businesses.length <= 1}
                title={businesses.length <= 1 ? t.settings.lastBizNote : undefined}
                onClick={() => removeBiz(b)}
              >
                {t.settings.deleteBiz}
              </button>
            </li>
          ))}
        </ul>

        <div className="form-actions" style={{ justifyContent: "flex-start" }}>
          <button type="button" className="btn secondary" onClick={() => setShowAddBiz(true)}>
            {t.settings.addBusiness}
          </button>
        </div>
        {showAddBiz && <AddBusinessModal onClose={() => setShowAddBiz(false)} />}
      </div>

      <div className="panel">
        <h2>📒 {t.settings.acctTitle}</h2>
        <div className="radio-cards">
          <button
            type="button"
            className={`radio-card${accountingMethod === "cash" ? " selected" : ""}`}
            aria-pressed={accountingMethod === "cash"}
            onClick={() => saveMethod("cash")}
          >
            <div className="radio-title">{t.settings.acctCash}</div>
            <div className="desc">{t.settings.acctCashDesc}</div>
          </button>
          <button
            type="button"
            className={`radio-card${accountingMethod === "accrual" ? " selected" : ""}`}
            aria-pressed={accountingMethod === "accrual"}
            onClick={() => saveMethod("accrual")}
          >
            <div className="radio-title">{t.settings.acctAccrual}</div>
            <div className="desc">{t.settings.acctAccrualDesc}</div>
          </button>
        </div>
        <p className="disclaimer">{t.settings.acctGuidance}</p>
      </div>

      <div className="panel">
        <h2>💾 {t.settings.backupTitle}</h2>
        <div className="settings-row">
          <div>
            <div className="label">{t.settings.saveWork}</div>
            <div className="desc">{t.settings.saveWorkDesc}</div>
          </div>
          <button type="button" className="btn secondary" disabled={working} onClick={doSave}>
            {working ? t.settings.working : t.settings.saveWork}
          </button>
        </div>
        <div className="settings-row">
          <div>
            <div className="label">{t.settings.openBackup}</div>
            <div className="desc">{t.settings.openBackupDesc}</div>
          </div>
          <button type="button" className="btn secondary" disabled={working} onClick={doOpen}>
            {working ? t.settings.working : t.settings.openBackup}
          </button>
        </div>
        <p className="desc" style={{ margin: "8px 0 0" }}>
          {lastBackupAt
            ? t.settings.lastBackup.replace("{date}", fmtDate(lastBackupAt.slice(0, 10), lang))
            : t.settings.neverBackedUp}
        </p>
        {note && <p className={`status-note${note.error ? " error" : ""}`}>{note.msg}</p>}
      </div>

      <div className="panel">
        <h2>ℹ️ {t.settings.about}</h2>
        <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>{t.settings.aboutText}</p>
        <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>{t.settings.donateDesc}</p>
        <button type="button" className="btn small" onClick={openDonate}>
          {t.settings.donate}
        </button>
        <p className="disclaimer">{t.settings.disclaimer}</p>
        <div className="settings-row" style={{ marginTop: 8 }}>
          <div>
            <div className="label">{t.updater.checkNow}</div>
            <div className="desc">
              {t.settings.version} {APP_VERSION} · MIT
            </div>
          </div>
          <button
            type="button"
            className="btn secondary"
            disabled={checkingUpdate}
            onClick={doCheckUpdate}
          >
            {checkingUpdate ? t.updater.checking : t.updater.checkNow}
          </button>
        </div>
        {updateNote && <p className="status-note">{updateNote}</p>}
      </div>
      {manualUpdate && (
        <UpdateDialog update={manualUpdate} onDone={closeManualUpdate} />
      )}
    </div>
  );
}
