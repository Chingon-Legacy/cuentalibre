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
    quotes: "Quotes",
    bills: "Bills",
    expenses: "Expenses",
    services: "Services",
    time: "Time",
    mileage: "Mileage",
    customers: "Customers",
    contractors: "Contractors",
    loans: "Loans",
    donations: "Donations",
    donors: "Donors",
    reports: "Reports",
    settings: "Settings",
    more: "More",
  },

  /** One warm line per screen inside the "More" menu. */
  moreDesc: {
    quotes: "Price estimates you can send to customers",
    bills: "What you owe, and when it's due",
    customers: "Everyone you've billed",
    donors: "Everyone who gave to your mission",
    contractors: "People who do work for you",
    time: "Hours you can turn into invoices",
    mileage: "Trips that can lower your taxes",
    services: "Your price list, ready to add to invoices",
    loans: "What you've borrowed and paid back",
    settings: "Language, backups, and your business details",
  },

  onboarding: {
    langTitle: "Choose your language",
    langSub: "Welcome! Pick the language you think in — you can change it anytime in Settings.",
    entityTitle: "What kind of organization is this?",
    entitySub: "This picks the tools and categories that fit you best. You can't change it later, so choose with care.",
    entityForProfit: "For-profit business",
    entityForProfitDesc: "A shop, service, or company that earns money.",
    entityNonprofit: "Nonprofit organization",
    entityNonprofitDesc: "A charity or community organization with a mission.",
    nameTitle: "What's your business called?",
    nameSub: "It shows at the top of your app and on your invoices.",
    namePh: "Business name",
    bizTitle: "What kind of business do you have?",
    bizSub:
      "We'll pick the money categories that fit your kind of work. You can change them later in Settings.",
    stateTitle: "What state is your business in?",
    stateSub:
      "We'll put your state's base sales tax rate on your invoices. You can change it later in Settings.",
    statePh: "Choose your state…",
    back: "Back",
    next: "Continue",
    start: "Start using CuentaLibre",
    celebrateTitle: "You're all set!",
    celebrateSub: "Let's take care of your business money.",
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
    taxTitle: "Tax reminder",
    taxNext: "Next estimated tax payment",
    taxSub:
      "Federal quarterly due date. Your state may have its own — check with your preparer.",
    billsDue: "Bills due soon",
    noBillsDue: "No bills due. Nice!",
    totalOwed: "You owe",
    backupNudgeTitle: "Save your work 💾",
    backupNudge:
      "It's been a while since you saved your work — tap here to save it.",
    saveNow: "Save now",
    dismiss: "Later",
    nfpDeadlineTitle: "IRS report due",
    nfpDeadlineLine: "Your {year} annual report is due {date}.",
    nfpDeadlineSub:
      "Most nonprofits must file Form 990 every year. See Reports for your checklist.",
    donationsMonth: "Donations this month",
    donationsCount: "{n} donations",
    noDonations: "No donations yet this month.",
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
    emptyTitle: "Invoices = getting paid",
    emptyBody:
      "An invoice is a request for payment you send to a customer. Create one, send it, and when they pay it counts as money in.",
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
    taxAdd: "Add sales tax",
    taxRate: "Tax rate (%)",
    taxNote:
      "State base rate only — your city or county may add more. Verify your local rate.",
    salesTax: "Sales tax",
    subtotal: "Subtotal",
    remind: "Remind",
    remindMsg:
      "Hi {customer}! This is {biz}: a friendly reminder that invoice #{number} for {amount} was due on {date}. Thank you!",
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
    emptyTitle: "Track what you spend",
    emptyBody:
      "Expenses are what you spend to run your business. Logging them keeps your books honest and lowers your taxes.",
    other: "Other",
    edit: "Edit",
    editTitle: "Edit expense",
    saveChanges: "Save changes",
    searchPh: "Search expenses…",
    allCategories: "All categories",
    importCsv: "Import CSV",
    attachPhoto: "Attach photo",
    changePhoto: "Change photo",
    removePhoto: "Remove photo",
    receiptPhoto: "Receipt photo",
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
    emptyTitle: "Your customers will appear here",
    emptyBody:
      "Everyone you invoice shows up here automatically, with what they still owe.",
  },

  bills: {
    title: "Bills you owe",
    new: "New bill",
    payee: "Pay to",
    payeePh: "e.g. Electric company",
    amount: "Amount",
    category: "Category",
    dueDate: "Due date",
    create: "Add bill",
    cancel: "Cancel",
    edit: "Edit",
    editTitle: "Edit bill",
    saveChanges: "Save changes",
    delete: "Delete",
    confirmDelete: "Delete this bill?",
    markPaid: "Mark paid",
    paid: "Paid",
    unpaid: "Unpaid",
    overdue: "Overdue",
    dueSoon: "Due soon",
    empty: "No bills. Add the ones you owe so nothing slips by.",
    emptyTitle: "Never miss a payment",
    emptyBody:
      "Bills are payments you owe — rent, utilities, suppliers. Add them with their due dates and we'll remind you before they're late.",
    totalOwed: "Total you owe",
    paidNote: "Marking paid also adds it to your expenses.",
  },

  quotes: {
    title: "Quotes",
    new: "New quote",
    number: "Quote #",
    customer: "Customer",
    customerPh: "e.g. Maria's Bakery",
    amount: "Amount",
    category: "Category",
    validUntil: "Valid until",
    create: "Create quote",
    cancel: "Cancel",
    edit: "Edit",
    editTitle: "Edit quote",
    saveChanges: "Save changes",
    delete: "Delete",
    confirmDelete: "Delete this quote?",
    status: "Status",
    draft: "Draft",
    sent: "Sent",
    accepted: "Accepted",
    declined: "Declined",
    markSent: "Mark sent",
    markAccepted: "Mark accepted",
    markDeclined: "Mark declined",
    convert: "Convert to invoice",
    converted: "Quote converted to a new invoice.",
    empty: "No quotes yet. Send one to win the next job.",
    emptyTitle: "Quotes win jobs",
    emptyBody:
      "A quote tells a customer what a job will cost before you start. If they say yes, turn it into an invoice in one tap.",
  },

  contractors: {
    title: "Contractors",
    new: "Add contractor",
    name: "Name",
    namePh: "e.g. Juan Pérez",
    note: "Note (optional)",
    notePh: "e.g. Lawn help",
    add: "Add",
    cancel: "Cancel",
    delete: "Delete",
    confirmDelete: "Delete this contractor and all their payments?",
    empty: "No contractors yet.",
    emptyTitle: "Track your helpers",
    emptyBody:
      "Contractors are people you pay to help with your business. We track yearly totals and flag anyone over $600 for a 1099.",
    selectContractor: "Select a contractor",
    payments: "Payments",
    addPayment: "Log payment",
    amount: "Amount",
    date: "Date",
    paymentNote: "Note",
    save: "Save",
    deletePayment: "Delete",
    confirmDeletePayment: "Delete this payment?",
    noPayments: "No payments logged yet.",
    year: "Year",
    totalYear: "Total paid",
    exportCsv: "Download summary",
    banner:
      "The IRS requires a 1099-NEC form for any contractor paid $600 or more in a year.",
    overThreshold: "Over $600 — needs 1099-NEC",
  },

  csvimport: {
    title: "Import from bank",
    chooseFile: "Choose CSV file",
    stepFile: "Step 1 — pick your bank's CSV file",
    stepMap: "Step 2 — match the columns",
    stepReview: "Step 3 — review and import",
    colDate: "Date column",
    colDesc: "Description column",
    colAmount: "Amount column",
    signLabel: "My bank shows spending as negative numbers",
    category: "Category for all",
    rowsFound: "rows found",
    import: "Import",
    cancel: "Cancel",
    imported: "imported",
    skipped: "skipped (already imported or invalid)",
    done: "Done!",
    noRows: "No valid rows found in this file.",
    dateNote: "Dates like MM/DD/YYYY are read as month/day/year.",
    preview: "Preview",
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
    taxCollected: "Sales tax collected",
    keepRecordsTitle: "Keep your records 7 years",
    keepRecordsWhy:
      "The IRS and most states can ask about old tax years. Keep invoices, receipts, and reports for at least 7 years — this app's backup file counts.",
    disclaimer:
      "CuentaLibre is not a tax professional. Tax rates change — verify your state and local rates with a tax preparer.",
  },

  settings: {
    title: "Settings",
    language: "Language",
    businessType: "Business type",
    businessName: "Business name",
    businessState: "Business state",
    entityType: "Organization type",
    nonprofitInfo: "Nonprofit details",
    incomeGoal: "Monthly income goal",
    backupTitle: "Your data",
    saveWork: "Save work",
    saveWorkDesc: "Download a backup file to your computer.",
    openBackup: "Open backup",
    openBackupDesc: "Restore your work from a backup file.",
    about: "About",
    aboutText:
      "CuentaLibre is free, open-source accounting software for small business owners. Your data stays on your computer — never on someone else's server.",
    disclaimer:
      "CuentaLibre is not a tax professional. Tax rates change — verify your state and local rates with a tax preparer.",
    version: "Version",
    saved: "Work saved to your computer.",
    restored: "Backup restored.",
    restoreFailed: "That file doesn't look like a CuentaLibre backup.",
    confirmRestore:
      "Open this backup? Your current data will be replaced.",
    working: "Working…",
    bizTitle: "Your businesses",
    addBusiness: "＋ Add another business",
    deleteBiz: "Delete",
    confirmDeleteBiz:
      "Delete “{name}”? Everything from this business — invoices, expenses, bills, all of it — will be gone for good.",
    lastBizNote: "You need at least one business.",
    remindersTitle: "Due-date reminders",
    remindersDesc: "Get a gentle nudge when an invoice or bill is almost due.",
    on: "On",
    off: "Off",
    taxJarTitle: "Tax savings jar",
    taxJarPercent: "Percent of income to set aside",
    taxJarDesc:
      "Many self-employed people set aside 25–30% of income for taxes.",
    lastBackup: "Last saved: {date}",
    neverBackedUp: "You haven't saved a backup yet.",
  },

  common: {
    yes: "Yes",
    no: "No",
  },

  header: {
    addBusiness: "＋ Add another business",
  },

  insights: {
    title: "💡 Worth a look",
    late: "⏰ {n} late invoices — that's {money} waiting for you",
    billsSoon: "📄 {money} in bills due in the next 7 days",
    catUp: "📈 {category} cost {pct}% more than last month",
    topCat: "💸 Most of your spending this month went to {category} ({money})",
  },

  tour: {
    next: "Next",
    back: "Back",
    skip: "Skip tour",
    done: "Done",
    stepNavT: "Everything lives here",
    stepNavB:
      "These buttons take you to your money screens: Home, Invoices, Bills, and the rest.",
    stepTotalsT: "Money in, money out",
    stepTotalsB:
      "The top three numbers show what came in, what went out, and what's left.",
    stepNewInvoiceT: "Get paid",
    stepNewInvoiceB: "Tap here to create your first invoice whenever you're ready.",
    stepLangT: "Your language",
    stepLangB: "Switch between English and Español anytime you like.",
    stepHelpT: "Need a hand?",
    stepHelpB: "Tap the ? anytime for plain-words help about any screen.",
  },

  help: {
    title: "How CuentaLibre works",
    close: "Close",
    homeT: "🏠 Home",
    homeB:
      "Home shows your money at a glance: what came in, what went out, and what's left. Below that you'll see who owes you, bills coming due, and your recent spending.",
    invoicesT: "🧾 Invoices",
    invoicesB:
      "An invoice is a request for payment you send to a customer. When they pay, it counts as money in. Late invoices show in red so you can follow up.",
    quotesT: "📝 Quotes",
    quotesB:
      "A quote tells a customer what a job will cost before you start. If they say yes, you can turn it into an invoice in one tap.",
    billsT: "📄 Bills",
    billsB:
      "Bills are payments you owe, like rent or utilities. Adding them here with their due dates means nothing slips by. Marking one paid also logs it as an expense.",
    expensesT: "💸 Expenses",
    expensesB:
      "Expenses are what you spend to run your business — supplies, gas, tools. Logging them keeps your books honest and lowers your taxes. You can attach a photo of the receipt.",
    servicesT: "🏷️ Services",
    servicesB:
      "Save what you sell with its price — a haircut, a lawn mowing, an hour of work. Then tap one on an invoice or quote and the price fills itself in.",
    timeT: "⏱️ Time",
    timeB:
      "Log the hours you work for each customer. When it's time to bill, select the hours, set your hourly rate, and turn them into invoices in one tap.",
    mileageT: "🚗 Mileage",
    mileageB:
      "Log your business drives — the date, miles, and why. The app multiplies them by the IRS standard rate to figure out your deduction, and adds it to your tax package.",
    customersT: "👥 Customers",
    customersB:
      "Everyone you've ever invoiced shows up here, with what they were billed, what they paid, and what they still owe.",
    contractorsT: "🤝 Contractors",
    contractorsB:
      "People you pay to help with your business go here. CuentaLibre tracks what you paid each person, and flags anyone over $600 a year — that's when the IRS wants a 1099-NEC form.",
    loansT: "🏦 Loans",
    loansB:
      "Track money you borrowed — a truck loan, a line of credit, anything. Log each payment and watch the balance shrink, with a little cheer when you pay one off.",
    reportsT: "📊 Reports",
    reportsB:
      "Reports turn your numbers into summaries you can download: money in vs money out, spending by category, and a plain-words tax guide. The tax package button builds one file your tax preparer will love.",
    taxT: "What is sales tax?",
    taxB:
      "Some states charge a tax on what you sell. CuentaLibre adds your state's base rate to your invoices automatically, but your city or county may add more — always verify your local rate.",
    backupT: "How do backups work?",
    backupB:
      "Go to Settings → Save work to download a backup file with everything, from every business. Keep a copy somewhere safe, like a USB drive. Open backup restores it all.",
    donationsT: "❤️ Donations",
    donationsB:
      "Record every gift your nonprofit receives — who gave, how much, when, and for which campaign. One tap prints an IRS-ready receipt for the donor.",
    donorsT: "🙏 Donors",
    donorsB:
      "Everyone who has donated, with their totals by year — handy for thank-you letters and your annual report.",
    nfpT: "What is Form 990?",
    nfpB:
      "Most nonprofits must tell the IRS about their finances every year using Form 990. Small ones (under $50,000) file a short free form online. The Reports screen figures out which one you need and prepares your numbers — but only the IRS website can accept the filing.",
  },

  hints: {
    reports:
      "Reports turn your money in and out into simple summaries you can download — pick a report type and a date range, and we'll do the math.",
    csvImport:
      "Bring in your bank transactions in 3 easy steps: pick your CSV file, match its columns, and review before you import.",
    nineNinety:
      "This helper figures out which Form 990 your nonprofit needs and gathers your numbers for you — the filing itself happens on the IRS website.",
  },

  reminders: {
    title: "CuentaLibre",
    invDueSoonOne: "🧾 1 invoice due soon",
    invDueSoon: "🧾 {n} invoices due soon",
    invOverdueOne: "🧾 1 invoice overdue",
    invOverdue: "🧾 {n} invoices overdue",
    billDueSoonOne: "📄 1 bill due soon",
    billDueSoon: "📄 {n} bills due soon",
    billOverdueOne: "📄 1 bill overdue",
    billOverdue: "📄 {n} bills overdue",
  },

  taxpackage: {
    title: "Tax package",
    desc: "Everything your tax preparer needs, in one file.",
    year: "Year",
    btn: "📦 Get my tax package",
    docTitle: "Tax package {year}",
    business: "Business",
    typeL: "Type",
    stateL: "State",
    profitSummary: "Profit summary",
    income: "Income — money your customers paid you",
    expensesW: "Expenses — money you spent running the business",
    net: "Net — what's left",
    expensesByCat: "Expenses by category",
    salesTaxCollected: "Sales tax collected",
    contractorTitle: "Payments to contractors in {year}",
    needs1099: "— needs a 1099-NEC form (over $600)",
    noContractors: "No contractor payments this year.",
    unpaidTitle: "Unpaid invoices at the end of {year}",
    unpaidNote: "These weren't paid yet, so they don't count as income this year.",
    noUnpaid: "None — every invoice was paid.",
    mileageTitle: "Mileage deduction {year}",
    mileageSub:
      "Business miles driven, valued at the IRS standard rate in effect on each trip's date.",
    noTrips: "No trips logged this year.",
    milesLabel: "miles",
    total: "Total",
    preparedNote: "Prepared with CuentaLibre. Take this to your tax preparer.",
  },

  addbiz: {
    title: "Add another business",
    nameTitle: "What's this business called?",
    nameSub: "Each business keeps its own invoices, expenses, and bills.",
    namePh: "Business name",
    bizTitle: "What kind of business is it?",
    bizSub: "We'll set up the right money categories for it.",
    stateTitle: "What state is it in?",
    stateSub: "Sets the base sales tax rate on its invoices.",
    statePh: "Choose your state…",
    back: "Back",
    next: "Continue",
    create: "Add business",
    cancel: "Cancel",
  },

  services: {
    title: "Services",
    new: "New service",
    name: "Service name",
    namePh: "e.g. Haircut",
    price: "Price",
    create: "Add service",
    saveChanges: "Save changes",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Delete this service?",
    cancel: "Cancel",
    pick: "Pick a service…",
    emptyTitle: "No services yet",
    emptyBody:
      "Save what you sell with its price. Then tap one to fill an invoice in a second.",
  },

  time: {
    title: "Time",
    new: "Log hours",
    customer: "Customer",
    customerPh: "Who did you work for?",
    description: "What did you do?",
    descriptionPh: "e.g. Lawn mowing",
    hours: "Hours",
    date: "Date",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    confirmDelete: "Delete this entry?",
    uninvoiced: "Not invoiced yet",
    invoiced: "Invoiced",
    selected: "{n} selected",
    createInvoice: "Create invoice",
    rate: "Hourly rate",
    ratePh: "e.g. 25",
    total: "Total",
    emptyTitle: "No hours logged yet",
    emptyBody:
      "Log the hours you work. When it's time to bill, turn them into an invoice in one tap.",
    created: "Invoice created!",
  },

  mileage: {
    title: "Mileage",
    new: "Log a trip",
    date: "Date",
    miles: "Miles",
    milesPh: "e.g. 12.5",
    purpose: "Purpose",
    purposePh: "e.g. Client visit, supply run",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    confirmDelete: "Delete this trip?",
    deduction: "Deduction",
    ytdTitle: "This year's deduction",
    ytdSub:
      "The IRS lets you deduct {rate} for every business mile you drive. This is your running total.",
    perMile: "{rate}/mile",
    export: "Export CSV",
    emptyTitle: "No trips logged yet",
    emptyBody:
      "Log your business drives. The app figures out the IRS deduction for you.",
  },

  paymethod: {
    label: "Payment method",
    cash: "Cash",
    card: "Card",
    transfer: "Transfer",
    check: "Check",
    notSet: "Not set",
    breakdown: "By payment method",
  },

  goal: {
    cardTitle: "{month} goal",
    of: "{done} of {goal}",
    remaining: "{money} to go",
    reached: "🎉 Goal reached! Amazing work.",
    setPrompt: "Set a monthly income goal in Settings to track your progress here.",
    monthFmt: "MMMM",
  },

  taxjar: {
    title: "Tax savings jar",
    setAside: "Set aside {money} for taxes",
    basedOn: "Based on {money} earned this month at {pct}%",
    note: "A friendly reminder — not a tax rule. Check with your preparer.",
    noIncome: "No income yet this month — nothing to set aside.",
  },

  yoy: {
    title: "This year vs last year",
    incomeUp: "You've made {pct}% more than last year 🎉",
    incomeDown: "You've made {pct}% less than last year",
    incomeSame: "Income is about the same as last year",
    expensesUp: "Expenses are up {pct}% vs last year",
    expensesDown: "Expenses are down {pct}% vs last year",
    expensesSame: "Expenses are about the same as last year",
    ytdNote: "Year to date, through {date}",
  },

  statement: {
    button: "Statement",
    title: "Customer statement",
    from: "From",
    to: "To",
    invoice: "Invoice",
    date: "Date",
    amount: "Amount",
    status: "Status",
    totalOwed: "Total still owed",
    print: "Print / Save as PDF",
    noInvoices: "No invoices in this period.",
    billedTo: "Billed to",
  },

  dupes: {
    possibleBadge: "Possible duplicate",
    reviewTitle: "Review possible duplicates",
    reviewSub:
      "These rows look like ones you already have. Unchecked rows won't be imported.",
    warnExpense:
      "Heads up — you already have a {money} expense for “{desc}” from {date}. Save anyway?",
    warnInvoice:
      "Heads up — you already have a {money} invoice for {customer} from {date}. Save anyway?",
    saveAnyway: "Save anyway",
    keepEditing: "Keep editing",
  },

  loans: {
    title: "Loans",
    new: "Add loan",
    name: "Loan name",
    namePh: "e.g. Truck loan",
    borrowed: "Amount borrowed",
    dateBorrowed: "Date borrowed",
    note: "Note (optional)",
    balance: "Still owed",
    paidSoFar: "Paid so far",
    logPayment: "Log payment",
    paymentAmount: "Payment amount",
    paymentDate: "Payment date",
    delete: "Delete",
    confirmDelete: "Delete this loan and all its payments?",
    emptyTitle: "No loans yet",
    emptyBody:
      "Track money you borrowed here — log payments and watch the balance shrink.",
    paidOff: "Paid off! 🎉",
    create: "Add loan",
    cancel: "Cancel",
    progress: "{pct}% paid",
  },

  donations: {
    title: "Donations",
    new: "Add donation",
    donor: "Donor",
    donorPh: "e.g. Maria Garcia",
    amount: "Amount",
    date: "Date",
    campaign: "Campaign (optional)",
    campaignPh: "e.g. Holiday drive 2026",
    create: "Add donation",
    save: "Save changes",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Delete this donation?",
    receipt: "Receipt",
    emptyTitle: "No donations yet",
    emptyBody:
      "Record every donation here — you'll need them for your annual IRS report.",
  },

  donors: {
    title: "Donors",
    emptyTitle: "No donors yet",
    emptyBody:
      "Everyone who has donated shows up here, with their totals by year.",
    donated: "Donated",
    showDonations: "Show donations",
    hideDonations: "Hide donations",
  },

  receipt: {
    title: "Donation receipt",
    orgLine: "Organization",
    einLine: "EIN",
    donorLine: "Donor",
    amountLine: "Amount",
    dateLine: "Date",
    campaignLine: "Campaign",
    noGoods:
      "No goods or services were provided in exchange for this contribution.",
    keepIt: "Keep this receipt for your tax records.",
    print: "Print / Save as PDF",
    close: "Close",
  },

  nonprofit: {
    entityForProfit: "For-profit business",
    entityNonprofit: "Nonprofit organization",
    ein: "EIN",
    einDesc:
      "Your organization's Employer Identification Number from the IRS.",
    fiscalYearEnd: "Fiscal year ends",
    fiscalYearEndDesc:
      "The month your organization's tax year ends. Most choose December.",
    mission: "Mission statement",
    missionDesc:
      "A sentence or two about what your organization does. Used in your annual report.",
  },

  nfp: {
    title: "Annual IRS report",
    desc: "Figure out which Form 990 your organization files, and get everything ready.",
    taxYear: "Tax year",
    grossReceipts: "Gross receipts",
    grossReceiptsWhy:
      "All the money your organization received this tax year: donations plus paid invoices.",
    formN: "Form 990-N (e-Postcard)",
    formNWhy:
      "Based on your {money} in revenue, you can file the short online form. It's free and takes a few minutes.",
    formEZ: "Form 990-EZ",
    formEZWhy:
      "Based on your {money} in revenue, you file the short paper form. Note: we don't track your assets here — if they're over $500,000 you must file the full Form 990.",
    formFull: "Full Form 990",
    formFullWhy:
      "Based on your {money} in revenue, you file the full Form 990. Take the financial summary below to your tax preparer.",
    deadlineTitle: "Filing deadline",
    deadlineLine: "Your {year} report is due {date}.",
    revocationTitle: "Don't miss three years",
    revocationText:
      "If you don't file for 3 years in a row, the IRS automatically cancels your tax-exempt status. Filing every year keeps you safe.",
    checklistTitle: "Your 990-N checklist",
    checklistSub:
      "The online form asks these 8 questions. What we know is filled in — the rest is marked TO FILL.",
    cEin: "EIN",
    cTaxYear: "Tax year",
    cLegalName: "Legal name",
    cAddress: "Mailing address",
    cWebsite: "Website",
    cReceipts: "Confirm gross receipts were $50,000 or less",
    cNotTerminated: "State the organization has not terminated",
    cOfficer: "Principal officer name",
    toFill: "TO FILL",
    howTitle: "How to file on the IRS website",
    howSub:
      "CuentaLibre prepares your numbers — only the IRS website can accept the filing. Nothing is filed from this app.",
    how1:
      'Go to irs.gov and search for "Form 990-N" to open the e-Postcard filing system.',
    how2: "Create an account (or sign in) on the IRS filing site.",
    how3: "Choose Form 990-N and answer the 8 questions using your checklist above.",
    how4: "Submit before your deadline and save the confirmation email.",
    finTitle: "Financial summary for your preparer",
    finSub:
      "Take this to your tax preparer for Form 990-EZ or the full Form 990.",
    revByCat: "Revenue by category",
    expProgram: "Program expenses",
    expFundraising: "Fundraising expenses",
    expAdmin: "Management & admin",
    expTotal: "Total expenses",
    netAssets: "Change in net assets",
    download: "Download summary (CSV)",
    pfNote:
      "Private foundations always file Form 990-PF, a different form this helper doesn't prepare. Talk to your preparer.",
    cannotFile:
      "Important: this app prepares your report — it cannot file it. Filing happens only on the IRS website.",
    disclaimer:
      "CuentaLibre is not a tax professional. Verify everything with your tax preparer.",
    noData: "No revenue recorded for this tax year yet.",
  },
};

