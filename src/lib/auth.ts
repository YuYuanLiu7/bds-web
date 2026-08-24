import { NextAuthOptions, User, getServerSession } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";

// 擴充 NextAuth 既有型別，補上本專案使用到的 id 與 role 欄位，
// 取代原本散落的 `as any`，維持登入流程行為不變
interface AppUser extends Omit<User, "id"> {
  id?: string;
  role?: string;
}
interface AppToken extends JWT {
  id?: string;
  role?: string;
}

// 全專案唯一的 session 使用者型別（先前在 6 個檔案各自重複宣告）
export interface SessionUser {
  id?: string;
  role?: string;
  name?: string | null;
  email?: string | null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 速率限制：同一帳號每 10 分鐘最多 8 次登入嘗試，防止密碼暴力破解
        // 丟出特定錯誤碼讓登入頁能顯示友善的限流訊息（而非一般的帳密錯誤）
        if (!(await rateLimit(`login:${credentials.email.toLowerCase()}`, 8, 600))) {
          console.warn("Login rate limit exceeded for:", credentials.email);
          throw new Error("RATE_LIMIT_EXCEEDED");
        }

        // 從資料庫找使用者
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single();

        if (error || !user) {
          console.log("Auth error or user not found:", error);
          return null;
        }

        // 驗證加密後的密碼
        const isValid = await bcrypt.compare(credentials.password, user.password_hash);

        if (!isValid) {
          console.log("Invalid password for user:", credentials.email);
          return null;
        }

        // 檢查 Email 是否已驗證（若資料表未更新，undefined 將自動放行）
        if (user.is_verified === false) {
          console.log("Email not verified for user:", credentials.email);
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const appUser = user as AppUser;
        const appToken = token as AppToken;
        appToken.role = appUser.role;
        appToken.id = appUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const appToken = token as AppToken;
        const sessionUser = session.user as AppUser;
        sessionUser.role = appToken.role;
        sessionUser.id = appToken.id;
      }
      return session;
    }
  }
};

/** 取得目前登入者（未登入回傳 null） */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as SessionUser;
}

/** requireAdmin 的判定結果：ok 為 true 時帶回管理員，否則帶回應直接回傳的錯誤回應 */
export type AdminAuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; res: NextResponse };

/**
 * 管理員守衛：全站唯一的後台權限檢查。
 * 語意統一為：未登入 → 401；已登入但非管理員 → 403。
 * 用法：
 *   const auth = await requireAdmin();
 *   if (!auth.ok) return auth.res;
 *   // auth.user 為管理員
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, res: NextResponse.json({ error: '未登入' }, { status: 401 }) };
  }
  if (user.role !== 'admin') {
    return { ok: false, res: NextResponse.json({ error: '權限不足' }, { status: 403 }) };
  }
  return { ok: true, user };
}
