import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Award, 
  Users, 
  BookOpen,
  Download,
  MessageSquare,
  Star,
  Calendar,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';

const AboutTeacher = () => {
  const { t, isRTL } = useLanguage();
  const [teacher, setTeacher] = useState<any>(null);
  const [stats, setStats] = useState<{ students: number; courses: number }>({ students: 0, courses: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fallback teacher data to show when API fails
  const fallbackTeacher = {
    user_id: 'fallback-teacher',
    full_name: isRTL ? 'أحمد محمد' : 'Ahmed Mohamed',
    bio: isRTL 
      ? 'مدرب محترف في مجال تطوير الويب والبرمجة مع أكثر من 10 سنوات من الخبرة'
      : 'Professional instructor in web development and programming with over 10 years of experience',
    avatar_url: '',
    role: 'teacher'
  };

  // Fallback stats to show when API fails
  const fallbackStats = { students: 850, courses: 12 };

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: teachers, error: teachersError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'teacher')
          .order('created_at', { ascending: true })
          .limit(1);

        if (teachersError) {
          console.error('Supabase error fetching teachers:', teachersError);
          throw teachersError;
        }

        const picked = teachers && teachers.length > 0 ? teachers[0] : null;
        
        if (!picked) {
          console.warn('No teachers found in database, using fallback data');
          setTeacher(fallbackTeacher);
          setStats(fallbackStats);
          return;
        }

        setTeacher(picked);

        try {
          const [{ count: coursesCount }, { count: studentsCount }] = await Promise.all([
            supabase.from('courses').select('*', { count: 'exact', head: true }).eq('teacher_id', picked.user_id),
            supabase
              .from('enrollments')
              .select('*', { count: 'exact', head: true })
              .in('course_id', (await supabase.from('courses').select('id').eq('teacher_id', picked.user_id)).data?.map((c: any) => c.id) || [''])
          ]);
          setStats({ students: studentsCount || 0, courses: coursesCount || 0 });
        } catch (statsError) {
          console.warn('Error fetching teacher stats, using fallback stats:', statsError);
          setStats(fallbackStats);
        }
      } catch (e: any) {
        console.error('Error fetching teacher data:', e);
        setError(e.message || 'Failed to load teacher information');
        
        // Use fallback data when API fails
        setTeacher(fallbackTeacher);
        setStats(fallbackStats);
      } finally {
        setLoading(false);
      }
    };
    fetchTeacher();
  }, [isRTL]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    const fetchTeacher = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: teachers, error: teachersError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'teacher')
          .order('created_at', { ascending: true })
          .limit(1);

        if (teachersError) {
          console.error('Supabase error fetching teachers on retry:', teachersError);
          throw teachersError;
        }

        const picked = teachers && teachers.length > 0 ? teachers[0] : null;
        
        if (!picked) {
          setTeacher(fallbackTeacher);
          setStats(fallbackStats);
          return;
        }

        setTeacher(picked);

        try {
          const [{ count: coursesCount }, { count: studentsCount }] = await Promise.all([
            supabase.from('courses').select('*', { count: 'exact', head: true }).eq('teacher_id', picked.user_id),
            supabase
              .from('enrollments')
              .select('*', { count: 'exact', head: true })
              .in('course_id', (await supabase.from('courses').select('id').eq('teacher_id', picked.user_id)).data?.map((c: any) => c.id) || [''])
          ]);
          setStats({ students: studentsCount || 0, courses: coursesCount || 0 });
        } catch (statsError) {
          console.warn('Error fetching teacher stats on retry, using fallback stats:', statsError);
          setStats(fallbackStats);
        }
      } catch (e: any) {
        console.error('Error fetching teacher data on retry:', e);
        setError(e.message || 'Failed to load teacher information');
        setTeacher(fallbackTeacher);
        setStats(fallbackStats);
      } finally {
        setLoading(false);
      }
    };
    fetchTeacher();
  };

  const achievements = useMemo(() => ([
    {
      icon: GraduationCap,
      value: '10+',
      label: isRTL ? 'سنة خبرة' : 'Years Experience'
    },
    {
      icon: Users,
      value: stats.students > 0 ? stats.students.toLocaleString() : (isRTL ? 'غير محدد' : 'N/A'),
      label: isRTL ? 'طالب' : 'Students Taught'
    },
    {
      icon: BookOpen,
      value: stats.courses > 0 ? `${stats.courses}+` : '0',
      label: isRTL ? 'دورة منشورة' : 'Courses Published'
    },
    {
      icon: Award,
      value: '—',
      label: isRTL ? 'جوائز' : 'Awards'
    }
  ]), [stats, isRTL]);

  const skills = [
    isRTL ? 'تطوير الويب' : 'Web Development',
    isRTL ? 'تصميم واجهات المستخدم' : 'UI/UX Design',
    isRTL ? 'إدارة المشاريع' : 'Project Management',
    isRTL ? 'التسويق الرقمي' : 'Digital Marketing',
    isRTL ? 'علوم البيانات' : 'Data Science',
    isRTL ? 'الذكاء الاصطناعي' : 'Artificial Intelligence'
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Teacher Image & Info */}
          <div className="space-y-8">
            <div className="relative">
              {/* Main Image */}
              <div className="relative w-full max-w-md mx-auto">
                <div className="aspect-square rounded-2xl bg-gradient-primary p-1 shadow-strong">
                  <div className="w-full h-full rounded-2xl bg-background p-8 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-32 h-32 bg-gradient-primary rounded-full mx-auto flex items-center justify-center">
                        <GraduationCap className="w-16 h-16 text-primary-foreground" />
                      </div>
                      <div>
                         <h3 className="text-2xl font-bold text-foreground">
                           {loading ? (
                             <div className="h-8 bg-muted rounded animate-pulse w-48" />
                           ) : (
                             teacher?.full_name || (isRTL ? 'المدرب' : 'Instructor')
                           )}
                         </h3>
                        <p className="text-muted-foreground">
                           {loading ? (
                             <div className="h-4 bg-muted rounded animate-pulse w-32 mt-2" />
                           ) : (
                             teacher?.bio || (isRTL ? 'مدرب معتمد' : 'Certified Instructor')
                           )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-secondary rounded-full flex items-center justify-center shadow-glow animate-pulse">
                  <Star className="w-8 h-8 text-secondary-foreground fill-current" />
                </div>
                
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-success rounded-full flex items-center justify-center shadow-soft">
                  <Award className="w-6 h-6 text-success-foreground" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="group">
                <Download className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                {t('downloadCV')}
              </Button>
              
              <Button variant="outline" size="lg" className="group">
                <MessageSquare className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                {t('contact')}
              </Button>
            </div>
          </div>

          {/* Teacher Details */}
          <div className="space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary">
                <GraduationCap className="w-4 h-4 mr-2" />
                {t('aboutTeacher')}
              </div>
              
               <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                 {isRTL ? 'تعرف على معلمنا' : 'Meet Our Teacher'}
               </h2>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                 {loading ? (
                   <div className="space-y-2">
                     <div className="h-4 bg-muted rounded w-full" />
                     <div className="h-4 bg-muted rounded w-3/4" />
                   </div>
                 ) : (
                   teacher?.bio || (isRTL 
                     ? 'مدرب محترف في مجاله يقدم محتوى عالي الجودة بخبرات عملية.'
                     : 'A professional instructor offering high-quality, practical content in his field.')
                 )}
              </p>

              {/* Error message and retry button */}
              {error && (
                <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <span className="text-sm text-destructive">
                    {isRTL ? 'حدث خطأ في تحميل بيانات المدرب' : 'Error loading teacher data'}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRetry}
                    className="h-8 px-3 flex-shrink-0"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    {isRTL ? 'إعادة المحاولة' : 'Retry'}
                  </Button>
                </div>
              )}
            </div>

            {/* Achievements */}
            <div className="grid grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <Card key={index} className="group hover:shadow-medium transition-all duration-300">
                  <CardContent className="p-6 text-center space-y-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <achievement.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">{achievement.value}</div>
                    <div className="text-sm text-muted-foreground">{achievement.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                {isRTL ? 'التخصصات والمهارات' : 'Specializations & Skills'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Teaching Philosophy */}
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    {isRTL ? 'فلسفة التدريس' : 'Teaching Philosophy'}
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {isRTL 
                    ? '"أؤمن بأن التعليم يجب أن يكون تفاعلياً وملهماً. هدفي هو خلق بيئة تعليمية تشجع على الإبداع والتفكير النقدي، وتمكن كل طالب من اكتشاف شغفه وتطوير مهاراته."'
                    : '"I believe that education should be interactive and inspiring. My goal is to create a learning environment that encourages creativity and critical thinking, enabling every student to discover their passion and develop their skills."'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutTeacher;