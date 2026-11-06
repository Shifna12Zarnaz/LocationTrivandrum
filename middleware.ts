import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });
  const p = req.nextUrl.pathname;
  if (p.startsWith("/admin/login")) return res;
  const token = req.cookies.get("firebase_token")?.value;
  if (!token) return NextResponse.redirect(new URL("/admin/login", req.url));
  return res;
}
export const config = { matcher: ["/admin/:path*"] };
