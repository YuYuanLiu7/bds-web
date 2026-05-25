import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export const proxy = withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const isAdmin = token?.role === "admin";

    console.log(`🛡️ [Proxy Interceptor] Path: ${req.nextUrl.pathname} | User: ${token?.email || "Guest"} | Role: ${token?.role || "None"} | IsAdmin: ${isAdmin}`);

    // 如果存取 /admin 開頭的網址但不是 admin，則導回首頁
    if (req.nextUrl.pathname.startsWith("/admin") && !isAdmin) {
      console.log(`🚫 [Proxy Blocked] Non-admin access to ${req.nextUrl.pathname}. Redirecting to /`);
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        const hasToken = !!token;
        console.log(`🔐 [Proxy Auth Guard] Checking token presence: ${hasToken}`);
        return hasToken; // 只有登入使用者才能繼續
      },
    },
    pages: {
      signIn: "/login", // 未登入時導向登入頁面
    },
  }
);

export const config = {
  // 保護後台首頁、所有後台子頁面與後台 API
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
