import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { LangProvider, strings, useStrings, type Strings } from "./i18n";
import {
  addBusiness,
  deleteBusiness,
  getBills,
  getBusinesses,
  getContractorPayments,
  getContractors,
  getDonations,
  getLoans,
  getLoanPayments,
  getExpenses,
  getInvoices,
  getQuotes,
  getServices,
  getSetting,
  getTimeEntries,
  getTrips,
  initDb,
  setActiveBusinessId,
  setSetting,
  updateBusiness,
  updateNonprofitFields,
  generateRecurringExpenses,
  generateRecurringInvoices,
} from "./db";
import { getPack } from "./data/categories";
import type { CategoryPack } from "./data/categories/types";
import type {
  Bill,
  Business,
  Contractor,
  ContractorPayment,
  Donation,
  EntityType,
  Expense,
  Invoice,
  Lang,
  Loan,
  LoanPayment,
  Quote,
  Screen,
  Service,
  TimeEntry,
  Trip,
} from "./types";
import { checkDueReminders, type ReminderStrings } from "./notify";
import Tour, { type TourStep } from "./components/Tour";
import HelpPanel from "./components/HelpPanel";
import MoreMenu, { type MoreMenuItem } from "./components/MoreMenu";
import AddBusinessModal from "./components/AddBusinessModal";
import Onboarding from "./screens/Onboarding";
import Home from "./screens/Home";
import Invoices from "./screens/Invoices";
import Quotes from "./screens/Quotes";
import Bills from "./screens/Bills";
import Expenses from "./screens/Expenses";
import Services from "./screens/Services";
import Time from "./screens/Time";
import Mileage from "./screens/Mileage";
import Customers from "./screens/Customers";
import Contractors from "./screens/Contractors";
import Loans from "./screens/Loans";
import Donations from "./screens/Donations";
import Donors from "./screens/Donors";
import Reports from "./screens/Reports";
import Settings from "./screens/Settings";

/* ---------- shared contexts ---------- */

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangStateContext = createContext<LangState>({
  lang: "en",
  setLang: () => undefined,
});

export function useLangState(): LangState {
  return useContext(LangStateContext);
}

export interface BizState {
  /** Every business the user owns. */
  businesses: Business[];
  /** The id of the business whose data is on screen. */
  activeId: number | null;
  /** The active business row, or null while loading. */
  active: Business | null;
  /** Switch to another business (persists the choice, refreshes data). */
  switchBusiness: (id: number) => Promise<void>;
  /** Create a business and switch to it. */
  addBusinessFlow: (name: string, type: string, state: string, entityType?: EntityType) => Promise<Business>;
  /** Rename / retype / restate the active business. */
  updateActiveBusiness: (input: { name: string; type: string; state: string }) => Promise<void>;
  /** Update the active nonprofit's EIN, fiscal year end, and mission. */
  updateActiveNonprofit: (input: { ein: string; fiscal_year_end: number; mission: string }) => Promise<void>;
  /** Delete the active business and everything in it (only when >1 exist). */
  deleteActiveBusiness: () => Promise<void>;
  /** After a backup restore: reload businesses, re-pick active, refresh data. */
  resyncAfterRestore: () => Promise<void>;
  // Backwards-compatible shorthands so screens keep working.
  /** Active business's type id (selects the category pack). */
  biz: string;
  /** Active business's state code. */
  stateCode: string;
  /** True when the active business is a nonprofit organization. */
  isNonprofit: boolean;
  /** Active business's category pack. */
  pack: CategoryPack;
  /** Active business's display name. */
  bizName: string;
}

const BizContext = createContext<BizState>({
  businesses: [],
  activeId: null,
  active: null,
  switchBusiness: async () => undefined,
  addBusinessFlow: async () => {
    throw new Error("businesses not ready");
  },
  updateActiveBusiness: async () => undefined,
  updateActiveNonprofit: async () => undefined,
  deleteActiveBusiness: async () => undefined,
  resyncAfterRestore: async () => undefined,
  biz: "freelancer",
  stateCode: "",
  isNonprofit: false,
  pack: getPack("freelancer"),
  bizName: "",
});

