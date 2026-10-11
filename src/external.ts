import { openUrl } from "@tauri-apps/plugin-opener";

/**
 * Open an external link in the user's system browser.
 *
 * Inside the Tauri desktop app, plain window.open() does not reach the
 * system browser, so we use the opener plugin. In a regular web browser
 * (dev/preview), the plugin call fails and we fall back to window.open.
 */
export async function openExternal(url: string): Promise<void> {
  try {
    await openUrl(url);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}
