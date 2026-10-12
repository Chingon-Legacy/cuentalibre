/**
 * Open a generated print document where the user can print it or save
 * it as a PDF.
 *
 * Inside the Tauri desktop app, window.print() does not reach a real
 * print pipeline, so the document is written to a temp HTML file and
 * opened in the user's system browser (openPath hands the .html file to
 * the default browser), where printing works normally.
 *
 * In a regular browser (dev/preview), a new window is opened and the
 * HTML is written into it; if the popup is blocked, the file downloads
 * instead so nothing is lost.
 */
import { mkdir, writeTextFile } from "@tauri-apps/plugin-fs";
import { appDataDir, downloadDir, join } from "@tauri-apps/api/path";
import { openPath } from "@tauri-apps/plugin-opener";
import { message } from "@tauri-apps/plugin-dialog";
import { isTauri } from "./external";
import { strings } from "./i18n";
import type { Lang } from "./types";

/** Make a filename safe for every OS; callers should already pass simple names. */
function safeFilename(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
  const base = clean || "document";
  return base.toLowerCase().endsWith(".html") ? base : `${base}.html`;
}

async function openInTauri(
  html: string,
  _filename: string,
  lang: Lang
): Promise<void> {
  const t = strings[lang].print;
  let lastError: unknown = null;
  // Candidate locations for the temporary print file, tried in order.
  // The app-data folder is preferred (no clutter); Downloads is the
  // fallback because it is guaranteed to exist and be writable.
  const candidates: Array<() => Promise<string>> = [
    async () => {
      const dir = await appDataDir();
      // writeTextFile does not create parent folders — create it first.
      await mkdir(dir, { recursive: true });
      // Fixed temp name: overwritten on every print, so no buildup of files.
      return join(dir, "cuentalibre-print.html");
    },
    async () => join(await downloadDir(), "cuentalibre-print.html"),
  ];
  for (const locate of candidates) {
    try {
      const filePath = await locate();
      await writeTextFile(filePath, html);
      // openPath hands the .html file to the default browser.
      // (Requires the "opener:allow-open-path" capability.)
      await openPath(filePath);
      return; // success — document is open in the browser
    } catch (e) {
      lastError = e;
    }
  }
  // Every location failed: show the real error so the cause is visible
  // instead of a generic "something went wrong".
  const detail =
    lastError instanceof Error ? lastError.message : String(lastError);
  try {
    await message(`${t.failedBody}\n\n${detail}`, {
      title: t.failedTitle,
      kind: "error",
    });
  } catch {
    // Last resort — the dialog itself failed; nothing more we can do.
  }
}

function openInBrowser(html: string, filename: string): void {
  const win = window.open("", "_blank", "noopener");
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    return;
  }
  // Popup blocked — download the file instead so the user still gets it.
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeFilename(filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function openPrintDocument(
  html: string,
  filename: string,
  lang: Lang
): Promise<void> {
  if (isTauri()) {
    await openInTauri(html, filename, lang);
  } else {
    openInBrowser(html, filename);
  }
}
