/** S3-compatible object storage (R2, S3, etc.). */
export function hasObjectStorage(): boolean {
  return !!(process.env.S3_BUCKET?.trim() && process.env.S3_ACCESS_KEY_ID?.trim());
}

/** Local `public/` writes work in dev and on traditional Node hosts, not Vercel serverless. */
export function canWritePublicUploads(): boolean {
  if (hasObjectStorage()) return true;
  if (process.env.VERCEL === "1") return false;
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return false;
  return true;
}

export class UploadStorageUnavailableError extends Error {
  constructor() {
    super(
      "Image uploads are not available on this host without S3-compatible storage. " +
        "Set S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY on Vercel (see .env.example), " +
        "or save without a photo.",
    );
    this.name = "UploadStorageUnavailableError";
  }
}

export function isUploadStorageUnavailableError(err: unknown): boolean {
  return err instanceof UploadStorageUnavailableError;
}
