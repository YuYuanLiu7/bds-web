import { NextAuthOptions, User, getServerSession } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";

// 防呆：NEXTAUTH_URL 被填成「非網址」時（常見的部署設定失誤，例如把說明文字貼進去），
// NextAuth 初始化會以它 new URL() 而讓整個建置崩潰。這裡在載入時先檢查，
// 值不合法就移除，讓 NextAuth 改由請求主機自動推斷（部署後填入正確值即恢復正常）。
if (process.env.NEXTAUTH_URL) {
  try {
    new URL(process.env.NEXTAUTH_URL);
  } catch {
    console.warn(`[auth] NEXTAUTH_URL 不是有效網址，已暫時忽略：${process.env.NEXTAUTH_URL}`);
    delete process.env.NEXTAUTH_URL;
  }
}

// 擴充 NextAuth 既有型別，補上本專案使用到的 id 與 role 欄位，
// 取代原本散落的 `as any`，維持登入流程行為不變
interface AppUser extends Omit<User, "id"> {
  id?: string;
  role?: string;
  pca?: string | null; // password_changed_at（登入當下的快照）
}
interface AppToken extends JWT {
  id?: string;
  role?: string;
  roleCheckedAt?: number; // 上次向資料庫確認 role 的時間戳（毫秒），用於定期刷新
  pca?: string | null;    // 登入時的 password_changed_at；與 DB 值不符即代表密碼已變更、token 應失效
}

// 每隔多久重新向資料庫確認一次使用者 role（撤銷管理員後最長生效時間）
const ROLE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

// 「查無帳號」時仍執行一次等成本的雜湊比對，抹平回應時間差，
// 避免以登入回應快慢推斷 email 是否存在（時序側通道帳號枚舉）。此為公開的假雜湊，非機密。
const DUMMY_PASSWORD_HASH = '$2b$12$mGnVv1Sd6XtU4nRBgkrMquCYy51uUer/hoh9onnjwBXadwPsiY1Be';

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

        // 一律正規化（去空白、轉小寫）後才比對，與註冊寫入時一致，避免大小寫造成登不進去
        const email = credentials.email.trim().toLowerCase();

        // 速率限制：同一帳號每 10 分鐘最多 8 次登入嘗試，防止密碼暴力破解
        // 登入屬安全關鍵端點，故 failClosed：限流機制異常時「拒絕」而非放行，
        // 避免限流失效時任人暴力破解（正常部署已建立 check_rate_limit RPC，不會誤擋）
        // 丟出特定錯誤碼讓登入頁能顯示友善的限流訊息（而非一般的帳密錯誤）
        if (!(await rateLimit(`login:${email}`, 8, 600, { failClosed: true }))) {
          console.warn("Login rate limit exceeded (or rate-limit unavailable) for:", email);
          throw new Error("RATE_LIMIT_EXCEEDED");
        }

        // 從資料庫找使用者
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (error || !user) {
          // 查無帳號也跑一次假雜湊，讓「帳號不存在」與「密碼錯誤」的回應時間相近
          await bcrypt.compare(credentials.password, DUMMY_PASSWORD_HASH).catch(() => {});
          console.log("Auth error or user not found");
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
          pca: user.password_changed_at ?? null,
        } as unknown as User;
      }
    })
  ],
  // JWT session：效期由預設 30 天下修為 7 天，並每天滾動續期，
  // 縮短 token 一旦外洩後可被濫用的時間窗（搭配下方密碼變更即失效機制）。
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      const appToken = token as AppToken;

      // 登入當下：寫入 role/id 並記錄確認時間
      if (user) {
        const appUser = user as AppUser;
        appToken.role = appUser.role;
        appToken.id = appUser.id;
        appToken.pca = appUser.pca ?? null;
        appToken.roleCheckedAt = Date.now();
        return token;
      }

      // 後續請求：每隔 ROLE_REFRESH_INTERVAL_MS 從資料庫重新確認 role 與密碼變更時間，
      // 讓「撤銷管理員」與「重設密碼即登出舊 token」最長於該區間內生效。
      const last = appToken.roleCheckedAt ?? 0;
      if (appToken.email && Date.now() - last > ROLE_REFRESH_INTERVAL_MS) {
        try {
          const { data } = await supabase
            .from('users')
            .select('role, password_changed_at')
            .eq('email', appToken.email)
            .single();
          if (data) {
            appToken.role = data.role;
            // 密碼變更後，DB 的 password_changed_at 會與 token 內快照不符 → 撤銷此 token 的授權
            const dbPca = data.password_changed_at ?? null;
            if (dbPca !== (appToken.pca ?? null)) {
              appToken.id = undefined;
              appToken.role = undefined;
            }
          }
          appToken.roleCheckedAt = Date.now();
        } catch {
          // 資料庫暫時異常時保留既有 role，不阻斷既有登入
        }
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