const es: typeof en = {
  tagline: "Contabilidad simple para tu negocio",

  nav: {
    home: "Inicio",
    invoices: "Facturas",
    quotes: "Cotizaciones",
    bills: "Cuentas",
    expenses: "Gastos",
    services: "Servicios",
    time: "Horas",
    mileage: "Millaje",
    customers: "Clientes",
    contractors: "Contratistas",
    loans: "Préstamos",
    donations: "Donaciones",
    donors: "Donantes",
    reports: "Reportes",
    settings: "Ajustes",
    more: "Más",
  },

  /** One warm line per screen inside the "More" menu. */
  moreDesc: {
    quotes: "Estimados de precio para tus clientes",
    bills: "Lo que debes y cuándo vence",
    customers: "Todos a quienes has facturado",
    donors: "Todos los que apoyaron tu misión",
    contractors: "Personas que trabajan para ti",
    time: "Horas que puedes convertir en facturas",
    mileage: "Viajes que pueden bajar tus impuestos",
    services: "Tu lista de precios, lista para facturar",
    loans: "Lo que pediste prestado y devolviste",
    settings: "Idioma, respaldos y datos de tu negocio",
  },

  onboarding: {
    langTitle: "Elige tu idioma",
    langSub: "¡Bienvenido/a! Elige el idioma en el que piensas — puedes cambiarlo cuando quieras en Ajustes.",
    entityTitle: "¿Qué tipo de organización es?",
    entitySub: "Esto elige las herramientas y categorías que más te convienen. No podrás cambiarlo después, así que elige con calma.",
    entityForProfit: "Negocio con fines de lucro",
    entityForProfitDesc: "Una tienda, servicio o empresa que gana dinero.",
    entityNonprofit: "Organización sin fines de lucro",
    entityNonprofitDesc: "Una organización comunitaria o de caridad con una misión.",
    nameTitle: "¿Cómo se llama tu negocio?",
    nameSub: "Aparecerá en la parte superior de tu app y en tus facturas.",
    namePh: "Nombre del negocio",
    bizTitle: "¿Qué tipo de negocio tienes?",
    bizSub:
      "Elegiremos las categorías que se adapten a tu tipo de trabajo. Puedes cambiarlas después en Ajustes.",
    stateTitle: "¿En qué estado está tu negocio?",
    stateSub:
      "Pondremos la tasa base de impuesto sobre las ventas de tu estado en tus facturas. Puedes cambiarla después en Ajustes.",
    statePh: "Elige tu estado…",
    back: "Atrás",
    next: "Continuar",
    start: "Empezar a usar CuentaLibre",
    celebrateTitle: "¡Todo listo!",
    celebrateSub: "Cuidemos el dinero de tu negocio.",
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
    taxTitle: "Recordatorio de impuestos",
    taxNext: "Próximo pago estimado de impuestos",
    taxSub:
      "Fecha federal trimestral. Tu estado puede tener la suya — consúltalo con tu preparador.",
    billsDue: "Cuentas por vencer",
    noBillsDue: "Sin cuentas por vencer. ¡Qué bien!",
    totalOwed: "Debes",
    backupNudgeTitle: "Guarda tu trabajo 💾",
    backupNudge:
      "Hace tiempo que no guardas tu trabajo — toca aquí para guardarlo.",
    saveNow: "Guardar ahora",
    dismiss: "Después",
    nfpDeadlineTitle: "Reporte del IRS",
    nfpDeadlineLine: "Tu reporte anual de {year} vence el {date}.",
    nfpDeadlineSub:
      "La mayoría de las organizaciones deben presentar el Formulario 990 cada año. Mira Reportes para tu lista.",
    donationsMonth: "Donaciones este mes",
    donationsCount: "{n} donaciones",
    noDonations: "Aún no hay donaciones este mes.",
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
    emptyTitle: "Facturas = recibir pagos",
    emptyBody:
      "Una factura es un cobro que le envías a un cliente. Créala, envíala, y cuando te pague contará como dinero que entró.",
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
    taxAdd: "Agregar impuesto sobre las ventas",
    taxRate: "Tasa de impuesto (%)",
    taxNote:
      "Solo la tasa base del estado — tu ciudad o condado puede agregar más. Verifica tu tasa local.",
    salesTax: "Impuesto sobre las ventas",
    subtotal: "Subtotal",
    remind: "Recordar",
    remindMsg:
      "¡Hola {customer}! Te escribe {biz}: te recordamos amablemente que la factura n.º {number} por {amount} venció el {date}. ¡Gracias!",
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
    emptyTitle: "Registra lo que gastas",
    emptyBody:
      "Los gastos son lo que gastas para operar tu negocio. Registrarlos mantiene tus cuentas en orden y baja tus impuestos.",
    other: "Otro",
    edit: "Editar",
    editTitle: "Editar gasto",
    saveChanges: "Guardar cambios",
    searchPh: "Buscar gastos…",
    allCategories: "Todas las categorías",
    importCsv: "Importar CSV",
    attachPhoto: "Adjuntar foto",
    changePhoto: "Cambiar foto",
    removePhoto: "Quitar foto",
    receiptPhoto: "Foto del recibo",
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
    emptyTitle: "Tus clientes aparecerán aquí",
    emptyBody:
      "Todas las personas a las que les factures aparecen aquí automáticamente, con lo que aún deben.",
  },

  bills: {
    title: "Cuentas que debes pagar",
    new: "Nueva cuenta",
    payee: "Pagar a",
    payeePh: "p. ej. Compañía de luz",
    amount: "Cantidad",
    category: "Categoría",
    dueDate: "Vence",
    create: "Agregar cuenta",
    cancel: "Cancelar",
    edit: "Editar",
    editTitle: "Editar cuenta",
    saveChanges: "Guardar cambios",
    delete: "Borrar",
    confirmDelete: "¿Borrar esta cuenta?",
    markPaid: "Marcar pagada",
    paid: "Pagada",
    unpaid: "Sin pagar",
    overdue: "Vencida",
    dueSoon: "Por vencer",
    empty: "No hay cuentas. Agrega las que debes para que no se te pase ninguna.",
    emptyTitle: "Nunca olvides un pago",
    emptyBody:
      "Las cuentas son pagos que debes — renta, luz, proveedores. Agrégalas con sus fechas de vencimiento y te avisaremos antes de que se atrasen.",
    totalOwed: "Total que debes",
    paidNote: "Al marcarla pagada también se agrega a tus gastos.",
  },

  quotes: {
    title: "Cotizaciones",
    new: "Nueva cotización",
    number: "Cotización n.º",
    customer: "Cliente",
    customerPh: "p. ej. Panadería de María",
    amount: "Cantidad",
    category: "Categoría",
    validUntil: "Válida hasta",
    create: "Crear cotización",
    cancel: "Cancelar",
    edit: "Editar",
    editTitle: "Editar cotización",
    saveChanges: "Guardar cambios",
    delete: "Borrar",
    confirmDelete: "¿Borrar esta cotización?",
    status: "Estado",
    draft: "Borrador",
    sent: "Enviada",
    accepted: "Aceptada",
    declined: "Rechazada",
    markSent: "Marcar enviada",
    markAccepted: "Marcar aceptada",
    markDeclined: "Marcar rechazada",
    convert: "Convertir en factura",
    converted: "Cotización convertida en una nueva factura.",
    empty: "Aún no hay cotizaciones. Envía una para ganar el próximo trabajo.",
    emptyTitle: "Las cotizaciones ganan trabajos",
    emptyBody:
      "Una cotización le dice a un cliente cuánto costará un trabajo antes de empezar. Si acepta, conviértela en factura con un toque.",
  },

  contractors: {
    title: "Contratistas",
    new: "Agregar contratista",
    name: "Nombre",
    namePh: "p. ej. Juan Pérez",
    note: "Nota (opcional)",
    notePh: "p. ej. Ayuda con el jardín",
    add: "Agregar",
    cancel: "Cancelar",
    delete: "Borrar",
    confirmDelete: "¿Borrar este contratista y todos sus pagos?",
    empty: "Aún no hay contratistas.",
    emptyTitle: "Registra a tus ayudantes",
    emptyBody:
      "Los contratistas son personas a las que les pagas por ayudarte con tu negocio. Registramos los totales anuales y marcamos a quienes superen $600 para el 1099.",
    selectContractor: "Elige un contratista",
    payments: "Pagos",
    addPayment: "Registrar pago",
    amount: "Cantidad",
    date: "Fecha",
    paymentNote: "Nota",
    save: "Guardar",
    deletePayment: "Borrar",
    confirmDeletePayment: "¿Borrar este pago?",
    noPayments: "Aún no hay pagos registrados.",
    year: "Año",
    totalYear: "Total pagado",
    exportCsv: "Descargar resumen",
    banner:
      "El IRS exige el formulario 1099-NEC para cualquier contratista al que le pagues $600 o más en un año.",
    overThreshold: "Más de $600 — necesita 1099-NEC",
  },

  csvimport: {
    title: "Importar del banco",
    chooseFile: "Elegir archivo CSV",
    stepFile: "Paso 1 — elige el archivo CSV de tu banco",
    stepMap: "Paso 2 — relaciona las columnas",
    stepReview: "Paso 3 — revisa e importa",
    colDate: "Columna de fecha",
    colDesc: "Columna de descripción",
    colAmount: "Columna de cantidad",
    signLabel: "Mi banco muestra los gastos como números negativos",
    category: "Categoría para todos",
    rowsFound: "filas encontradas",
    import: "Importar",
    cancel: "Cancelar",
    imported: "importados",
    skipped: "omitidos (ya importados o inválidos)",
    done: "¡Listo!",
    noRows: "No se encontraron filas válidas en este archivo.",
    dateNote: "Las fechas como MM/DD/AAAA se leen como mes/día/año.",
    preview: "Vista previa",
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
    taxCollected: "Impuesto sobre las ventas cobrado",
    keepRecordsTitle: "Guarda tus registros 7 años",
    keepRecordsWhy:
      "El IRS y la mayoría de los estados pueden revisar años anteriores. Guarda tus facturas, recibos y reportes por al menos 7 años — el archivo de respaldo de esta app cuenta.",
    disclaimer:
      "CuentaLibre no es un profesional de impuestos. Las tasas cambian — verifica tus tasas estatales y locales con un preparador.",
  },

  settings: {
    title: "Ajustes",
    language: "Idioma",
    businessType: "Tipo de negocio",
    businessName: "Nombre del negocio",
    businessState: "Estado del negocio",
    entityType: "Tipo de organización",
    nonprofitInfo: "Datos de la organización",
    incomeGoal: "Meta mensual de ingresos",
    backupTitle: "Tus datos",
    saveWork: "Guardar respaldo",
    saveWorkDesc: "Descarga un archivo de respaldo a tu computadora.",
    openBackup: "Abrir respaldo",
    openBackupDesc: "Restaura tu trabajo desde un archivo de respaldo.",
    about: "Acerca de",
    aboutText:
      "CuentaLibre es software de contabilidad gratuito y de código abierto para pequeños negocios. Tus datos se quedan en tu computadora — nunca en el servidor de otra persona.",
    disclaimer:
      "CuentaLibre no es un profesional de impuestos. Las tasas cambian — verifica tus tasas estatales y locales con un preparador.",
    version: "Versión",
    saved: "Respaldo guardado en tu computadora.",
    restored: "Respaldo restaurado.",
    restoreFailed: "Ese archivo no parece un respaldo de CuentaLibre.",
    confirmRestore:
      "¿Abrir este respaldo? Tus datos actuales serán reemplazados.",
    working: "Trabajando…",
    bizTitle: "Tus negocios",
    addBusiness: "＋ Agregar otro negocio",
    deleteBiz: "Borrar",
    confirmDeleteBiz:
      "¿Borrar “{name}”? Todo de este negocio — facturas, gastos, cuentas, todo — se perderá para siempre.",
    lastBizNote: "Necesitas al menos un negocio.",
    remindersTitle: "Recordatorios de vencimiento",
    remindersDesc: "Recibe un aviso amable cuando una factura o cuenta esté por vencer.",
    on: "Activado",
    off: "Desactivado",
    taxJarTitle: "Alcancía de impuestos",
    taxJarPercent: "Porcentaje de ingresos a apartar",
    taxJarDesc:
      "Muchos trabajadores por cuenta propia apartan el 25–30% de sus ingresos para impuestos.",
    lastBackup: "Último respaldo: {date}",
    neverBackedUp: "Aún no has guardado un respaldo.",
  },

  common: {
    yes: "Sí",
    no: "No",
  },

  header: {
    addBusiness: "＋ Agregar otro negocio",
  },

  insights: {
    title: "💡 Vale la pena mirar",
    late: "⏰ {n} facturas atrasadas — esos son {money} esperándote",
    billsSoon: "📄 {money} en cuentas que vencen en los próximos 7 días",
    catUp: "📈 {category} costó {pct}% más que el mes pasado",
    topCat: "💸 La mayor parte de tu gasto este mes fue en {category} ({money})",
  },

  tour: {
    next: "Siguiente",
    back: "Atrás",
    skip: "Omitir recorrido",
    done: "Listo",
    stepNavT: "Todo vive aquí",
    stepNavB:
      "Estos botones te llevan a tus pantallas: Inicio, Facturas, Cuentas y las demás.",
    stepTotalsT: "Dinero que entra y sale",
    stepTotalsB:
      "Los tres números de arriba muestran lo que entró, lo que salió y lo que queda.",
    stepNewInvoiceT: "Recibe pagos",
    stepNewInvoiceB: "Toca aquí para crear tu primera factura cuando estés listo.",
    stepLangT: "Tu idioma",
    stepLangB: "Cambia entre English y Español cuando quieras.",
    stepHelpT: "¿Necesitas ayuda?",
    stepHelpB: "Toca el ? cuando quieras para ayuda en palabras simples sobre cualquier pantalla.",
  },

  help: {
    title: "Cómo funciona CuentaLibre",
    close: "Cerrar",
    homeT: "🏠 Inicio",
    homeB:
      "Inicio muestra tu dinero de un vistazo: lo que entró, lo que salió y lo que queda. Abajo verás quién te debe, las cuentas por vencer y tus gastos recientes.",
    invoicesT: "🧾 Facturas",
    invoicesB:
      "Una factura es un cobro que le envías a un cliente. Cuando te paga, cuenta como dinero que entró. Las facturas atrasadas se muestran en rojo para que les des seguimiento.",
    quotesT: "📝 Cotizaciones",
    quotesB:
      "Una cotización le dice a un cliente cuánto costará un trabajo antes de empezar. Si acepta, puedes convertirla en factura con un toque.",
    billsT: "📄 Cuentas",
    billsB:
      "Las cuentas son pagos que debes — renta, luz, proveedores. Agregarlas aquí con sus fechas de vencimiento evita que se te pase alguna. Al marcar una como pagada también se registra como gasto.",
    expensesT: "💸 Gastos",
    expensesB:
      "Los gastos son lo que gastas para operar tu negocio — materiales, gasolina, herramientas. Registrarlos mantiene tus cuentas en orden y baja tus impuestos. Puedes adjuntar una foto del recibo.",
    servicesT: "🏷️ Servicios",
    servicesB:
      "Guarda lo que vendes con su precio — un corte de pelo, un corte de césped, una hora de trabajo. Luego toca uno en una factura o cotización y el precio se llena solo.",
    timeT: "⏱️ Horas",
    timeB:
      "Registra las horas que trabajas para cada cliente. Cuando sea hora de cobrar, selecciona las horas, pon tu tarifa por hora y conviértelas en facturas con un toque.",
    mileageT: "🚗 Millaje",
    mileageB:
      "Registra tus viajes de negocio — la fecha, las millas y el motivo. La app las multiplica por la tasa estándar del IRS para calcular tu deducción, y la agrega a tu paquete de impuestos.",
    customersT: "👥 Clientes",
    customersB:
      "Todas las personas a las que les has facturado aparecen aquí, con lo facturado, lo pagado y lo que aún deben.",
    contractorsT: "🤝 Contratistas",
    contractorsB:
      "Las personas a las que les pagas por ayudarte con tu negocio van aquí. CuentaLibre registra lo que le pagaste a cada uno, y marca a quienes superen $600 al año — ahí es cuando el IRS pide el formulario 1099-NEC.",
    loansT: "🏦 Préstamos",
    loansB:
      "Registra el dinero que pediste prestado — un préstamo para la camioneta, una línea de crédito, lo que sea. Anota cada pago y mira cómo baja el saldo, con una pequeña celebración cuando termines de pagarlo.",
    reportsT: "📊 Reportes",
    reportsB:
      "Los reportes convierten tus números en resúmenes descargables: entradas vs salidas, gastos por categoría y una guía de impuestos en palabras simples. El botón del paquete de impuestos crea un archivo que a tu preparador le encantará.",
    taxT: "¿Qué es el impuesto sobre las ventas?",
    taxB:
      "Algunos estados cobran un impuesto sobre lo que vendes. CuentaLibre agrega automáticamente la tasa base de tu estado a tus facturas, pero tu ciudad o condado puede agregar más — siempre verifica tu tasa local.",
    backupT: "¿Cómo funcionan los respaldos?",
    backupB:
      "Ve a Ajustes → Guardar respaldo para descargar un archivo con todo, de todos tus negocios. Guarda una copia en un lugar seguro, como una memoria USB. Abrir respaldo lo restaura todo.",
    donationsT: "❤️ Donaciones",
    donationsB:
      "Registra cada regalo que recibe tu organización — quién dio, cuánto, cuándo y para qué campaña. Con un toque imprimes un recibo válido para el IRS.",
    donorsT: "🙏 Donantes",
    donorsB:
      "Todas las personas que han donado, con sus totales por año — útil para cartas de agradecimiento y tu reporte anual.",
    nfpT: "¿Qué es el Formulario 990?",
    nfpB:
      "La mayoría de las organizaciones sin fines de lucro deben informar sus finanzas al IRS cada año con el Formulario 990. Las pequeñas (menos de $50,000) presentan un formulario corto y gratis en línea. La pantalla de Reportes descubre cuál necesitas y prepara tus números — pero solo el sitio web del IRS puede aceptar la presentación.",
  },

  hints: {
    reports:
      "Los reportes convierten tus entradas y salidas en resúmenes simples que puedes descargar — elige un tipo de reporte y un rango de fechas, y hacemos los cálculos.",
    csvImport:
      "Trae tus movimientos del banco en 3 pasos fáciles: elige tu archivo CSV, relaciona sus columnas y revisa antes de importar.",
    nineNinety:
      "Este asistente descubre qué Formulario 990 necesita tu organización y prepara tus números — la presentación se hace en el sitio web del IRS.",
  },

  reminders: {
    title: "CuentaLibre",
    invDueSoonOne: "🧾 1 factura por vencer",
    invDueSoon: "🧾 {n} facturas por vencer",
    invOverdueOne: "🧾 1 factura vencida",
    invOverdue: "🧾 {n} facturas vencidas",
    billDueSoonOne: "📄 1 cuenta por vencer",
    billDueSoon: "📄 {n} cuentas por vencer",
    billOverdueOne: "📄 1 cuenta vencida",
    billOverdue: "📄 {n} cuentas vencidas",
  },

  taxpackage: {
    title: "Paquete de impuestos",
    desc: "Todo lo que necesita tu preparador de impuestos, en un archivo.",
    year: "Año",
    btn: "📦 Obtener mi paquete de impuestos",
    docTitle: "Paquete de impuestos {year}",
    business: "Negocio",
    typeL: "Tipo",
    stateL: "Estado",
    profitSummary: "Resumen de ganancias",
    income: "Ingresos — dinero que te pagaron tus clientes",
    expensesW: "Gastos — dinero que gastaste en el negocio",
    net: "Neto — lo que queda",
    expensesByCat: "Gastos por categoría",
    salesTaxCollected: "Impuesto sobre las ventas cobrado",
    contractorTitle: "Pagos a contratistas en {year}",
    needs1099: "— necesita el formulario 1099-NEC (más de $600)",
    noContractors: "No hubo pagos a contratistas este año.",
    unpaidTitle: "Facturas sin pagar al final de {year}",
    unpaidNote: "Aún no fueron pagadas, así que no cuentan como ingresos este año.",
    noUnpaid: "Ninguna — todas las facturas fueron pagadas.",
    mileageTitle: "Deducción por millaje {year}",
    mileageSub:
      "Millas de negocio manejadas, valoradas a la tasa estándar del IRS vigente en la fecha de cada viaje.",
    noTrips: "No hay viajes registrados este año.",
    milesLabel: "millas",
    total: "Total",
    preparedNote: "Preparado con CuentaLibre. Llévalo a tu preparador de impuestos.",
  },

  addbiz: {
    title: "Agregar otro negocio",
    nameTitle: "¿Cómo se llama este negocio?",
    nameSub: "Cada negocio tiene sus propias facturas, gastos y cuentas.",
    namePh: "Nombre del negocio",
    bizTitle: "¿Qué tipo de negocio es?",
    bizSub: "Prepararemos las categorías adecuadas para este negocio.",
    stateTitle: "¿En qué estado está?",
    stateSub: "Define la tasa base de impuesto sobre las ventas en sus facturas.",
    statePh: "Elige tu estado…",
    back: "Atrás",
    next: "Continuar",
    create: "Agregar negocio",
    cancel: "Cancelar",
  },

  services: {
    title: "Servicios",
    new: "Nuevo servicio",
    name: "Nombre del servicio",
    namePh: "p. ej. Corte de pelo",
    price: "Precio",
    create: "Agregar servicio",
    saveChanges: "Guardar cambios",
    edit: "Editar",
    delete: "Eliminar",
    confirmDelete: "¿Eliminar este servicio?",
    cancel: "Cancelar",
    pick: "Elige un servicio…",
    emptyTitle: "Aún no hay servicios",
    emptyBody:
      "Guarda lo que vendes con su precio. Luego toca uno para llenar una factura en un segundo.",
  },

  time: {
    title: "Horas",
    new: "Registrar horas",
    customer: "Cliente",
    customerPh: "¿Para quién trabajaste?",
    description: "¿Qué hiciste?",
    descriptionPh: "p. ej. Corte de césped",
    hours: "Horas",
    date: "Fecha",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    confirmDelete: "¿Eliminar este registro?",
    uninvoiced: "Aún no facturado",
    invoiced: "Facturado",
    selected: "{n} seleccionados",
    createInvoice: "Crear factura",
    rate: "Tarifa por hora",
    ratePh: "p. ej. 25",
    total: "Total",
    emptyTitle: "Aún no registras horas",
    emptyBody:
      "Registra las horas que trabajas. Cuando sea hora de cobrar, conviértelas en factura con un toque.",
    created: "¡Factura creada!",
  },

  mileage: {
    title: "Millaje",
    new: "Registrar un viaje",
    date: "Fecha",
    miles: "Millas",
    milesPh: "p. ej. 12.5",
    purpose: "Motivo",
    purposePh: "p. ej. Visita a cliente, compra de materiales",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    confirmDelete: "¿Eliminar este viaje?",
    deduction: "Deducción",
    ytdTitle: "Deducción de este año",
    ytdSub:
      "El IRS te permite deducir {rate} por cada milla de negocio que manejas. Este es tu total acumulado.",
    perMile: "{rate}/milla",
    export: "Exportar CSV",
    emptyTitle: "Aún no registras viajes",
    emptyBody:
      "Registra tus viajes de negocio. La app calcula la deducción del IRS por ti.",
  },

  paymethod: {
    label: "Método de pago",
    cash: "Efectivo",
    card: "Tarjeta",
    transfer: "Transferencia",
    check: "Cheque",
    notSet: "Sin definir",
    breakdown: "Por método de pago",
  },

  goal: {
    cardTitle: "Meta de {month}",
    of: "{done} de {goal}",
    remaining: "Faltan {money}",
    reached: "🎉 ¡Meta alcanzada! Increíble trabajo.",
    setPrompt: "Pon una meta mensual de ingresos en Ajustes para ver tu progreso aquí.",
    monthFmt: "MMMM",
  },

  taxjar: {
    title: "Alcancía de impuestos",
    setAside: "Aparta {money} para impuestos",
    basedOn: "Basado en {money} ganados este mes al {pct}%",
    note: "Un recordatorio amable — no una regla fiscal. Consúltalo con tu preparador.",
    noIncome: "Aún no hay ingresos este mes — nada que apartar.",
  },

  yoy: {
    title: "Este año vs el año pasado",
    incomeUp: "Has ganado {pct}% más que el año pasado 🎉",
    incomeDown: "Has ganado {pct}% menos que el año pasado",
    incomeSame: "Los ingresos están parecidos al año pasado",
    expensesUp: "Los gastos subieron {pct}% vs el año pasado",
    expensesDown: "Los gastos bajaron {pct}% vs el año pasado",
    expensesSame: "Los gastos están parecidos al año pasado",
    ytdNote: "En lo que va del año, hasta {date}",
  },

  statement: {
    button: "Estado de cuenta",
    title: "Estado de cuenta del cliente",
    from: "Desde",
    to: "Hasta",
    invoice: "Factura",
    date: "Fecha",
    amount: "Monto",
    status: "Estado",
    totalOwed: "Total aún adeudado",
    print: "Imprimir / Guardar como PDF",
    noInvoices: "No hay facturas en este período.",
    billedTo: "Facturado a",
  },

  dupes: {
    possibleBadge: "Posible duplicado",
    reviewTitle: "Revisa posibles duplicados",
    reviewSub:
      "Estas filas se parecen a las que ya tienes. Las filas sin marcar no se importarán.",
    warnExpense:
      "Ojo — ya tienes un gasto de {money} por “{desc}” del {date}. ¿Guardar de todos modos?",
    warnInvoice:
      "Ojo — ya tienes una factura de {money} para {customer} del {date}. ¿Guardar de todos modos?",
    saveAnyway: "Guardar de todos modos",
    keepEditing: "Seguir editando",
  },

  loans: {
    title: "Préstamos",
    new: "Agregar préstamo",
    name: "Nombre del préstamo",
    namePh: "p. ej. Préstamo de la camioneta",
    borrowed: "Monto prestado",
    dateBorrowed: "Fecha del préstamo",
    note: "Nota (opcional)",
    balance: "Aún debes",
    paidSoFar: "Pagado hasta ahora",
    logPayment: "Registrar pago",
    paymentAmount: "Monto del pago",
    paymentDate: "Fecha del pago",
    delete: "Borrar",
    confirmDelete: "¿Borrar este préstamo y todos sus pagos?",
    emptyTitle: "Aún no hay préstamos",
    emptyBody:
      "Lleva aquí el dinero que pediste prestado — registra pagos y mira cómo baja el saldo.",
    paidOff: "¡Pagado! 🎉",
    create: "Agregar préstamo",
    cancel: "Cancelar",
    progress: "{pct}% pagado",
  },

  donations: {
    title: "Donaciones",
    new: "Agregar donación",
    donor: "Donante",
    donorPh: "p. ej. María García",
    amount: "Cantidad",
    date: "Fecha",
    campaign: "Campaña (opcional)",
    campaignPh: "p. ej. Colecta navideña 2026",
    create: "Agregar donación",
    save: "Guardar cambios",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Borrar",
    confirmDelete: "¿Borrar esta donación?",
    receipt: "Recibo",
    emptyTitle: "Aún no hay donaciones",
    emptyBody:
      "Registra aquí cada donación — las necesitarás para tu reporte anual del IRS.",
  },

  donors: {
    title: "Donantes",
    emptyTitle: "Aún no hay donantes",
    emptyBody:
      "Aquí aparecen todas las personas que han donado, con sus totales por año.",
    donated: "Donó",
    showDonations: "Ver donaciones",
    hideDonations: "Ocultar donaciones",
  },

  receipt: {
    title: "Recibo de donación",
    orgLine: "Organización",
    einLine: "EIN",
    donorLine: "Donante",
    amountLine: "Cantidad",
    dateLine: "Fecha",
    campaignLine: "Campaña",
    noGoods:
      "No se proporcionaron bienes ni servicios a cambio de esta contribución.",
    keepIt: "Guarda este recibo para tus registros de impuestos.",
    print: "Imprimir / Guardar como PDF",
    close: "Cerrar",
  },

  nonprofit: {
    entityForProfit: "Negocio con fines de lucro",
    entityNonprofit: "Organización sin fines de lucro",
    ein: "EIN",
    einDesc:
      "El número de identificación fiscal de tu organización, emitido por el IRS.",
    fiscalYearEnd: "El año fiscal termina en",
    fiscalYearEndDesc:
      "El mes en que termina el año fiscal de tu organización. La mayoría elige diciembre.",
    mission: "Misión",
    missionDesc:
      "Una o dos frases sobre lo que hace tu organización. Se usa en tu reporte anual.",
  },

  nfp: {
    title: "Reporte anual del IRS",
    desc: "Descubre cuál Formulario 990 presenta tu organización y prepara todo.",
    taxYear: "Año fiscal",
    grossReceipts: "Ingresos brutos",
    grossReceiptsWhy:
      "Todo el dinero que recibió tu organización este año fiscal: donaciones más facturas pagadas.",
    formN: "Formulario 990-N (e-Postcard)",
    formNWhy:
      "Según tus {money} en ingresos, puedes presentar el formulario corto en línea. Es gratis y toma unos minutos.",
    formEZ: "Formulario 990-EZ",
    formEZWhy:
      "Según tus {money} en ingresos, presentas el formulario corto en papel. Nota: aquí no llevamos tus activos — si superan $500,000 debes presentar el Formulario 990 completo.",
    formFull: "Formulario 990 completo",
    formFullWhy:
      "Según tus {money} en ingresos, presentas el Formulario 990 completo. Lleva el resumen financiero a tu preparador de impuestos.",
    deadlineTitle: "Fecha límite",
    deadlineLine: "Tu reporte de {year} vence el {date}.",
    revocationTitle: "No faltes tres años",
    revocationText:
      "Si no presentas el reporte por 3 años seguidos, el IRS cancela automáticamente tu exención de impuestos. Presentarlo cada año te mantiene a salvo.",
    checklistTitle: "Tu lista para el 990-N",
    checklistSub:
      "El formulario en línea hace estas 8 preguntas. Lo que sabemos ya está lleno — lo demás está marcado POR COMPLETAR.",
    cEin: "EIN",
    cTaxYear: "Año fiscal",
    cLegalName: "Nombre legal",
    cAddress: "Dirección postal",
    cWebsite: "Sitio web",
    cReceipts: "Confirma que los ingresos brutos fueron $50,000 o menos",
    cNotTerminated: "Declara que la organización no ha terminado",
    cOfficer: "Nombre del oficial principal",
    toFill: "POR COMPLETAR",
    howTitle: "Cómo presentarlo en el sitio del IRS",
    howSub:
      "CuentaLibre prepara tus números — solo el sitio web del IRS puede aceptar la presentación. Nada se presenta desde esta app.",
    how1:
      'Ve a irs.gov y busca "Form 990-N" para abrir el sistema de presentación e-Postcard.',
    how2: "Crea una cuenta (o inicia sesión) en el sitio del IRS.",
    how3: "Elige el Formulario 990-N y responde las 8 preguntas usando tu lista.",
    how4: "Envíalo antes de la fecha límite y guarda el correo de confirmación.",
    finTitle: "Resumen financiero para tu preparador",
    finSub:
      "Lleva esto a tu preparador de impuestos para el Formulario 990-EZ o el 990 completo.",
    revByCat: "Ingresos por categoría",
    expProgram: "Gastos de programas",
    expFundraising: "Gastos de recaudación",
    expAdmin: "Administración",
    expTotal: "Gastos totales",
    netAssets: "Cambio en activos netos",
    download: "Descargar resumen (CSV)",
    pfNote:
      "Las fundaciones privadas siempre presentan el Formulario 990-PF, un formulario distinto que esta guía no prepara. Habla con tu preparador.",
    cannotFile:
      "Importante: esta app prepara tu reporte — no puede presentarlo. La presentación solo se hace en el sitio web del IRS.",
    disclaimer:
      "CuentaLibre no es un profesional de impuestos. Verifica todo con tu preparador de impuestos.",
    noData: "Aún no hay ingresos registrados para este año fiscal.",
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
