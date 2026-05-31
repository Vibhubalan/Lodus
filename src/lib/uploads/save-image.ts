import { savePublicImage } from "@/lib/uploads/save-public-image";
import { saveToS3 } from "@/lib/uploads/s3";

function useObjectStorage(): boolean {
  return !!(process.env.S3_BUCKET?.trim() && process.env.S3_ACCESS_KEY_ID?.trim());
}

/**
 * Saves an uploaded image and returns a public URL.
 * Uses S3-compatible storage when configured; otherwise writes to public/.
 */
export async function saveImage(
  file: File,
  subdir: string,
  basename: string,
): Promise<string> {
  if (useObjectStorage()) {
    return saveToS3(file, subdir, basename);
  }
  return savePublicImage(file, subdir, basename);
}
