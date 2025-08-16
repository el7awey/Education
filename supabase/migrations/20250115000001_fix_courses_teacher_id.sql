-- Fix courses table teacher_id constraint issues
-- This migration ensures all courses have a valid teacher_id

-- First, let's check if there are any courses without a teacher_id
-- If there are, we'll assign them to a default teacher or delete them

-- Create a temporary table to track problematic courses
CREATE TEMP TABLE courses_to_fix AS
SELECT id, title_en, title_ar 
FROM courses 
WHERE teacher_id IS NULL;

-- If there are courses without teacher_id, we need to handle them
-- Option 1: Assign to a default teacher (if one exists)
DO $$
DECLARE
    default_teacher_id UUID;
    courses_count INTEGER;
BEGIN
    -- Get the first available teacher
    SELECT user_id INTO default_teacher_id 
    FROM profiles 
    WHERE role = 'teacher' 
    LIMIT 1;
    
    -- Count courses that need fixing
    SELECT COUNT(*) INTO courses_count FROM courses_to_fix;
    
    IF default_teacher_id IS NOT NULL AND courses_count > 0 THEN
        -- Update courses to use the default teacher
        UPDATE courses 
        SET teacher_id = default_teacher_id 
        WHERE teacher_id IS NULL;
        
        RAISE NOTICE 'Updated % courses to use default teacher %', courses_count, default_teacher_id;
    ELSIF courses_count > 0 THEN
        -- If no teacher exists, we need to create one or delete the courses
        -- For now, we'll delete courses without teachers to maintain data integrity
        DELETE FROM courses WHERE teacher_id IS NULL;
        RAISE NOTICE 'Deleted % courses without teachers to maintain data integrity', courses_count;
    END IF;
END $$;

-- Ensure the teacher_id column is NOT NULL
ALTER TABLE courses ALTER COLUMN teacher_id SET NOT NULL;

-- Add a foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'courses_teacher_id_fkey'
    ) THEN
        ALTER TABLE courses 
        ADD CONSTRAINT courses_teacher_id_fkey 
        FOREIGN KEY (teacher_id) REFERENCES profiles(user_id);
    END IF;
END $$;

-- Clean up temporary table
DROP TABLE courses_to_fix;
