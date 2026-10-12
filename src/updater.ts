import { check, type Update } from "@tauri-apps/plugin-updater";
import { isTauri } from "./external";

/**
 * Auto-update support (desktop only — a no-op in the browser build).
 *
 * The updater plugin, its permissions, and the release endpoint were already
 * configured; this module is the missing frontend half: check on launch,
 * ask the user in plain words, and install when they say yes.
 *
 * Failures are silent on purpose: no internet or no update server must never
 * interrupt someone doing their books.
 */

/** Check once for a new version. Resolves to the pending Update, or null. */
export async function checkForAppUpdate(): Promise<Update | null> {
  if (!isTauri()) return null;
  try {
    return await check();
  } catch {
    // Offline or the update server is unreachable — stay quiet.
    return null;
  }
}

/** Download + install a pending update, reporting 0–100 progress. */
export async function installAppUpdate(
  update: Update,
  onProgress?: (pct: number) => void
): Promise<void> {
  let downloaded = 0;
  let total = 0;
  await update.downloadAndInstall((e) => {
    if (e.event === "Started") {
      total = e.data.contentLength ?? 0;
    } else if (e.event === "Progress") {
      downloaded += e.data.chunkLength;
      if (total > 0 && onProgress) {
        onProgress(Math.min(99, Math.round((downloaded / total) * 100)));
      }
    }
  });
}
