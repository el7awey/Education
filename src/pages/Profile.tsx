import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  Trophy, 
  Clock,
  Edit,
  Save,
  X,
  Upload
} from 'lucide-react';
import TeacherCourseManager from '@/components/TeacherCourseManager';

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  
  // Form states
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchEnrollments();
  }, [user, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const fetchEnrollments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            id,
            title_en,
            title_ar,
            description_en,
            description_ar,
            cover_image_url,
            price,
            difficulty_level
          )
        `)
        .eq('student_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error: any) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const updates = {
        user_id: user.id,
        full_name: fullName,
        bio: bio,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();
      setIsEditing(false);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error uploading avatar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-elegant">
            <CardHeader className="text-center">
              <div className="relative mx-auto w-24 h-24 mb-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
                  <AvatarFallback className="text-2xl">
                    {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  }}
                />
              </div>
              <CardTitle className="text-2xl">
                {profile?.full_name || user.email?.split('@')[0]}
              </CardTitle>
              <CardDescription className="flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </CardDescription>
              <div className="flex justify-center gap-2 mt-2">
                <Badge variant="secondary" className="capitalize">
                  {profile?.role || 'student'}
                </Badge>
                <Badge variant="outline">
                  <Calendar className="w-3 h-3 mr-1" />
                  {isRTL ? 'منذ' : 'Since'} {new Date(profile?.created_at || '').getFullYear()}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile">
                    {isRTL ? 'الملف الشخصي' : 'Profile'}
                  </TabsTrigger>
                  <TabsTrigger value="courses">
                    {isRTL ? 'الدورات' : 'My Courses'}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      {isRTL ? 'معلوماتي الشخصية' : 'Personal Information'}
                    </h3>
                    {!isEditing && (
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        {isRTL ? 'تعديل' : 'Edit'}
                      </Button>
                    )}
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullname">
                          {isRTL ? 'الاسم الكامل' : 'Full Name'}
                        </Label>
                        <Input
                          id="fullname"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder={isRTL ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">
                          {isRTL ? 'نبذة عني' : 'Bio'}
                        </Label>
                        <Textarea
                          id="bio"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder={isRTL ? 'اكتب نبذة عن نفسك' : 'Tell us about yourself'}
                          className="min-h-[100px]"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" disabled={loading}>
                          <Save className="w-4 h-4 mr-2" />
                          {loading ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ' : 'Save')}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setIsEditing(false);
                            setFullName(profile?.full_name || '');
                            setBio(profile?.bio || '');
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          {isRTL ? 'إلغاء' : 'Cancel'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          {isRTL ? 'الاسم الكامل' : 'Full Name'}
                        </Label>
                        <p className="text-sm mt-1">
                          {profile?.full_name || (isRTL ? 'لم يتم تحديده' : 'Not specified')}
                        </p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          {isRTL ? 'نبذة عني' : 'Bio'}
                        </Label>
                        <p className="text-sm mt-1">
                          {profile?.bio || (isRTL ? 'لم يتم إضافة نبذة بعد' : 'No bio added yet')}
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="courses" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {isRTL ? 'دوراتي' : 'My Courses'}
                    </h3>
                    <Badge variant="secondary">
                      {enrollments.length} {isRTL ? 'دورة' : 'Courses'}
                    </Badge>
                  </div>

                  {enrollments.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h4 className="text-lg font-medium mb-2">
                        {isRTL ? 'لا توجد دورات بعد' : 'No courses yet'}
                      </h4>
                      <p className="text-muted-foreground mb-4">
                        {isRTL ? 'ابدأ رحلة التعلم بالتسجيل في دورة' : 'Start your learning journey by enrolling in a course'}
                      </p>
                      <Button onClick={() => navigate('/courses')}>
                        {isRTL ? 'تصفح الدورات' : 'Browse Courses'}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {enrollments.map((enrollment: any) => (
                        <Card key={enrollment.id} className="overflow-hidden">
                          <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            {enrollment.courses?.cover_image_url ? (
                              <img 
                                src={enrollment.courses.cover_image_url} 
                                alt={isRTL ? enrollment.courses.title_ar : enrollment.courses.title_en}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <BookOpen className="w-12 h-12 text-primary" />
                            )}
                          </div>
                          <CardContent className="p-4">
                            <h4 className="font-semibold mb-2">
                              {isRTL ? enrollment.courses?.title_ar : enrollment.courses?.title_en}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Trophy className="w-4 h-4" />
                              {Math.round(enrollment.progress || 0)}% {isRTL ? 'مكتمل' : 'Complete'}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {isRTL ? 'تم التسجيل في' : 'Enrolled on'} {new Date(enrollment.enrolled_at).toLocaleDateString()}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {profile?.role === 'teacher' && (
                    <div className="pt-8 border-t">
                      <TeacherCourseManager />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;