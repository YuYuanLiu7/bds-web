-- Add instructor column to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor TEXT DEFAULT 'BDS 團隊';
