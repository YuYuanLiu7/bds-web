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
   * PAYUNi 要求將參數轉為 JSON 後進行 AES-256-GCM 加密，並附加 Auth Tag
   */
  encrypt(params: Record<string, any>): string {
    const plainText = JSON.stringify(params);
    const cipher = crypto.createCipheriv(this.algorithm, this.hashKey, this.hashIV) as any;
    
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // 取得 GCM 的驗證標籤 (Auth Tag) 並附加在最後
    const authTag = cipher.getAuthTag().toString('hex');
    return (encrypted + authTag).toUpperCase();
  }

  /**
   * 解密：處理 PAYUNi 回傳的 EncryptInfo
   */
  decrypt(encryptInfo: string): Record<string, any> {
    // PAYUNi 的加密字串最後 32 位元 (16 bytes) 是 Auth Tag
    const tagLength = 32;
    const encryptedData = encryptInfo.slice(0, -tagLength);
    const authTag = encryptInfo.slice(-tagLength);

    const decipher = crypto.createDecipheriv(this.algorithm, this.hashKey, this.hashIV) as any;
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
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
