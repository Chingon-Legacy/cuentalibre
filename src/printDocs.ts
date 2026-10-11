/**
 * Professional print documents for CuentaLibre.
 *
 * The installed desktop app (Tauri) cannot rely on window.print(), so the
 * print buttons now generate a complete standalone HTML document (inline
 * styles only, no external assets) and hand it to openPrintDocument()
 * in src/printOpen.ts, which opens it in the system browser where the
 * user prints or saves it as a PDF.
 *
 * Every value shown comes from the app's own records — nothing is made
 * up. Callers pass already-localized labels (status, payment method,
 * category) and raw dates; money/date formatting happens here.
 */
import { fmtDate, fmtMoney } from "./i18n";
import type { Strings } from "./i18n";
import type { Lang } from "./types";

export interface InvoicePrintData {
  bizName: string;
  number: string;
  customer: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: string; // already-localized label
  payMethod: string | null; // already-localized label
  category: string; // already-localized label
  subtotal: number;
  taxLabel: string | null; // e.g. "Sales tax (7%)", already localized
  taxAmount: number;
  total: number;
  amountDue: number;
}

export interface DonationReceiptPrintData {
  orgName: string;
  ein: string | null;
  receiptNo: string;
  donor: string;
  amount: number;
  date: string; // YYYY-MM-DD
  campaign: string | null;
}

export interface StatementRowPrint {
  number: string;
  date: string; // YYYY-MM-DD (the invoice due date)
  amount: number;
  status: string; // already-localized label
}

export interface StatementPrintData {
  bizName: string;
  customerName: string;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  rows: StatementRowPrint[];
  totalBilled: number;
  totalPaid: number;
  balanceDue: number;
}

/** Escape user-entered text so it can't break the document markup. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Shared print-friendly stylesheet for all three documents. */
function baseCss(): string {
  return `
    * { box-sizing: border-box; }
    @page { margin: 18mm; }
    body {
      font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      margin: 0;
      padding: 32px;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }
    .doc-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      padding-bottom: 16px;
      border-bottom: 3px solid #1877F2;
      margin-bottom: 24px;
    }
    .biz-name {
      color: #1877F2;
      font-size: 26px;
      font-weight: 700;
      margin: 0 0 4px;
    }
    .doc-title {
      font-size: 30px;
      font-weight: 700;
      letter-spacing: 1px;
      margin: 0;
      text-align: right;
    }
    .doc-title-alt {
      font-size: 13px;
      color: #6b7280;
      letter-spacing: 1px;
      margin: 2px 0 0;
      text-align: right;
    }
    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 32px;
      margin-bottom: 24px;
    }
    .meta .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #6b7280;
      margin-bottom: 2px;
    }
    .meta .value { font-size: 15px; font-weight: 600; }
    table.items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    table.items th {
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #6b7280;
      padding: 8px 10px;
      border-bottom: 2px solid #1a1a1a;
    }
    table.items td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    table.items th.num, table.items td.num {
      text-align: right;
      white-space: nowrap;
    }
    .totals {
      margin-left: auto;
      width: 300px;
      margin-top: 12px;
    }
    .totals .row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
    }
    .totals .row.grand {
      font-size: 18px;
      font-weight: 700;
      border-top: 2px solid #1a1a1a;
      margin-top: 6px;
      padding-top: 10px;
    }
    .footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
      text-align: center;
    }
    .footer p { margin: 4px 0; }
    .thanks { font-size: 14px; color: #1a1a1a; font-weight: 600; }
  `;
}

function docShell(lang: Lang, titleTag: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titleTag)}</title>
<style>${baseCss()}</style>
</head>
<body>
${body}
</body>
</html>`;
}

function header(
  bizName: string,
  title: string,
  titleAlt: string
): string {
  return `<div class="doc-head">
  <div>
    <p class="biz-name">${esc(bizName)}</p>
  </div>
  <div>
    <p class="doc-title">${esc(title)}</p>
    <p class="doc-title-alt">${esc(titleAlt)}</p>
  </div>
</div>`;
}

function metaRow(label: string, value: string): string {
  return `<div>
    <div class="label">${esc(label)}</div>
    <div class="value">${esc(value)}</div>
  </div>`;
}

/**
 * Invoice document. The app's invoices have no per-item lines — each
 * invoice is a single amount with a category — so the table shows the
 * one item (the category), then the tax and total rows. This mirrors
 * exactly what the invoice modal shows, only prettier.
 */
export function printInvoiceHTML(
  data: InvoicePrintData,
  lang: Lang,
  t: Strings
): string {
  const money = (n: number) => esc(fmtMoney(n, lang));

  const body = `
${header(data.bizName, t.print.invoiceTitle, t.print.invoiceTitleAlt)}

