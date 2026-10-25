import { S3Client, DeleteObjectCommand, CopyObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const r2Configured = () => !!(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_R2_ACCESS_KEY_ID && process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY && process.env.CLOUDFLARE_R2_BUCKET);

const client = () => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing R2 configuration. Check CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, and CLOUDFLARE_R2_SECRET_ACCESS_KEY env vars.");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
};

const Bucket = () => {
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;
  if (!bucket) {
    throw new Error("Missing CLOUDFLARE_R2_BUCKET env var.");
  }
  return bucket;
};

export const presignPut = async (Key: string, ContentType: string, _ContentLength: number) => {
  try {
    // Do not sign ContentLength here. Browsers cannot reliably expose or send
    // that header on an XMLHttpRequest PUT, which makes R2 reject the upload.
    return await getSignedUrl(client(), new PutObjectCommand({ Bucket: Bucket(), Key, ContentType }), { expiresIn: 300 });
  } catch (e) {
    console.error("Failed to generate presigned URL:", e);
    throw new Error("Could not generate upload URL. Check R2 configuration.");
  }
};

export const putObject = async (Key: string, Body: Uint8Array, ContentType: string) => {
  await client().send(new PutObjectCommand({ Bucket: Bucket(), Key, Body, ContentType }));
};

export const deleteObject = async (Key: string) => {
  try {
    await client().send(new DeleteObjectCommand({ Bucket: Bucket(), Key }));
  } catch (e) {
    console.error("Failed to delete object from R2:", e);
    throw e;
  }
};

export const copyObject = async (from: string, to: string) => {
  try {
    await client().send(new CopyObjectCommand({ Bucket: Bucket(), Key: to, CopySource: `${Bucket()}/${from}` }));
  } catch (e) {
    console.error("Failed to copy object in R2:", e);
    throw e;
  }
};
