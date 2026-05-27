-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT,
  role TEXT DEFAULT 'user', -- 'admin' or 'user'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses Table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  price INTEGER NOT NULL,
  category TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chapters Table (Lessons within a course)
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT, -- YouTube/Vimeo ID or URL
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table (Payments via PayUni)
CREATE TABLE orders (
  id TEXT PRIMARY KEY, -- MerTradeNo for PayUni
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  payment_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Courses (Permissions/Access)
CREATE TABLE user_courses (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id)
);

-- Events Table
CREATE TABLE events (
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

-- Articles Table
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'BDS 編輯部',
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  category TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'published',
  slug TEXT UNIQUE,
  tags TEXT,
  seo_title TEXT,
  seo_description TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  visibility TEXT DEFAULT 'public',
  required_course_ids TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Downloads Table (Digital Products)
CREATE TABLE downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL,
  description TEXT,
  downloads_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