<div class="meta">
  ${metaRow(t.invoices.billTo, data.customer)}
  ${metaRow(t.invoices.number, "#" + (data.number || "—"))}
  ${metaRow(t.invoices.issueDate, fmtDate(data.issueDate, lang))}
  ${metaRow(t.invoices.dueDate, fmtDate(data.dueDate, lang))}
  ${metaRow(t.print.status, data.status)}
  ${data.payMethod ? metaRow(t.print.payMethod, data.payMethod) : ""}
</div>

<table class="items">
  <thead>
    <tr>
      <th>${esc(t.print.description)}</th>
      <th class="num">${esc(t.invoices.amount)}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>${esc(data.category)}</td>
      <td class="num">${money(data.subtotal)}</td>
    </tr>
    ${
      data.taxAmount > 0 && data.taxLabel
        ? `<tr>
      <td>${esc(data.taxLabel)}</td>
      <td class="num">${money(data.taxAmount)}</td>
    </tr>`
        : ""
    }
  </tbody>
</table>

<div class="totals">
  <div class="row grand">
    <span>${esc(t.print.amountDueLine)}</span>
    <span>${money(data.amountDue)}</span>
  </div>
</div>

<div class="footer">
  <p class="thanks">${esc(t.print.thankYou)}</p>
  <p>${esc(t.print.madeWith)}</p>
</div>`;

  return docShell(lang, `${t.print.invoiceTitle} #${data.number || "—"}`, body);
}

/**
 * Donation receipt document for nonprofits. Reuses the receipt strings
 * that already live in the i18n dictionaries, including the IRS
 * "no goods or services" language.
 */
export function printDonationReceiptHTML(
  data: DonationReceiptPrintData,
  lang: Lang,
  t: Strings
): string {
  const body = `
${header(data.orgName, t.print.donationTitle, t.print.donationTitleAlt)}

<div class="meta">
  ${metaRow(t.print.receiptNo, data.receiptNo)}
  ${metaRow(t.receipt.dateLine, fmtDate(data.date, lang))}
  ${metaRow(t.receipt.orgLine, data.orgName)}
  ${data.ein ? metaRow(t.receipt.einLine, data.ein) : ""}
  ${metaRow(t.receipt.donorLine, data.donor)}
  ${
    data.campaign
      ? metaRow(t.receipt.campaignLine, data.campaign)
      : ""
  }
</div>

<table class="items">
  <thead>
    <tr>
      <th>${esc(t.print.description)}</th>
      <th class="num">${esc(t.receipt.amountLine)}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>${esc(t.donations.title)}</td>
      <td class="num"><strong>${esc(fmtMoney(data.amount, lang))}</strong></td>
    </tr>
  </tbody>
</table>

<div class="footer">
  <p>${esc(t.receipt.noGoods)}</p>
  <p>${esc(t.receipt.keepIt)}</p>
  <p style="margin-top:12px">${esc(t.print.madeWith)}</p>
</div>`;

  return docShell(lang, `${t.print.donationTitle} ${data.receiptNo}`, body);
}

/**
 * Customer statement: every invoice for one customer inside the date
 * range the statement screen is showing (filtered by due date),
 * with total billed, total paid, and balance due over that range.
 */
export function printStatementHTML(
  data: StatementPrintData,
  lang: Lang,
  t: Strings
): string {
  const money = (n: number) => esc(fmtMoney(n, lang));

  const rows =
    data.rows.length === 0
      ? `<tr><td colspan="4">${esc(t.statement.noInvoices)}</td></tr>`
      : data.rows
          .map(
            (r) => `<tr>
      <td>#${esc(r.number || "—")}</td>
      <td>${esc(fmtDate(r.date, lang))}</td>
      <td class="num">${money(r.amount)}</td>
      <td>${esc(r.status)}</td>
    </tr>`
          )
          .join("\n");

  const body = `
${header(data.bizName, t.print.statementTitle, t.print.statementTitleAlt)}

<div class="meta">
  ${metaRow(t.statement.billedTo, data.customerName)}
  ${metaRow(`${t.statement.from} – ${t.statement.to}`, `${fmtDate(data.from, lang)} – ${fmtDate(data.to, lang)}`)}
</div>

<table class="items">
  <thead>
    <tr>
      <th>${esc(t.statement.invoice)}</th>
      <th>${esc(t.statement.date)}</th>
      <th class="num">${esc(t.statement.amount)}</th>
      <th>${esc(t.statement.status)}</th>
    </tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>

<div class="totals">
  <div class="row">
    <span>${esc(t.print.totalBilled)}</span>
    <span>${money(data.totalBilled)}</span>
  </div>
  <div class="row">
    <span>${esc(t.print.totalPaid)}</span>
    <span>${money(data.totalPaid)}</span>
  </div>
  <div class="row grand">
    <span>${esc(t.print.balanceDue)}</span>
    <span>${money(data.balanceDue)}</span>
  </div>
</div>

<div class="footer">
  <p class="thanks">${esc(t.print.thankYou)}</p>
  <p>${esc(t.print.madeWith)}</p>
</div>`;

  return docShell(lang, `${t.print.statementTitle} — ${data.customerName}`, body);
}
