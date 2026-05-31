import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const MAX_BYTES = 5 * 1024 * 1024;

function getS3Client() {
  const region = process.env.S3_REGION?.trim() || "auto";
  const endpoint = process.env.S3_ENDPOINT?.trim();
  return new S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle: !!endpoint,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!.trim(),
    },
  });
}

function publicUrlForKey(key: string): string {
  const base = process.env.S3_PUBLIC_URL?.trim()?.replace(/\/$/, "");
  if (base) return `${base}/${key}`;
  const bucket = process.env.S3_BUCKET!.trim();
  const region = process.env.S3_REGION?.trim() || "us-east-1";
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function saveToS3(file: File, subdir: string, basename: string): Promise<string> {
  if (!file?.size) throw new Error("No image file provided.");
  if (file.size > MAX_BYTES) throw new Error("Image must be under 5MB.");
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("Use JPG, PNG, WebP, or GIF.");

  const ext = EXT_BY_TYPE[file.type] ?? ".png";
  const safeBase = basename.replace(/[^a-z0-9-_]/gi, "-").toLowerCase() || "image";
  const key = `${subdir}/${safeBase}-${Date.now()}${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!.trim(),
      Key: key,
      Body: buffer,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return publicUrlForKey(key);
}
