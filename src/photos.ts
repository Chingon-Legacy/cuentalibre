import { open } from "@tauri-apps/plugin-dialog";
import { exists, mkdir, readFile, remove, writeFile } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";
import { isTauri } from "./external";

// Single Tauri check for the whole app: @tauri-apps/api's isTauri()
// (!!window.isTauri, set by the Tauri webview). It used to be a local
// "__TAURI_INTERNALS__" check here while external.ts used the API one —
// both are true on desktop, but one shared check keeps mocks and
// fallbacks honest.
export { isTauri };

const DIR = "receipts";
const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "gif"];

async function receiptsDir(): Promise<string> {
  const base = await appDataDir();
  const dir = await join(base, DIR);
  if (!(await exists(dir))) await mkdir(dir, { recursive: true });
  return dir;
}

export interface PickedImage {
  bytes: Uint8Array;
  ext: string;
}

/** Tauri: let the user pick an image file and read its bytes. */
export async function pickImageBytes(): Promise<PickedImage | null> {
  const picked = await open({
    filters: [{ name: "Images", extensions: IMAGE_EXTS }],
    multiple: false,
  });
  if (!picked) return null;
  const p = picked as string;
  const bytes = await readFile(p);
  const rawExt = (p.split(".").pop() || "jpg").toLowerCase();
  return { bytes, ext: IMAGE_EXTS.includes(rawExt) ? rawExt : "jpg" };
}

/** Tauri: store the photo on disk under app-data/receipts/. Returns the stored filename. */
export async function saveReceiptPhoto(
  expenseId: number,
  img: PickedImage
): Promise<string> {
  const dir = await receiptsDir();
  const fileName = `${expenseId}_${Date.now()}.${img.ext}`;
  await writeFile(await join(dir, fileName), img.bytes);
  return `${DIR}/${fileName}`;
}

/** Tauri: delete a stored photo file. No-op for data URLs and missing files. */
export async function deleteReceiptPhoto(stored: string | null): Promise<void> {
  if (!stored || stored.startsWith("data:")) return;
  try {
    await remove(await join(await appDataDir(), stored));
  } catch {
    // File already gone — nothing to do.
  }
}

/** Resolve a stored photo value to something an <img> can display. */
export async function receiptPhotoUrl(stored: string | null): Promise<string | null> {
  if (!stored) return null;
  if (stored.startsWith("data:")) return stored;
  return convertFileSrc(await join(await appDataDir(), stored));
}

/**
 * Browser fallback: downscale an image to a data URL.
 *
 * NOTE: data URLs live inside the SQLite row itself, so big photos bloat the
 * database and the backup files. We downscale to a small JPEG to keep rows
 * small. In Tauri we store the file on disk instead and keep only the
 * filename — no size tradeoff there.
 */
export function fileToDownscaledDataUrl(file: File, maxDim = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("no canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad image"));
    };
    img.src = url;
  });
}
