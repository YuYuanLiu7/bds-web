-- Update users table to add phone column
-- Run this query once in your Supabase SQL Editor to support student phone registration.
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
