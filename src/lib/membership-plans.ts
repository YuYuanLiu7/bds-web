/**
 * 會員方案的保底種子資料：僅在資料庫尚未建表或查無資料時使用。
 * 先前在 /api/membership 與 /membership 頁各存一份且 id 已分歧
 * （一份用 '1'/'2'/'3'、一份用 UUID），現統一以此為唯一來源。
 */
export interface SeedPlan {
  id: string;
  title: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  is_popular: boolean;
  status: 'active';
}

export const SEED_PLANS: SeedPlan[] = [
  {
    id: '182000da-6fcd-4748-86df-e1f3b122a8c1',
    title: 'BDS 產業升級訂閱制 - 月費方案',
    price: 990,
    period: '月繳',
    description: '適合想要按月體驗與小步快跑學習的業務新手。',
    is_popular: false,
    status: 'active',
    features: [
      '暢讀所有產業觀察專欄文章',
      '每月解鎖 1 門新技術/產業講座課程',
      '專屬學員 Discord 行動社群交流',
      '享有數位模板 8 折專屬優惠'
    ]
  },
  {
    id: '182000da-6fcd-4748-86df-e1f3b122a8c2',
    title: 'BDS 產業升級訂閱制 - 年費極致方案',
    price: 9500,
    period: '年繳',
    description: '高性價比黃金選擇，最受中高階銷售 BD 與經理歡迎。',
    is_popular: true,
    status: 'active',
    features: [
      '暢讀所有產業觀察專欄文章',
      '無限暢看全站所有線上產業/新手村課程',
      'VIP 線下沙龍實體小聚免費入場',
      '享數位模板 & 白皮書 5 折專屬折扣',
      '與業界前輩 1對1 生意談判諮詢 1 次'
    ]
  },
  {
    id: '182000da-6fcd-4748-86df-e1f3b122a8c3',
    title: 'BDS VIP 創始永久會員專案',
    price: 25000,
    period: '一次性',
    description: '專屬產業頂尖領袖與創始支持者的永久尊榮席次。',
    is_popular: false,
    status: 'active',
    features: [
      '終身免費學習全站所有既有與未來新課程',
      '創始永久 VIP 社群核心通道',
      '所有數位資源、模板、白皮書終身免費下載',
      '與創辦團隊進行 1對1 生涯發展/談判輔導 3 次',
      '線下 VIP 晚宴尊崇受邀資格'
    ]
  }
];
