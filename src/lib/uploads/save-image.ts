import { savePublicImage } from "@/lib/uploads/save-public-image";
import { saveToS3 } from "@/lib/uploads/s3";
import {
  canWritePublicUploads,
  hasObjectStorage,
  UploadStorageUnavailableError,
} from "@/lib/uploads/storage-capability";

/**
 * Saves an uploaded image and returns a public URL.
 * Uses S3-compatible storage when configured; otherwise writes to public/ (local dev only).
 */
export async function saveImage(
  file: File,
  subdir: string,
  basename: string,
): Promise<string> {
  if (hasObjectStorage()) {
    return saveToS3(file, subdir, basename);
  }
  if (!canWritePublicUploads()) {
    throw new UploadStorageUnavailableError();
  }
  return savePublicImage(file, subdir, basename);
}
