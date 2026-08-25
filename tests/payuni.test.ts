import { describe, it, expect } from 'vitest';
import { PayuniTool } from '@/lib/payuni';

// PayUni 加解密與簽章是「碰錢」的關鍵邏輯，這裡以純函式方式驗證正確性與防竄改。
// 測試用金鑰：AES-256-GCM 需 32 bytes 金鑰；HashIV 沿用 PayUni 常見的 16 字元長度。
const HASH_KEY = '0123456789abcdef0123456789abcdef'; // 32 bytes
const HASH_IV = '0123456789abcdef'; // 16 bytes

describe('PayuniTool 加解密', () => {
  it('encrypt → decrypt 可完整還原原始參數（round-trip）', () => {
    const tool = new PayuniTool(HASH_KEY, HASH_IV);
    const params = {
      MerID: 'SHOP123',
      MerTradeNo: 'BDS1700000000abcd',
      TradeAmt: 990,
      Timestamp: 1700000000,
      ProdDesc: 'Subscribe to 月費方案',
      Version: '2.0',
    };
    const encrypted = tool.encrypt(params);
    // 應為大寫十六進位字串
    expect(encrypted).toMatch(/^[0-9A-F]+$/);

    const decoded = tool.decrypt(encrypted);
    // decrypt 以 URLSearchParams 還原，數值會變字串
    expect(decoded).toEqual({
      MerID: 'SHOP123',
      MerTradeNo: 'BDS1700000000abcd',
      TradeAmt: '990',
      Timestamp: '1700000000',
      ProdDesc: 'Subscribe to 月費方案',
      Version: '2.0',
    });
  });

  it('generateHash 為大寫十六進位、且相同輸入結果一致', () => {
    const tool = new PayuniTool(HASH_KEY, HASH_IV);
    const enc = tool.encrypt({ MerID: 'SHOP123', TradeAmt: 100 });
    const h1 = tool.generateHash(enc);
    const h2 = tool.generateHash(enc);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9A-F]{64}$/); // SHA256 → 64 hex chars
  });

  it('decrypt 遇到沒有分隔符的字串會拋錯', () => {
    const tool = new PayuniTool(HASH_KEY, HASH_IV);
    // 'ZZZZ' 的 hex 內不含 ::: 分隔符
    const badHex = Buffer.from('ZZZZ', 'utf8').toString('hex');
    expect(() => tool.decrypt(badHex)).toThrow();
  });

  it('auth tag 被竄改時 decrypt 會拋錯（GCM 驗章生效，防偽造）', () => {
    const tool = new PayuniTool(HASH_KEY, HASH_IV);
    const encrypted = tool.encrypt({ MerID: 'SHOP123', TradeAmt: 990 });
    // 還原成 "cipherB64:::tagB64"，把 tag 換成同長度(16 bytes)的錯誤值
    const ascii = Buffer.from(encrypted, 'hex').toString('utf8');
    const [cipherB64] = ascii.split(':::');
    const wrongTag = Buffer.alloc(16, 1).toString('base64');
    const tampered = Buffer.from(`${cipherB64}:::${wrongTag}`, 'utf8').toString('hex');
    expect(() => tool.decrypt(tampered)).toThrow();
  });

  it('auth tag 長度不對（被截短）時 decrypt 會拋錯', () => {
    const tool = new PayuniTool(HASH_KEY, HASH_IV);
    const encrypted = tool.encrypt({ MerID: 'SHOP123' });
    const ascii = Buffer.from(encrypted, 'hex').toString('utf8');
    const [cipherB64] = ascii.split(':::');
    const shortTag = Buffer.alloc(4, 1).toString('base64'); // 只有 4 bytes
    const tampered = Buffer.from(`${cipherB64}:::${shortTag}`, 'utf8').toString('hex');
    expect(() => tool.decrypt(tampered)).toThrow(/tag length/i);
  });
});
