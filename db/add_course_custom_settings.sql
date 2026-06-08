-- Add custom settings to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT TRUE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS allow_ratings BOOLEAN DEFAULT TRUE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add file_url to chapters table
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS file_url TEXT;
