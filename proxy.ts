import { NextResponse, type NextRequest } from "next/server";
// Firebase Auth is initialized in the browser. The workspace performs the
// auth-state check before rendering protected content; this proxy intentionally
// does not inspect Firebase client storage or trust an unsigned cookie.
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard/:path*", "/analyze/:path*", "/history/:path*", "/settings/:path*", "/help/:path*", "/profile/:path*"]
};

