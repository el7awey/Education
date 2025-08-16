-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('course-materials', 'course-materials', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('course-covers', 'course-covers', true);

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

-- Create missing trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create missing trigger for courses table  
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();