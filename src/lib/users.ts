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

// 會員有效性的判斷已移至權益模組 src/lib/entitlements.ts（hasActiveMembership / getMembershipStatus）
