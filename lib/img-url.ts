/** Public R2 URL. Optional Cloudflare Image Resizing when CLOUDFLARE_IMAGE_RESIZING=true. */
export const imgBase = () => (process.env.CLOUDFLARE_R2_PUBLIC_URL || "").replace(/\/$/, "");
export function imgUrl(key?: string | null, width = 800): string | null {
  const base = imgBase();
  if (!key || !base) return null;
  return process.env.CLOUDFLARE_IMAGE_RESIZING === "true" ? `${base}/cdn-cgi/image/width=${width},quality=80,format=auto/${key}` : `${base}/${key}`;
}