export function useBiz(): BizState {
  return useContext(BizContext);
}

/* ---------- header / nav ---------- */

const NAV_ITEMS: {
  id: Screen;
  icon: string;
  label: (t: Strings) => string;
  nonprofitOnly?: boolean;
}[] = [
  { id: "home", icon: "🏠", label: (t) => t.nav.home },
  { id: "invoices", icon: "🧾", label: (t) => t.nav.invoices },
  { id: "quotes", icon: "📝", label: (t) => t.nav.quotes },
  { id: "bills", icon: "📄", label: (t) => t.nav.bills },
  { id: "expenses", icon: "💸", label: (t) => t.nav.expenses },
  { id: "services", icon: "🏷️", label: (t) => t.nav.services },
  { id: "time", icon: "⏱️", label: (t) => t.nav.time },
  { id: "mileage", icon: "🚗", label: (t) => t.nav.mileage },
  { id: "customers", icon: "👥", label: (t) => t.nav.customers },
  { id: "donations", icon: "❤️", label: (t) => t.nav.donations, nonprofitOnly: true },
  { id: "donors", icon: "🙏", label: (t) => t.nav.donors, nonprofitOnly: true },
  { id: "contractors", icon: "🤝", label: (t) => t.nav.contractors },
  { id: "loans", icon: "🏦", label: (t) => t.nav.loans },
  { id: "reports", icon: "📊", label: (t) => t.nav.reports },
  { id: "settings", icon: "⚙️", label: (t) => t.nav.settings },
];

/**
 * Screens that are always visible in the nav bar. "donations" is appended
 * for nonprofits only — it is handled separately in Shell because it is
 * nonprofitOnly.
 */
const PRIMARY_IDS: Screen[] = ["home", "invoices", "expenses", "reports"];

