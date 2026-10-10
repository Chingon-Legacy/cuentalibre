import { useState } from "react";
import { useBiz, useBizName, useLangState } from "../App";
import { openBackup, saveWork } from "../backup";
import { getSetting } from "../db";
import { businessTypes } from "../data/categories";
import { US_STATES } from "../data/us-states";
import { useLang, useStrings } from "../i18n";
import type { Lang } from "../types";

const APP_VERSION = "0.1.0";

export default function Settings({ refresh }: { refresh: () => Promise<void> }) {
  const t = useStrings();
  const lang = useLang();
  const { lang: cur, setLang } = useLangState();
  const { biz, setBiz } = useBiz();
  const { stateCode, setStateCode } = useBiz();
  const { bizName, setBizName } = useBizName();
  const [note, setNote] = useState<{ msg: string; error: boolean } | null>(null);
  const [working, setWorking] = useState(false);

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
        await refresh();
        const saved = await getSetting("businessType");
        if (saved) setBiz(saved);
        const savedName = await getSetting("businessName");
        if (savedName) setBizName(savedName);
        const savedState = await getSetting("businessState");
        if (savedState) setStateCode(savedState);
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
            <div className="label">{t.settings.businessName}</div>
          </div>
          <div className="field" style={{ minWidth: 220 }}>
            <input
              type="text"
              value={bizName}
              maxLength={80}
              placeholder={t.settings.businessName}
              onChange={(e) => setBizName(e.target.value)}
            />
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="label">{t.settings.businessState}</div>
          </div>
          <div className="field" style={{ minWidth: 220 }}>
            <select value={stateCode} onChange={(e) => setStateCode(e.target.value)}>
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
            <select value={biz} onChange={(e) => setBiz(e.target.value)}>
              {businessTypes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.icon} {lang === "es" ? b.es : b.en}
                </option>
              ))}
            </select>
          </div>
        </div>
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
