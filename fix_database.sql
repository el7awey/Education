-- Comprehensive Database Fix Script
-- Run this in your Supabase SQL Editor to fix the teacher_id constraint error

-- Step 1: Fix role inconsistencies
-- Update any 'student' roles to 'user' for consistency
UPDATE profiles SET role = 'user' WHERE role = 'student';

-- Ensure all profiles have a valid role
UPDATE profiles SET role = 'user' WHERE role IS NULL OR role NOT IN ('user', 'teacher', 'admin');

-- Step 2: Create a default teacher if none exists
-- First, check if we have any teachers
DO $$
DECLARE
    teacher_count INTEGER;
    default_user_id UUID;
BEGIN
    SELECT COUNT(*) INTO teacher_count FROM profiles WHERE role = 'teacher';
    
    IF teacher_count = 0 THEN
        -- Get the first user to make them a teacher
        SELECT user_id INTO default_user_id FROM profiles LIMIT 1;
        
        IF default_user_id IS NOT NULL THEN
            UPDATE profiles SET role = 'teacher' WHERE user_id = default_user_id;
            RAISE NOTICE 'Made user % a teacher since no teachers existed', default_user_id;
        END IF;
    END IF;
END $$;

-- Step 3: Fix courses without teacher_id
-- Assign orphaned courses to the first available teacher
DO $$
DECLARE
    default_teacher_id UUID;
    orphaned_courses_count INTEGER;
BEGIN
    -- Get the first available teacher
    SELECT user_id INTO default_teacher_id FROM profiles WHERE role = 'teacher' LIMIT 1;
    
    -- Count courses without teachers
    SELECT COUNT(*) INTO orphaned_courses_count FROM courses WHERE teacher_id IS NULL;
    
    IF default_teacher_id IS NOT NULL AND orphaned_courses_count > 0 THEN
        -- Update orphaned courses to use the default teacher
        UPDATE courses SET teacher_id = default_teacher_id WHERE teacher_id IS NULL;
        RAISE NOTICE 'Updated % orphaned courses to use default teacher %', orphaned_courses_count, default_teacher_id;
    ELSIF orphaned_courses_count > 0 THEN
        -- If no teacher exists, delete orphaned courses to maintain data integrity
        DELETE FROM courses WHERE teacher_id IS NULL;
        RAISE NOTICE 'Deleted % orphaned courses to maintain data integrity', orphaned_courses_count;
    END IF;
END $$;

-- Step 4: Ensure teacher_id column is NOT NULL
ALTER TABLE courses ALTER COLUMN teacher_id SET NOT NULL;

-- Step 5: Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'courses_teacher_id_fkey'
    ) THEN
        ALTER TABLE courses 
        ADD CONSTRAINT courses_teacher_id_fkey 
        FOREIGN KEY (teacher_id) REFERENCES profiles(user_id);
        RAISE NOTICE 'Added foreign key constraint for teacher_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- Step 6: Verify the fix
-- Check that all courses have valid teacher_id values
SELECT 
    'Courses with valid teacher_id' as status,
    COUNT(*) as count
FROM courses 
WHERE teacher_id IS NOT NULL

UNION ALL

SELECT 
    'Courses without teacher_id' as status,
    COUNT(*) as count
FROM courses 
WHERE teacher_id IS NULL

UNION ALL

SELECT 
    'Total profiles by role' as status,
    COUNT(*) as count
FROM profiles 
GROUP BY role
ORDER BY status;
