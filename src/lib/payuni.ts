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
   * 再進行 AES-256-GCM 加密，並將加密後的二進位資料、分割符號 ::: 與 Base64 編碼的 Auth Tag 拼接，
   * 最後整體轉為十六進位 (Hex) 字串傳送。
   */
  encrypt(params: Record<string, string | number>): string {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) usp.append(k, String(v));
    const plainText = usp.toString();

    const cipher = crypto.createCipheriv(this.algorithm, this.hashKey, this.hashIV) as crypto.CipherGCM;
    
    // 加密為二進位 Buffer
    const ciphertextBuffer = Buffer.concat([
      cipher.update(plainText),
      cipher.final()
    ]);
    
    // 1. PHP openssl_encrypt default output (options=0) is Base64 encoded ciphertext
    const ciphertextBase64 = ciphertextBuffer.toString('base64');
    
    // 2. Auth Tag is also Base64 encoded
    const tag = cipher.getAuthTag();
    const tagBase64 = tag.toString('base64');
    
    // 3. Concatenate Base64 strings with delimiter ':::'
    const concatenated = ciphertextBase64 + ':::' + tagBase64;

    // 4. PHP bin2hex converts each character of this ASCII string to hex
    return Buffer.from(concatenated, 'utf8').toString('hex').toUpperCase();
  }

  /**
   * 解密：處理 PayUni 回傳的 EncryptInfo（同樣為 query string 格式）
   */
  decrypt(encryptInfo: string): Record<string, string> {
    // 1. Convert hex to ASCII buffer (since the raw concatenated string was ASCII encoded to hex)
    const bin = Buffer.from(encryptInfo, 'hex');
    const delimiterIndex = bin.indexOf(':::');
    if (delimiterIndex === -1) {
      throw new Error('Delimiter ::: not found in encrypted string');
    }
    
    // 2. Extract Base64 ciphertext and Base64 tag from the buffer
    const ciphertextBase64Str = bin.subarray(0, delimiterIndex).toString('utf8');
    const tagBase64Str = bin.subarray(delimiterIndex + 3).toString('utf8');
    
    // 3. Convert Base64 strings to binary buffers
    const ciphertext = Buffer.from(ciphertextBase64Str, 'base64');
    const tag = Buffer.from(tagBase64Str, 'base64');

    // GCM auth tag 必須為完整 16 bytes；拒絕被截短的 tag（截短會大幅降低偽造難度）
    if (tag.length !== 16) {
      throw new Error('Invalid GCM auth tag length');
    }

    const decipher = crypto.createDecipheriv(this.algorithm, this.hashKey, this.hashIV) as crypto.DecipherGCM;
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return Object.fromEntries(new URLSearchParams(decrypted.toString('utf8')));
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
