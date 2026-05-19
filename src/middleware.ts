import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = token?.role === "admin";

    // 如果存取 /admin 開頭的網址但不是 admin，則導回首頁
    if (req.nextUrl.pathname.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // 只有登入使用者才能繼續
    },
    pages: {
      signIn: "/login", // 未登入時導向登入頁面
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"], // 保護後台頁面與後台 API
};
