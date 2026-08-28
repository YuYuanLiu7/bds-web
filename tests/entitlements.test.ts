import { describe, it, expect } from 'vitest';
import { computeMembershipExpiry, canAccess } from '@/lib/entitlements';

// 會員到期日計算是純函式；權限判斷的「捷徑分支」（管理員、公開、免費、未登入）
// 也不需碰資料庫，這裡完整覆蓋這些不需連線就能驗證的關鍵邏輯。

describe('computeMembershipExpiry 會員到期日', () => {
  const base = new Date('2026-01-15T00:00:00.000Z');

  it('月繳 → 從基準日往後加 1 個月', () => {
    expect(computeMembershipExpiry('月繳', base)).toBe('2026-02-15T00:00:00.000Z');
  });

  it('年繳 → 從基準日往後加 1 年', () => {
    expect(computeMembershipExpiry('年繳', base)).toBe('2027-01-15T00:00:00.000Z');
  });

  it('一次性 → null（永久，不設到期）', () => {
    expect(computeMembershipExpiry('一次性', base)).toBeNull();
  });

  it('未知或空值 → null（不臆測週期，避免把永久會員誤設 30 天）', () => {
    expect(computeMembershipExpiry(undefined, base)).toBeNull();
    expect(computeMembershipExpiry(null, base)).toBeNull();
    expect(computeMembershipExpiry('亂填', base)).toBeNull();
  });

  it('月繳月底防溢位：1/31 + 1 月 應為 2 月最後一天，而非跳到 3 月', () => {
    const jan31 = new Date('2026-01-31T00:00:00.000Z');
    // 2026 非閏年 → 2 月最後一天為 28 日；不可溢位成 3/2 或 3/3
    expect(computeMembershipExpiry('月繳', jan31)).toBe('2026-02-28T00:00:00.000Z');
  });

  it('續訂累加：以「現有到期日」為基準加一個週期（模擬未到期續訂）', () => {
    const existingExpiry = new Date('2026-06-10T00:00:00.000Z');
    expect(computeMembershipExpiry('月繳', existingExpiry)).toBe('2026-07-10T00:00:00.000Z');
  });
});

describe('canAccess 權限判斷（不需資料庫的分支）', () => {
  it('管理員一律放行（任何資源）', async () => {
    const admin = { id: 'a1', role: 'admin' };
    expect(await canAccess(admin, { kind: 'course', id: 'c1' })).toBe(true);
    expect(await canAccess(admin, { kind: 'membership' })).toBe(true);
    expect(await canAccess(admin, { kind: 'article', visibility: 'members' })).toBe(true);
  });

  it('公開文章：任何人（含未登入）都能看', async () => {
    expect(await canAccess(null, { kind: 'article', visibility: 'public' })).toBe(true);
    expect(await canAccess(undefined, { kind: 'article' })).toBe(true); // 預設 public
  });

  it('會員限定文章：未登入直接擋下', async () => {
    expect(await canAccess(null, { kind: 'article', visibility: 'members' })).toBe(false);
  });

  it('免費下載（price <= 0）：直接放行', async () => {
    expect(await canAccess({ id: 'u1' }, { kind: 'download', id: 'd1', price: 0 })).toBe(true);
  });

  it('課程／會員：未登入（無 user.id）直接擋下', async () => {
    expect(await canAccess(null, { kind: 'course', id: 'c1' })).toBe(false);
    expect(await canAccess(null, { kind: 'membership' })).toBe(false);
  });
});
