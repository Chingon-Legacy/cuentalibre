import { createContext, useContext } from "react";
import type { Lang } from "./types";

/**
 * Every user-facing string lives here, in both languages.
 * Plain words only — never accounting jargon.
 * `es` is typed as `typeof en` so TypeScript forces both
 * languages to define exactly the same keys.
 */
const en = {
  tagline: "Simple books for your business",

  nav: {
    home: "Home",
    invoices: "Invoices",
    expenses: "Expenses",
    customers: "Customers",
    reports: "Reports",
    settings: "Settings",
  },

  onboarding: {
    langTitle: "Choose your language",
    langSub: "You can change this anytime in Settings.",
    nameTitle: "What's your business called?",
    nameSub: "This appears at the top of your app and on your invoices.",
    namePh: "Business name",
    bizTitle: "What kind of business do you have?",
    bizSub:
      "We'll set up the right money categories for you. You can change this later in Settings.",
    back: "Back",
    next: "Continue",
    start: "Start using CuentaLibre",
  },

  home: {
    subtitle: "Your business at a glance",
    moneyIn: "Money in",
    moneyOut: "Money out",
    whatsLeft: "What's left",
    whoOwesMe: "Who owes me",
    recentExpenses: "Recent expenses",
    nothingOwed: "Nobody owes you money. Nice!",
    noExpensesYet: "No expenses yet.",
    due: "Due",
    newInvoice: "New invoice",
    addExpense: "Add expense",
    cashflowTitle: "Cash flow — last 6 months",
  },

  invoices: {
    title: "Invoices",
    new: "New invoice",
    customer: "Customer",
    customerPh: "e.g. Maria's Bakery",
    amount: "Amount",
    category: "Income category",
    dueDate: "Due date",
    create: "Create invoice",
    cancel: "Cancel",
    markPaid: "Mark paid",
    paid: "Paid",
    waiting: "Waiting",
    late: "Late",
    delete: "Delete",
    confirmDelete: "Delete this invoice?",
    empty: "No invoices yet. Create your first one!",
    number: "Invoice #",
    view: "View",
    edit: "Edit",
    editTitle: "Edit invoice",
    saveChanges: "Save changes",
    status: "Status",
    searchPh: "Search by customer…",
    statusFilter: "Status",
    allStatuses: "All",
    repeat: "Repeat",
    repeatNone: "Only once",
    repeatWeekly: "Every week",
    repeatMonthly: "Every month",
    recurring: "Repeats",
    print: "Print / Save as PDF",
    issueDate: "Date issued",
    billTo: "Bill to",
    from: "From",
    amountDue: "Amount due",
  },

  expenses: {
    title: "Expenses",
    add: "Add expense",
    description: "What was it?",
    descriptionPh: "e.g. Flour and sugar",
    amount: "Amount",
    category: "Category",
    date: "Date",
    save: "Save expense",
    cancel: "Cancel",
    delete: "Delete",
    confirmDelete: "Delete this expense?",
    empty: "No expenses yet.",
    other: "Other",
    edit: "Edit",
    editTitle: "Edit expense",
    saveChanges: "Save changes",
    searchPh: "Search expenses…",
    allCategories: "All categories",
  },

  customers: {
    title: "Customers",
    billed: "Total billed",
    paid: "Paid",
    owes: "Still owes",
    invoices: "Invoices",
    showInvoices: "View invoices",
    hideInvoices: "Hide",
    empty:
      "No customers yet. They'll show up here when you create invoices.",
  },

  reports: {
    title: "Reports",
    type: "Report",
    from: "From",
    to: "To",
    download: "Download CSV",
    noData: "No data in this date range.",
    tSummary: "Money in vs money out",
    tIncomeByCat: "Income by category",
    tExpensesByCat: "Expenses by category",
    tWhoOwes: "Who owes me",
    tTax: "Tax summary",
    tTaxGuide: "Tax guide",
    tMonthly: "Month by month",
    category: "Category",
    amount: "Amount",
    month: "Month",
    moneyIn: "Money in",
    moneyOut: "Money out",
    left: "What's left",
    customer: "Customer",
    dueDate: "Due date",
    status: "Status",
    paid: "Paid",
    waiting: "Waiting",
    taxNote: "Take this to your tax preparer.",
    taxIncome: "Total income",
    taxIncomeWhy:
      "Money your customers actually paid you. This is the number the IRS taxes.",
    taxExpenses: "Business expenses",
    taxExpensesWhy:
      "Money you spent to run your business. These lower the amount you pay taxes on.",
    taxProfit: "Net profit",
    taxProfitWhy:
      "Income minus expenses. Your taxes are roughly based on this number.",
  },

  settings: {
    title: "Settings",
    language: "Language",
    businessType: "Business type",
    businessName: "Business name",
    backupTitle: "Your data",
    saveWork: "Save work",
    saveWorkDesc: "Download a backup file to your computer.",
    openBackup: "Open backup",
    openBackupDesc: "Restore your work from a backup file.",
    about: "About",
    aboutText:
      "CuentaLibre is free, open-source accounting software for small business owners. Your data stays on your computer — never on someone else's server.",
    version: "Version",
    saved: "Work saved to your computer.",
    restored: "Backup restored.",
    restoreFailed: "That file doesn't look like a CuentaLibre backup.",
    confirmRestore:
      "Open this backup? Your current data will be replaced.",
    working: "Working…",
  },

  common: {
    yes: "Yes",
    no: "No",
  },
};

