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
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { cacheDir, join } from "@tauri-apps/api/path";
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
  filename: string,
  lang: Lang
): Promise<void> {
  try {
    // cacheDir() exists on every desktop OS and is covered by the fs
    // write permission ($APPDATA on Windows, $HOME on macOS/Linux).
    const dir = await cacheDir();
    const filePath = await join(dir, safeFilename(filename));
    await writeTextFile(filePath, html);
    // openPath opens the .html file with the default browser.
    // (Requires the "opener:allow-open-path" capability.)
    await openPath(filePath);
  } catch {
    // Never fail silently: tell the user something went wrong.
    const t = strings[lang].print;
    try {
      await message(t.failedBody, { title: t.failedTitle, kind: "error" });
    } catch {
      // Last resort — the dialog itself failed; nothing more we can do.
    }
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
