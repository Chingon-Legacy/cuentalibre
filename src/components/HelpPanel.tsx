import { useStrings } from "../i18n";

/**
 * The "?" help panel: plain-words explanations of every screen,
 * plus what sales tax is and how backups work. All bilingual.
 */
export default function HelpPanel({ onClose }: { onClose: () => void }) {
  const t = useStrings();
  const sections: { title: string; body: string }[] = [
    { title: t.help.homeT, body: t.help.homeB },
    { title: t.help.invoicesT, body: t.help.invoicesB },
    { title: t.help.quotesT, body: t.help.quotesB },
    { title: t.help.billsT, body: t.help.billsB },
    { title: t.help.expensesT, body: t.help.expensesB },
    { title: t.help.servicesT, body: t.help.servicesB },
    { title: t.help.timeT, body: t.help.timeB },
    { title: t.help.mileageT, body: t.help.mileageB },
    { title: t.help.customersT, body: t.help.customersB },
    { title: t.help.contractorsT, body: t.help.contractorsB },
    { title: t.help.loansT, body: t.help.loansB },
    { title: t.help.donationsT, body: t.help.donationsB },
    { title: t.help.donorsT, body: t.help.donorsB },
    { title: t.help.reportsT, body: t.help.reportsB },
    { title: t.help.taxT, body: t.help.taxB },
    { title: t.help.nfpT, body: t.help.nfpB },
    { title: t.help.backupT, body: t.help.backupB },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t.help.title}>
        <div className="modal-pad">
          <div className="toolbar">
            <h2 style={{ margin: 0 }}>❓ {t.help.title}</h2>
            <button type="button" className="btn small secondary" onClick={onClose}>
              ✕ {t.help.close}
            </button>
          </div>
          {sections.map((s) => (
            <div className="help-section" key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
          <div className="form-actions">
            <button type="button" className="btn" onClick={onClose}>
              {t.help.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
