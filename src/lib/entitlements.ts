import { supabase } from './supabase';
import type { SessionUser } from './auth';

/**
 * 權益模組（Entitlements）：全站唯一的「誰買了什麼、誰能看什麼」規則所在地。
 *
 * 讀取端： canAccess / ownsCourse / ownsDownload / ownedDownloadIds /
 *          hasActiveMembership / getMembershipStatus
 * 發放端： grantCourse / grantCourses / revokeCourse / revokeAllCourses /
 *          grantDownload / grantMembership
 * 純函式： computeMembershipExpiry
 *
 * 之前這些規則散落在 7 個讀取點與 4 個發放點，彼此不一致
 * （例如會員頁忘了檢查到期日）。任何權限規則的修改都應集中在此。
 */

// ── 資源描述：canAccess 的判斷對象 ──
export type Resource =
  | { kind: 'course'; id: string }
  | { kind: 'download'; id: string; price?: number | null }
  | { kind: 'article'; visibility?: string | null; requiredCourseIds?: string | null }
  | { kind: 'membership' };

// ── 純函式 ──

/**
 * 依付款週期計算會員到期日（ISO 字串）。
 * '月繳' → +1 個月；'年繳' → +1 年；'一次性' 或未知 → null（永久，不臆測週期）。
 */
export function computeMembershipExpiry(
  period: string | null | undefined,
  from: Date = new Date()
): string | null {
  const d = new Date(from.getTime());
  if (period === '月繳') {
    d.setMonth(d.getMonth() + 1);
    return d.toISOString();
  }
  if (period === '年繳') {
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString();
  }
  return null;
}

// ── 讀取端 ──

/** 是否擁有單堂課程觀看權限（user_courses 有紀錄） */
export async function ownsCourse(userId: string, courseId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_courses')
    .select('course_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();
  return !error && !!data;
}

/** 是否擁有任一指定課程（文章 course_purchasers 解鎖用） */
export async function ownsAnyCourse(userId: string, courseIds: string[]): Promise<boolean> {
  if (courseIds.length === 0) return false;
  const { data, error } = await supabase
    .from('user_courses')
    .select('course_id')
    .eq('user_id', userId)
    .in('course_id', courseIds);
  return !error && !!data && data.length > 0;
}

/** 是否擁有指定數位下載 */
export async function ownsDownload(userId: string, downloadId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_downloads')
    .select('download_id')
    .eq('user_id', userId)
    .eq('download_id', downloadId)
    .maybeSingle();
  return !error && !!data;
}

/** 取得使用者已擁有的所有數位下載 ID（前台下載頁顯示解鎖狀態用） */
export async function ownedDownloadIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_downloads')
    .select('download_id')
    .eq('user_id', userId);
  if (error || !data) return [];
  return data.map((r: { download_id: string }) => r.download_id);
}

/** 會員狀態：方案、到期日與是否有效（到期日 null 視為永久） */
export async function getMembershipStatus(
  userId: string
): Promise<{ planId: string | null; expiresAt: string | null; active: boolean }> {
  const { data, error } = await supabase
    .from('users')
    .select('membership_plan_id, membership_expires_at')
    .eq('id', userId)
    .single();

  if (error || !data || !data.membership_plan_id) {
    return { planId: null, expiresAt: null, active: false };
  }
  const active =
    !data.membership_expires_at ||
    new Date(data.membership_expires_at).getTime() > Date.now();
  return {
    planId: data.membership_plan_id,
    expiresAt: data.membership_expires_at,
    active,
  };
}

/**
 * 判斷使用者是否為「有效付費會員」：
 *  - 必須有 membership_plan_id
 *  - membership_expires_at 為 null 視為永久（一次性方案）
 *  - 否則到期日需晚於現在
 */
export async function hasActiveMembership(userId: string): Promise<boolean> {
  return (await getMembershipStatus(userId)).active;
}

/**
 * 統一的存取判斷：管理員一律放行；其餘依資源種類套用對應規則。
 * user 傳 null/undefined 代表未登入。
 */
export async function canAccess(
  user: SessionUser | null | undefined,
  resource: Resource
): Promise<boolean> {
  if (user?.role === 'admin') return true;

  switch (resource.kind) {
    case 'course':
      return !!user?.id && (await ownsCourse(user.id, resource.id));

    case 'download': {
      if ((resource.price || 0) <= 0) return true; // 免費商品
      return !!user?.id && (await ownsDownload(user.id, resource.id));
    }

    case 'article': {
      const visibility = resource.visibility || 'public';
      if (visibility === 'public') return true;
      if (!user?.id) return false;
      if (visibility === 'members') {
        // 會員限定文章需為「有效付費會員」（含到期日判斷），僅登入不足以解鎖
        return hasActiveMembership(user.id);
      }
      if (visibility === 'course_purchasers') {
        const requiredIds = (resource.requiredCourseIds || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        return ownsAnyCourse(user.id, requiredIds);
      }
      return false;
    }

    case 'membership':
      return !!user?.id && (await hasActiveMembership(user.id));
  }
}

// ── 發放端 ──

/** 開通單堂課程觀看權限（重複發放安全：upsert） */
export async function grantCourse(userId: string, courseId: string): Promise<void> {
  await supabase.from('user_courses').upsert({
    user_id: userId,
    course_id: courseId,
    purchased_at: new Date().toISOString(),
  });
}

/** 批次開通多堂課程（後台建立/編輯學員用）；回傳錯誤讓呼叫端決定是否僅記錄 */
export async function grantCourses(
  userId: string,
  courseIds: string[]
): Promise<{ error: Error | null }> {
  if (courseIds.length === 0) return { error: null };
  const rows = courseIds.map((courseId) => ({
    user_id: userId,
    course_id: courseId,
    purchased_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from('user_courses').insert(rows);
  return { error: error ? new Error(error.message) : null };
}

/** 取消單堂課程授權 */
export async function revokeCourse(userId: string, courseId: string): Promise<void> {
  await supabase
    .from('user_courses')
    .delete()
    .eq('user_id', userId)
    .eq('course_id', courseId);
}

/** 清空使用者所有課程授權（後台重設勾選用）；回傳錯誤讓呼叫端決定是否僅記錄 */
export async function revokeAllCourses(userId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('user_courses').delete().eq('user_id', userId);
  return { error: error ? new Error(error.message) : null };
}

/** 開通數位下載擁有權（重複發放安全：upsert） */
export async function grantDownload(userId: string, downloadId: string): Promise<void> {
  await supabase.from('user_downloads').upsert({
    user_id: userId,
    download_id: downloadId,
    purchased_at: new Date().toISOString(),
  });
}

/** 開通會員方案（expiresAt 為 null 代表永久） */
export async function grantMembership(
  userId: string,
  planId: string,
  expiresAt: string | null
): Promise<void> {
  await supabase
    .from('users')
    .update({
      membership_plan_id: planId,
      membership_expires_at: expiresAt,
    })
    .eq('id', userId);
}