function LangToggle() {
  const { lang, setLang } = useLangState();
  return (
    <div className="lang-toggle" role="group" aria-label="Language / Idioma">
      {(["en", "es"] as Lang[]).map((l) => (
        <button
          key={l}
          className={lang === l ? "active" : ""}
          onClick={() => setLang(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/** Header brand: a business switcher when there are several, the plain name when one. */
function Brand() {
  const t = useStrings();
  const { businesses, activeId, bizName, switchBusiness } = useBiz();
  const [showAdd, setShowAdd] = useState(false);

  if (businesses.length > 1) {
    return (
      <div className="brand">
        <span className="brand-mark">CL</span>
        <select
          className="biz-switcher"
          value={showAdd ? "__add" : String(activeId ?? "")}
          aria-label={t.header.addBusiness}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "__add") {
              setShowAdd(true);
            } else {
              switchBusiness(Number(v)).catch(() => undefined);
            }
          }}
        >
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
          <option value="__add">{t.header.addBusiness}</option>
        </select>
        {showAdd && <AddBusinessModal onClose={() => setShowAdd(false)} />}
      </div>
    );
  }

  return (
    <div className="brand">
      <span className="brand-mark">CL</span>
      <span>
        {bizName || "CuentaLibre"}
        <div className="tagline">{bizName ? "CuentaLibre" : t.tagline}</div>
      </span>
    </div>
  );
}

interface AppData {
  invoices: Invoice[];
  expenses: Expense[];
  bills: Bill[];
  quotes: Quote[];
  contractors: Contractor[];
  contractorPayments: ContractorPayment[];
  loans: Loan[];
  loanPayments: LoanPayment[];
  services: Service[];
  timeEntries: TimeEntry[];
  trips: Trip[];
  donations: Donation[];
}

const EMPTY_DATA: AppData = {
  invoices: [],
  expenses: [],
  bills: [],
  quotes: [],
  contractors: [],
  contractorPayments: [],
  loans: [],
  loanPayments: [],
  services: [],
  timeEntries: [],
  trips: [],
  donations: [],
};

function Shell({
  data,
  refresh,
  ready,
}: {
  data: AppData;
  refresh: () => Promise<void>;
  ready: boolean;
}) {
  const t = useStrings();
  const [screen, setScreen] = useState<Screen>("home");
  const [helpOpen, setHelpOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false); // desktop dropdown
  const [sheetOpen, setSheetOpen] = useState(false); // mobile bottom sheet
  const moreWrapRef = useRef<HTMLDivElement>(null);
  const { isNonprofit } = useBiz();

  // Nonprofit-only screens (Donations, Donors) appear only for nonprofits.
  // Primary nav stays short: home, invoices, expenses, reports
  // (+ donations for nonprofits). Everything else lives in the More menu.
  const navItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.nonprofitOnly || isNonprofit),
    [isNonprofit]
  );
  const primaryItems = useMemo(
    () =>
      navItems.filter(
        (item) =>
          PRIMARY_IDS.includes(item.id) || (item.id === "donations" && isNonprofit)
      ),
    [navItems, isNonprofit]
  );
  const moreNavItems = useMemo(
    () =>
      navItems.filter(
        (item) =>
          !PRIMARY_IDS.includes(item.id) && !(item.id === "donations" && isNonprofit)
      ),
    [navItems, isNonprofit]
  );

  // The More menu tiles: icon + label + one warm line, in both languages.
  const moreMenuItems: MoreMenuItem[] = useMemo(
    () =>
      moreNavItems.map((item) => ({
        id: item.id,
        icon: item.icon,
        label: item.label(t),
        desc: t.moreDesc[item.id as keyof typeof t.moreDesc],
      })),
    [moreNavItems, t]
  );

  /** True when the current screen lives inside the More menu. */
  const moreActive = useMemo(
    () => moreNavItems.some((item) => item.id === screen),
    [moreNavItems, screen]
  );

  const selectScreen = useCallback((id: Screen) => {
    setScreen(id);
    setMoreOpen(false);
    setSheetOpen(false);
  }, []);

  // Close the desktop dropdown when tapping anywhere outside it.
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => {
      if (moreWrapRef.current && !moreWrapRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [moreOpen]);

  // Switching between a for-profit and a nonprofit can hide the current
  // screen — fall back to Home so nobody lands on a blank page.
  useEffect(() => {
    if (!navItems.some((item) => item.id === screen)) setScreen("home");
  }, [navItems, screen]);

  // Friendly guide mode: show the tour once, unless it was seen or skipped.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getSetting("tourSeen")
      .then((seen) => {
        if (!cancelled && seen !== "1") setTourOpen(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [ready]);

  const closeTour = useCallback(async () => {
    setTourOpen(false);
    try {
      await setSetting("tourSeen", "1");
    } catch {
      // Not fatal — the tour just shows again next launch.
    }
  }, []);

  const tourSteps: TourStep[] = useMemo(
    () => [
      {
        selector: ".main-nav, .mobile-nav",
        title: t.tour.stepNavT,
        body: t.tour.stepNavB,
      },
      {
        selector: ".stat-grid",
        title: t.tour.stepTotalsT,
        body: t.tour.stepTotalsB,
      },
      {
        selector: ".tour-new-invoice",
        title: t.tour.stepNewInvoiceT,
        body: t.tour.stepNewInvoiceB,
      },
      {
        selector: ".app-header .lang-toggle",
        title: t.tour.stepLangT,
        body: t.tour.stepLangB,
      },
      {
        selector: ".help-btn",
        title: t.tour.stepHelpT,
        body: t.tour.stepHelpB,
      },
    ],
    [t]
  );

  return (
    <>
      <header className="app-header">
        <Brand />
        <nav className="main-nav">
          {primaryItems.map((item) => (
            <button
              key={item.id}
              className={`nav-btn${screen === item.id ? " active" : ""}`}
              onClick={() => setScreen(item.id)}
            >
              {item.label(t)}
            </button>
          ))}
        </nav>
        <div className="more-wrap" ref={moreWrapRef}>
          <button
            type="button"
            className={`nav-btn${moreOpen || moreActive ? " active" : ""}`}
            onClick={() => setMoreOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
          >
            <span aria-hidden="true">⋯</span> {t.nav.more}
          </button>
          {moreOpen && (
            <MoreMenu
              variant="dropdown"
              items={moreMenuItems}
              current={screen}
              title={t.nav.more}
              onSelect={selectScreen}
              onClose={() => setMoreOpen(false)}
            />
          )}
        </div>
        <div className="header-tools">
          <button
            type="button"
            className="help-btn"
            onClick={() => setHelpOpen(true)}
            aria-label={t.help.title}
            title={t.help.title}
          >
            ?
          </button>
          <LangToggle />
        </div>
      </header>

      <main>
        {ready && screen === "home" && (
          <Home
            invoices={data.invoices}
            expenses={data.expenses}
            bills={data.bills}
            donations={data.donations}
            go={setScreen}
          />
        )}
        {ready && screen === "invoices" && (
          <Invoices invoices={data.invoices} services={data.services} refresh={refresh} />
        )}
        {ready && screen === "quotes" && (
          <Quotes quotes={data.quotes} services={data.services} refresh={refresh} />
        )}
        {ready && screen === "bills" && (
          <Bills bills={data.bills} refresh={refresh} />
        )}
        {ready && screen === "expenses" && (
          <Expenses expenses={data.expenses} refresh={refresh} />
        )}
        {ready && screen === "services" && (
          <Services services={data.services} refresh={refresh} />
        )}
        {ready && screen === "time" && (
          <Time entries={data.timeEntries} services={data.services} refresh={refresh} />
        )}
        {ready && screen === "mileage" && (
          <Mileage trips={data.trips} refresh={refresh} />
        )}
        {ready && screen === "customers" && <Customers invoices={data.invoices} />}
        {ready && screen === "donations" && (
          <Donations donations={data.donations} refresh={refresh} />
        )}
        {ready && screen === "donors" && <Donors donations={data.donations} />}
        {ready && screen === "contractors" && (
          <Contractors
            contractors={data.contractors}
            payments={data.contractorPayments}
            refresh={refresh}
          />
        )}
        {ready && screen === "loans" && (
          <Loans loans={data.loans} payments={data.loanPayments} refresh={refresh} />
        )}
        {ready && screen === "reports" && (
          <Reports
            invoices={data.invoices}
            expenses={data.expenses}
            contractors={data.contractors}
            contractorPayments={data.contractorPayments}
            trips={data.trips}
            donations={data.donations}
          />
        )}
        {ready && screen === "settings" && <Settings refresh={refresh} />}
      </main>

      <nav className="mobile-nav">
        {primaryItems.map((item) => (
          <button
            key={item.id}
            className={screen === item.id ? "active" : ""}
            onClick={() => setScreen(item.id)}
          >
            <span className="micon">{item.icon}</span>
            {item.label(t)}
          </button>
        ))}
        <button
          type="button"
          className={moreActive ? "active" : ""}
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
        >
          <span className="micon" aria-hidden="true">
            ⋯
          </span>
          {t.nav.more}
        </button>
      </nav>

      {sheetOpen && (
        <MoreMenu
          variant="sheet"
          items={moreMenuItems}
          current={screen}
          title={t.nav.more}
          onSelect={selectScreen}
          onClose={() => setSheetOpen(false)}
        />
      )}

      {helpOpen && <HelpPanel onClose={() => setHelpOpen(false)} />}
      {tourOpen && ready && <Tour steps={tourSteps} onDone={closeTour} />}
    </>
  );
}

function reminderStrings(t: Strings): ReminderStrings {
  return {
    title: t.reminders.title,
    invDueSoonOne: t.reminders.invDueSoonOne,
    invDueSoon: t.reminders.invDueSoon,
    invOverdueOne: t.reminders.invOverdueOne,
    invOverdue: t.reminders.invOverdue,
    billDueSoonOne: t.reminders.billDueSoonOne,
    billDueSoon: t.reminders.billDueSoon,
    billOverdueOne: t.reminders.billOverdueOne,
    billOverdue: t.reminders.billOverdue,
  };
}

/* ---------- app root ---------- */

export default function App() {
  const [lang, setLangState] = useState<Lang>(() =>
    localStorage.getItem("cl-lang") === "es" ? "es" : "en"
  );
  const [onboarded, setOnboarded] = useState<boolean>(
    () => localStorage.getItem("cl-onboarded") === "1"
  );
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeId, setActiveId] = useState<number | null>(() => {
    const n = Number(localStorage.getItem("cl-activebiz"));
    return Number.isFinite(n) && n > 0 ? n : null;
  });
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [ready, setReady] = useState(false);
  const startedRef = useRef(false);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("cl-lang", l);
    document.documentElement.lang = l;
  }, []);

  /** Reloads every money list for the active business. */
  const refreshData = useCallback(async (): Promise<AppData> => {
    const [invoices, expenses, bills, quotes, contractors, contractorPayments, services, timeEntries, trips, loans, loanPayments, donations] =
      await Promise.all([
        getInvoices(),
        getExpenses(),
        getBills(),
        getQuotes(),
        getContractors(),
        getContractorPayments(),
        getServices(),
        getTimeEntries(),
        getTrips(),
        getLoans(),
        getLoanPayments(),
        getDonations(),
      ]);
    const next = { invoices, expenses, bills, quotes, contractors, contractorPayments, services, timeEntries, trips, loans, loanPayments, donations };
    setData(next);
    return next;
  }, []);

  const refresh = useCallback((): Promise<void> => {
    return refreshData().then(() => undefined);
  }, [refreshData]);

  /** Picks the active business: the stored choice when it still exists, else the first. */
  const pickActive = useCallback((list: Business[]): number | null => {
    if (list.length === 0) return null;
    const stored = Number(localStorage.getItem("cl-activebiz"));
    const id = list.some((b) => b.id === stored) ? stored : list[0].id;
    setActiveBusinessId(id);
    setActiveId(id);
    localStorage.setItem("cl-activebiz", String(id));
    return id;
  }, []);

  const switchBusiness = useCallback(
    async (id: number) => {
      setActiveBusinessId(id);
      setActiveId(id);
      localStorage.setItem("cl-activebiz", String(id));
      await refreshData();
    },
    [refreshData]
  );

  const addBusinessFlow = useCallback(
    async (name: string, type: string, state: string, entityType: EntityType = "forprofit"): Promise<Business> => {
      const id = await addBusiness({ name, type, state, entity_type: entityType });
      const list = await getBusinesses();
      setBusinesses(list);
      const created = list.find((b) => b.id === id);
      if (!created) throw new Error("business was not created");
      setActiveBusinessId(id);
      setActiveId(id);
      localStorage.setItem("cl-activebiz", String(id));
      await refreshData();
      return created;
    },
    [refreshData]
  );

  const updateActiveBusiness = useCallback(
    async (input: { name: string; type: string; state: string }) => {
      if (activeId == null) return;
      await updateBusiness(activeId, input);
      setBusinesses(await getBusinesses());
    },
    [activeId]
  );

  const updateActiveNonprofit = useCallback(
    async (input: { ein: string; fiscal_year_end: number; mission: string }) => {
      if (activeId == null) return;
      await updateNonprofitFields(activeId, input);
      setBusinesses(await getBusinesses());
    },
    [activeId]
  );

  const deleteActiveBusiness = useCallback(async () => {
    if (activeId == null || businesses.length <= 1) return;
    await deleteBusiness(activeId);
    const list = await getBusinesses();
    setBusinesses(list);
    if (list.length > 0) {
      const next = list[0];
      setActiveBusinessId(next.id);
      setActiveId(next.id);
      localStorage.setItem("cl-activebiz", String(next.id));
    }
    await refreshData();
  }, [activeId, businesses.length, refreshData]);

  /** After a backup restore: reload businesses, re-pick active, refresh data. */
  const resyncAfterRestore = useCallback(async () => {
    const list = await getBusinesses();
    setBusinesses(list);
    pickActive(list);
    await refreshData();
  }, [pickActive, refreshData]);

  const active = useMemo(
    () => businesses.find((b) => b.id === activeId) ?? null,
    [businesses, activeId]
  );
  const biz = active?.type ?? "freelancer";
  const stateCode = active?.state ?? "";
  const bizName = active?.name ?? "";
  const isNonprofit = active?.entity_type === "nonprofit";
  const pack = useMemo(() => getPack(biz), [biz]);

  const bizValue = useMemo<BizState>(
    () => ({
      businesses,
      activeId,
      active,
      switchBusiness,
      addBusinessFlow,
      updateActiveBusiness,
      updateActiveNonprofit,
      deleteActiveBusiness,
      resyncAfterRestore,
      biz,
      stateCode,
      isNonprofit,
      pack,
      bizName,
    }),
    [
      businesses,
      activeId,
      active,
      switchBusiness,
      addBusinessFlow,
      updateActiveBusiness,
      updateActiveNonprofit,
      deleteActiveBusiness,
      resyncAfterRestore,
      biz,
      stateCode,
      isNonprofit,
      pack,
      bizName,
    ]
  );

  // Startup: init → pick active business → recurring invoices → data → reminders.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    (async () => {
      try {
        await initDb();
        const list = await getBusinesses();
        setBusinesses(list);
        // The active business must be set before generateRecurringInvoices()
        // so it only processes this business's templates.
        pickActive(list);
        await generateRecurringInvoices();
        await generateRecurringExpenses();
        const loaded = await refreshData();
        const remindersOn = await getSetting("remindersOn");
        if (remindersOn !== "0") {
          await checkDueReminders(
            loaded.invoices,
            loaded.bills,
            reminderStrings(strings[lang])
          );
        }
      } catch {
        // Startup problems must never trap the user on a blank screen.
      } finally {
        setReady(true);
      }
    })();
    // Runs once on mount by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishOnboarding = useCallback(
    async (l: Lang, name: string, entityType: EntityType, type: string, sc: string) => {
      setLang(l);
      const id = await addBusiness({ name, type, state: sc, entity_type: entityType });
      setActiveBusinessId(id);
      setActiveId(id);
      localStorage.setItem("cl-activebiz", String(id));
      setBusinesses(await getBusinesses());
      const loaded = await refreshData();
      localStorage.setItem("cl-onboarded", "1");
      setOnboarded(true);
      const remindersOn = await getSetting("remindersOn");
      if (remindersOn !== "0") {
        await checkDueReminders(loaded.invoices, loaded.bills, reminderStrings(strings[l]));
      }
    },
    [setLang, refreshData]
  );

  return (
    <LangStateContext.Provider value={{ lang, setLang }}>
      <LangProvider value={lang}>
        <BizContext.Provider value={bizValue}>
          {!onboarded ? (
            <Onboarding onDone={finishOnboarding} />
          ) : (
            <Shell data={data} refresh={refresh} ready={ready} />
          )}
        </BizContext.Provider>
      </LangProvider>
    </LangStateContext.Provider>
  );
}
