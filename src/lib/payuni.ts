import crypto from 'crypto';

export class PayuniTool {
  private hashKey: string;
  private hashIV: string;
  private algorithm = 'aes-256-gcm';

  constructor(hashKey: string, hashIV: string) {
    this.hashKey = hashKey;
    this.hashIV = hashIV;
  }

  /**
   * 加密：將參數物件轉為 EncryptInfo
   * PayUni UPP 規格要求先將參數序列化為 URL query string（等同 PHP http_build_query），
   * 再進行 AES-256-GCM 加密並附加 Auth Tag（非 JSON）。
   */
  encrypt(params: Record<string, string | number>): string {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) usp.append(k, String(v));
    const plainText = usp.toString();

    const cipher = crypto.createCipheriv(this.algorithm, this.hashKey, this.hashIV) as crypto.CipherGCM;
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // 取得 GCM 的驗證標籤 (Auth Tag) 並附加在最後
    const authTag = cipher.getAuthTag().toString('hex');
    return (encrypted + authTag).toUpperCase();
  }

  /**
   * 解密：處理 PayUni 回傳的 EncryptInfo（同樣為 query string 格式）
   */
  decrypt(encryptInfo: string): Record<string, string> {
    // PayUni 的加密字串最後 32 位元 (16 bytes) 是 Auth Tag
    const tagLength = 32;
    const encryptedData = encryptInfo.slice(0, -tagLength);
    const authTag = encryptInfo.slice(-tagLength);

    const decipher = crypto.createDecipheriv(this.algorithm, this.hashKey, this.hashIV) as crypto.DecipherGCM;
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return Object.fromEntries(new URLSearchParams(decrypted));
  }

  /**
   * 產生 HashInfo (SHA256)
   * 公式：SHA256(HashKey + EncryptInfo + HashIV) 並轉大寫
   */
  generateHash(encryptInfo: string): string {
    const checkString = this.hashKey + encryptInfo + this.hashIV;
    return crypto.createHash('sha256').update(checkString).digest('hex').toUpperCase();
  }
}
