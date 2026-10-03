import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function r2Client() {
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) throw new Error("Missing Cloudflare R2 environment variables");
  return new S3Client({ region: "auto", endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });
}

export async function createUploadUrl(key: string, contentType: string, contentLength: number) {
  if (!process.env.R2_BUCKET) throw new Error("Missing R2_BUCKET");
  const client = r2Client();
  const command = new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, ContentType: contentType, ContentLength: contentLength });
  return getSignedUrl(client, command, { expiresIn: 300 });
}
