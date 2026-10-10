import { useEffect, useState } from "react";
import { useBiz, useLangState } from "../App";
import { openBackup, saveWork } from "../backup";
import { deleteBusiness, getSetting, setSetting } from "../db";
import { businessTypes } from "../data/categories";
import { US_STATES } from "../data/us-states";
import { useLang, useStrings } from "../i18n";
import AddBusinessModal from "../components/AddBusinessModal";
import type { Business, Lang } from "../types";

const APP_VERSION = "0.1.0";

function bizTypeLabel(b: Business, lang: Lang): string {
  const meta = businessTypes.find((x) => x.id === b.type);
  return meta ? `${meta.icon} ${lang === "es" ? meta.es : meta.en}` : b.type;
}

export default function Settings({ refresh }: { refresh: () => Promise<void> }) {
  const t = useStrings();
  const lang = useLang();
  const { lang: cur, setLang } = useLangState();
  const {
    businesses,
    active,
    activeId,
    updateActiveBusiness,
    deleteActiveBusiness,
    resyncAfterRestore,
  } = useBiz();
  const [note, setNote] = useState<{ msg: string; error: boolean } | null>(null);
  const [working, setWorking] = useState(false);
  const [remindersOn, setRemindersOn] = useState(true);
  const [showAddBiz, setShowAddBiz] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    getSetting("remindersOn")
      .then((v) => setRemindersOn(v !== "0"))
      .catch(() => undefined);
  }, []);

  // Keep the rename field in sync when the active business changes.
  useEffect(() => {
    setName(active?.name ?? "");
  }, [activeId, active?.name]);

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
      if (ok) setNote({ msg: t.settings.saved, error: false });
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

  return (
    <div className="page">
      <h1>⚙️ {t.settings.title}</h1>
      <p className="subtitle">&nbsp;</p>

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
        {note && <p className={`status-note${note.error ? " error" : ""}`}>{note.msg}</p>}
      </div>

      <div className="panel">
        <h2>ℹ️ {t.settings.about}</h2>
        <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>{t.settings.aboutText}</p>
        <p className="disclaimer">{t.settings.disclaimer}</p>
        <p style={{ color: "var(--ink-faint)", fontSize: 13 }}>
          {t.settings.version} {APP_VERSION} · MIT
        </p>
      </div>
    </div>
  );
}
