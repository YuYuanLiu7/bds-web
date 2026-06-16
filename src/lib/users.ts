import { supabase } from './supabase';

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

/**
 * 判斷使用者是否為「有效付費會員」：
 *  - 必須有 membership_plan_id
 *  - membership_expires_at 為 null 視為永久（一次性方案）
 *  - 否則到期日需晚於現在
 */
export async function hasActiveMembership(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('membership_plan_id, membership_expires_at')
    .eq('id', userId)
    .single();

  if (error || !data || !data.membership_plan_id) return false;
  if (!data.membership_expires_at) return true; // 一次性 / 永久會員
  return new Date(data.membership_expires_at).getTime() > Date.now();
}
