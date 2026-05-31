import fs from "fs";
import path from "path";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 5 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/** Saves an uploaded image under `public/{subdir}/` and returns the public URL path. */
export async function savePublicImage(
  file: File,
  subdir: string,
  basename: string,
): Promise<string> {
  if (!file?.size) {
    throw new Error("No image file provided.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be under 5MB.");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Use JPG, PNG, WebP, or GIF.");
  }

  const ext = EXT_BY_TYPE[file.type] ?? ".png";
  const safeBase = basename.replace(/[^a-z0-9-_]/gi, "-").toLowerCase() || "image";
  const filename = `${safeBase}-${Date.now()}${ext}`;
  const dir = path.join(process.cwd(), "public", subdir);
  fs.mkdirSync(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(dir, filename), buffer);

  return `/${subdir}/${filename}`.replace(/\\/g, "/");
}
