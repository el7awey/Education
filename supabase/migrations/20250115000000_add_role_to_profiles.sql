-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Update existing profiles to have 'user' role if not set
UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- Update any 'student' roles to 'user' for consistency
UPDATE profiles SET role = 'user' WHERE role = 'student';

-- Create index on role column for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Drop the old constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_valid_role;

-- Add check constraint to ensure valid roles
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS check_valid_role 
CHECK (role IN ('user', 'teacher', 'admin'));

-- Ensure all existing profiles have a valid role
UPDATE profiles SET role = 'user' WHERE role NOT IN ('user', 'teacher', 'admin');
