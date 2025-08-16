-- Create storage buckets for file uploads (only if they don't exist)
INSERT INTO storage.buckets (id, name, public) 
SELECT 'avatars', 'avatars', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars');

INSERT INTO storage.buckets (id, name, public) 
SELECT 'course-materials', 'course-materials', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'course-materials');

INSERT INTO storage.buckets (id, name, public) 
SELECT 'course-covers', 'course-covers', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'course-covers');

-- Create policies for avatar uploads
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policies for course covers (public read, admin/teacher write)
CREATE POLICY "Course covers are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'course-covers');

CREATE POLICY "Teachers and admins can upload course covers" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'course-covers' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
  )
);

CREATE POLICY "Teachers and admins can update course covers" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'course-covers' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
  )
);

-- Create policies for course materials (private access based on enrollment)
CREATE POLICY "Students can view materials of enrolled courses" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'course-materials' AND 
  EXISTS (
    SELECT 1 FROM enrollments e
    JOIN lessons l ON l.course_id = e.course_id
    WHERE e.student_id = auth.uid() AND 
          (storage.foldername(name))[1] = l.course_id::text
  )
);

CREATE POLICY "Teachers can manage materials of their courses" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'course-materials' AND 
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.teacher_id = auth.uid() AND 
          (storage.foldername(name))[1] = c.id::text
  )
);