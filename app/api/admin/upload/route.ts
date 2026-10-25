import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin/auth";
import { putObject, r2Configured } from "@/lib/r2";
import { imgBase } from "@/lib/img-url";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
const FOLDERS = new Set(["dishes", "categories", "slides", "offers", "brand", "interior", "general"]);
const MAX = 6 * 1024 * 1024;
export const dynamic = "force-dynamic";

// Simple per-admin limiter: 30 uploads / minute. Per server instance. Enough to stop runaway loops, not a DDoS shield.
const hits = new Map<string, number[]>();
function limited(id: string) {
  const now = Date.now(), list = (hits.get(id) || []).filter((t) => now - t < 60_000);
  list.push(now); hits.set(id, list);
  return list.length > 30;
}

export async function POST(req: Request) {
  const a = await getAdmin().catch(() => null);
  if (!a) return NextResponse.json({ error: "Sign in again to upload." }, { status: 401 });
  if (limited(a.user.id)) return NextResponse.json({ error: "Too many uploads. Wait a minute and try again." }, { status: 429 });
  if (!r2Configured()) {
    console.error("R2 not configured - missing env vars:", {
      hasAccountId: !!process.env.CLOUDFLARE_ACCOUNT_ID,
      hasAccessKey: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      hasBucket: !!process.env.CLOUDFLARE_R2_BUCKET,
    });
    return NextResponse.json({ error: "Image storage is not set up yet. Add the Cloudflare R2 settings." }, { status: 503 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const folderInput = form?.get("folder");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  const contentType = file.type;
  const size = file.size;
  const ext = TYPES[contentType];
  if (!ext) return NextResponse.json({ error: "Use a JPG, PNG, WebP or AVIF image." }, { status: 400 });
  if (!Number.isInteger(size) || size <= 0 || size > MAX) return NextResponse.json({ error: "Image is too large. Maximum is 6 MB." }, { status: 400 });
  const folder = typeof folderInput === "string" && FOLDERS.has(folderInput) ? folderInput : "general";
  const key = `${folder}/${crypto.randomUUID()}.${ext}`; // unique key per upload: no stale cache after replacing
  try {
    await putObject(key, new Uint8Array(await file.arrayBuffer()), contentType);
    const { error } = await a.sb.from("images").insert({ object_key: key, content_type: contentType, size_bytes: size, folder, status: "pending", uploaded_by: a.user.id });
    if (error) throw error;
    return NextResponse.json({ key, publicUrl: imgBase() ? `${imgBase()}/${key}` : null });
  } catch (e) {
    const err = e as Error;
    console.error(JSON.stringify({ level: "error", where: "presign", msg: err.message, stack: err.stack }));
    return NextResponse.json({ error: `Could not start the upload: ${err.message}` }, { status: 500 });
  }
}
