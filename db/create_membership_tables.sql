-- ========================================================
-- BDS Membership and Subscription Database Migration
-- Execute this script in your Supabase SQL Editor
-- ========================================================

-- 1. Create Membership Plans Table (會員方案)
CREATE TABLE IF NOT EXISTS membership_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  period TEXT NOT NULL, -- '月繳', '年繳', '一次性'
  description TEXT,
  features TEXT[] DEFAULT '{}',
  is_popular BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active', -- 'active' or 'draft'
  subscribers_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add membership_plan_id column to orders for tracking transactions
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS membership_plan_id UUID REFERENCES membership_plans(id) ON DELETE SET NULL;

-- 3. Add membership columns and expiry tracking to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS membership_plan_id UUID REFERENCES membership_plans(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS membership_expires_at TIMESTAMP WITH TIME ZONE;

-- 4. Seed the 3 Standard Membership Plans with valid, static UUIDs
INSERT INTO membership_plans (id, title, price, period, description, features, is_popular, status)
VALUES 
  (
    '182000da-6fcd-4748-86df-e1f3b122a8c1', 
    'BDS 產業升級訂閱制 - 月費方案', 
    990, 
    '月繳', 
    '適合想要按月體驗與小步快跑學習的業務新手。', 
    ARRAY['暢讀所有產業觀察專欄文章', '每月解鎖 1 門新技術/產業講座課程', '專屬學員 Discord 行動社群交流', '享有數位模板 8 折專屬優惠'], 
    false, 
    'active'
  ),
  (
    '182000da-6fcd-4748-86df-e1f3b122a8c2', 
    'BDS 產業升級訂閱制 - 年費極致方案', 
    9500, 
    '年繳', 
    '高性價比黃金選擇，最受中高階銷售 BD 與經理歡迎。', 
    ARRAY['暢讀所有產業觀察專欄文章', '無限暢看全站所有線上產業/新手村課程', 'VIP 線下沙龍實體小聚免費入場', '享數位模板 & 白皮書 5 折專屬折扣', '與業界前輩 1對1 生意談判諮詢 1 次'], 
    true, 
    'active'
  ),
  (
    '182000da-6fcd-4748-86df-e1f3b122a8c3', 
    'BDS VIP 創始永久會員專案', 
    25000, 
    '一次性', 
    '專屬產業頂尖領袖與創始支持者的永久尊榮席次。', 
    ARRAY['終身免費學習全站所有既有與未來新課程', '創始永久 VIP 社群核心通道', '所有數位資源、模板、白皮書終身免費下載', '與創辦團隊進行 1對1 生涯發展/談判輔導 3 次', '線下 VIP 晚宴尊崇受邀資格'], 
    false, 
    'active'
  )
ON CONFLICT (id) DO NOTHING;