const es: typeof en = {
  tagline: "Contabilidad simple para tu negocio",

  nav: {
    home: "Inicio",
    invoices: "Facturas",
    expenses: "Gastos",
    customers: "Clientes",
    reports: "Reportes",
    settings: "Ajustes",
  },

  onboarding: {
    langTitle: "Elige tu idioma",
    langSub: "Puedes cambiarlo cuando quieras en Ajustes.",
    nameTitle: "¿Cómo se llama tu negocio?",
    nameSub: "Aparecerá en la parte superior de tu app y en tus facturas.",
    namePh: "Nombre del negocio",
    bizTitle: "¿Qué tipo de negocio tienes?",
    bizSub:
      "Prepararemos las categorías adecuadas para ti. Puedes cambiarlo después en Ajustes.",
    back: "Atrás",
    next: "Continuar",
    start: "Empezar a usar CuentaLibre",
  },

  home: {
    subtitle: "Tu negocio de un vistazo",
    moneyIn: "Dinero que entró",
    moneyOut: "Dinero que salió",
    whatsLeft: "Lo que queda",
    whoOwesMe: "Quién me debe",
    recentExpenses: "Gastos recientes",
    nothingOwed: "Nadie te debe dinero. ¡Qué bien!",
    noExpensesYet: "Aún no hay gastos.",
    due: "Vence",
    newInvoice: "Nueva factura",
    addExpense: "Agregar gasto",
    cashflowTitle: "Flujo de dinero — últimos 6 meses",
  },

  invoices: {
    title: "Facturas",
    new: "Nueva factura",
    customer: "Cliente",
    customerPh: "p. ej. Panadería de María",
    amount: "Cantidad",
    category: "Categoría de ingreso",
    dueDate: "Fecha de vencimiento",
    create: "Crear factura",
    cancel: "Cancelar",
    markPaid: "Marcar como pagada",
    paid: "Pagada",
    waiting: "En espera",
    late: "Atrasada",
    delete: "Borrar",
    confirmDelete: "¿Borrar esta factura?",
    empty: "Aún no hay facturas. ¡Crea la primera!",
    number: "Factura n.º",
    view: "Ver",
    edit: "Editar",
    editTitle: "Editar factura",
    saveChanges: "Guardar cambios",
    status: "Estado",
    searchPh: "Buscar por cliente…",
    statusFilter: "Estado",
    allStatuses: "Todos",
    repeat: "Repetir",
    repeatNone: "Solo una vez",
    repeatWeekly: "Cada semana",
    repeatMonthly: "Cada mes",
    recurring: "Se repite",
    print: "Imprimir / Guardar como PDF",
    issueDate: "Fecha de emisión",
    billTo: "Facturar a",
    from: "De",
    amountDue: "Por pagar",
  },

  expenses: {
    title: "Gastos",
    add: "Agregar gasto",
    description: "¿En qué fue?",
    descriptionPh: "p. ej. Harina y azúcar",
    amount: "Cantidad",
    category: "Categoría",
    date: "Fecha",
    save: "Guardar gasto",
    cancel: "Cancelar",
    delete: "Borrar",
    confirmDelete: "¿Borrar este gasto?",
    empty: "Aún no hay gastos.",
    other: "Otro",
    edit: "Editar",
    editTitle: "Editar gasto",
    saveChanges: "Guardar cambios",
    searchPh: "Buscar gastos…",
    allCategories: "Todas las categorías",
  },

  customers: {
    title: "Clientes",
    billed: "Total facturado",
    paid: "Pagado",
    owes: "Aún debe",
    invoices: "Facturas",
    showInvoices: "Ver facturas",
    hideInvoices: "Ocultar",
    empty:
      "Aún no hay clientes. Aparecerán aquí cuando crees facturas.",
  },

  reports: {
    title: "Reportes",
    type: "Reporte",
    from: "Desde",
    to: "Hasta",
    download: "Descargar CSV",
    noData: "No hay datos en este rango de fechas.",
    tSummary: "Entradas vs salidas",
    tIncomeByCat: "Ingresos por categoría",
    tExpensesByCat: "Gastos por categoría",
    tWhoOwes: "Quién me debe",
    tTax: "Resumen de impuestos",
    tTaxGuide: "Guía de impuestos",
    tMonthly: "Mes por mes",
    category: "Categoría",
    amount: "Cantidad",
    month: "Mes",
    moneyIn: "Dinero que entró",
    moneyOut: "Dinero que salió",
    left: "Lo que queda",
    customer: "Cliente",
    dueDate: "Vence",
    status: "Estado",
    paid: "Pagada",
    waiting: "En espera",
    taxNote: "Llévale esto a tu preparador de impuestos.",
    taxIncome: "Ingresos totales",
    taxIncomeWhy:
      "Dinero que tus clientes realmente te pagaron. Este es el número que grava el IRS.",
    taxExpenses: "Gastos del negocio",
    taxExpensesWhy:
      "Dinero que gastaste para operar tu negocio. Estos reducen la cantidad sobre la que pagas impuestos.",
    taxProfit: "Ganancia neta",
    taxProfitWhy:
      "Ingresos menos gastos. Tus impuestos se basan aproximadamente en este número.",
  },

  settings: {
    title: "Ajustes",
    language: "Idioma",
    businessType: "Tipo de negocio",
    businessName: "Nombre del negocio",
    backupTitle: "Tus datos",
    saveWork: "Guardar respaldo",
    saveWorkDesc: "Descarga un archivo de respaldo a tu computadora.",
    openBackup: "Abrir respaldo",
    openBackupDesc: "Restaura tu trabajo desde un archivo de respaldo.",
    about: "Acerca de",
    aboutText:
      "CuentaLibre es software de contabilidad gratuito y de código abierto para pequeños negocios. Tus datos se quedan en tu computadora — nunca en el servidor de otra persona.",
    version: "Versión",
    saved: "Respaldo guardado en tu computadora.",
    restored: "Respaldo restaurado.",
    restoreFailed: "Ese archivo no parece un respaldo de CuentaLibre.",
    confirmRestore:
      "¿Abrir este respaldo? Tus datos actuales serán reemplazados.",
    working: "Trabajando…",
  },

  common: {
    yes: "Sí",
    no: "No",
  },
};

export const strings: Record<Lang, typeof en> = { en, es };
export type Strings = typeof en;

const LangContext = createContext<Lang>("en");

export const LangProvider = LangContext.Provider;

/** Returns the full string table for the current language. */
export function useStrings(): Strings {
  const lang = useContext(LangContext);
  return strings[lang];
}

export function useLang(): Lang {
  return useContext(LangContext);
}

export function fmtMoney(n: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export function fmtDate(iso: string, lang: Lang): string {
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
