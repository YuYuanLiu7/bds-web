-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  price_display TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  attendees INTEGER DEFAULT 0,
  status TEXT DEFAULT 'upcoming',
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  registration_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Initial Premium Mock Events
INSERT INTO events (id, title, description, image_url, price, price_display, date, location, attendees, status, type, category, registration_url)
VALUES 
  (
    '182000da-6fcd-4748-86df-e1f3b122a8c1', 
    'BDS 半導體業務核心思維實戰營', 
    '專門為半導體上中下游業務人員設計的核心思維實戰營，帶您突破業績瓶頸與大客戶談判。', 
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800', 
    1980, 
    'NT$ 1,980', 
    '2026-06-15 14:00:00+08', 
    '線上直播 (Zoom)', 
    48, 
    'upcoming', 
    '線上實戰營', 
    '工作坊', 
    'https://zoom.us'
  ),
  (
    '182000da-6fcd-4748-86df-e1f3b122a8c2', 
    '醫材商務開發與法規布局沙龍', 
    '匯聚生技與醫材領域商務開發專家，深度剖析法規申請流程與海內外代理商通路布局策略。', 
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800', 
    800, 
    'NT$ 800', 
    '2026-05-18 19:30:00+08', 
    '台北市大安區信義路四段', 
    32, 
    'completed', 
    '線下沙龍', 
    '線下聚會', 
    NULL
  ),
  (
    '182000da-6fcd-4748-86df-e1f3b122a8c3', 
    'BDS 爐邊對話：硬體 ODM 的全球銷售戰略', 
    '爐邊對談特別場——特邀業界高階銷售主管，分享硬體製造與全球品牌客戶銷售談判的實戰心法。', 
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800', 
    0, 
    '免費活動', 
    '2026-04-10 20:00:00+08', 
    '線上直播 (Zoom)', 
    75, 
    'completed', 
    '線上講座', 
    '線上讀書會', 
    NULL
  )
ON CONFLICT (id) DO NOTHING;
