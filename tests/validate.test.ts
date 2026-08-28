import { describe, it, expect } from 'vitest';
import { normalizeEmail, isValidEmail } from '@/lib/validate';

// Email 正規化是登入/註冊一致性的關鍵：大小寫、前後空白都要統一，
// 否則 John@Gmail.com 註冊、john@gmail.com 登入會查不到、且能重複註冊。

describe('normalizeEmail Email 正規化', () => {
  it('轉小寫並去除前後空白', () => {
    expect(normalizeEmail('  John@Gmail.com ')).toBe('john@gmail.com');
    expect(normalizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
  });

  it('大小寫不同的同一信箱會正規化成相同字串（避免重複帳號/登不進去）', () => {
    expect(normalizeEmail('A@b.com')).toBe(normalizeEmail('a@B.com'));
  });

  it('非字串輸入回空字串（不丟例外）', () => {
    expect(normalizeEmail(undefined)).toBe('');
    expect(normalizeEmail(null)).toBe('');
    expect(normalizeEmail(123)).toBe('');
  });
});

describe('isValidEmail 基本格式', () => {
  it('合法 / 不合法', () => {
    expect(isValidEmail('a@b.com')).toBe(true);
    expect(isValidEmail('bad')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
  });
});
