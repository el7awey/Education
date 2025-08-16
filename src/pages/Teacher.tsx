import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AboutTeacher from '@/components/AboutTeacher';
import CourseCard from '@/components/CourseCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Award,
  BookOpen,
  Users,
  Star,
  GraduationCap,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Teacher = () => {
  const { t, isRTL } = useLanguage();
  const [teacher, setTeacher] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState<{ students: number; rating: number }>({ students: 0, rating: 0 });
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
    role: 'teacher',
    email: 'ahmed@example.com',
    phone: '+966 50 123 4567',
    location: isRTL ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'
  };

  // Fallback courses to show when API fails
  const fallbackCourses = [
    {
      id: 'fallback-1',
      title_en: 'Web Development Fundamentals',
      title_ar: 'أساسيات تطوير الويب',
      short_description_en: 'Learn the basics of web development with HTML, CSS, and JavaScript',
      short_description_ar: 'تعلم أساسيات تطوير الويب باستخدام HTML و CSS و JavaScript',
      price: 99,
      difficulty_level: 'beginner',
      duration_hours: 20,
      cover_image_url: '',
      is_published: true,
      category_id: 'web-dev',
      teacher_id: 'fallback-teacher',
      categories: { name_en: 'Web Development', name_ar: 'تطوير الويب' },
      lessons_count: 15,
      students_count: 150,
      average_rating: 4.5
    },
    {
      id: 'fallback-2',
      title_en: 'Advanced JavaScript',
      title_ar: 'JavaScript المتقدم',
      short_description_en: 'Master advanced JavaScript concepts and modern ES6+ features',
      short_description_ar: 'أتقن المفاهيم المتقدمة في JavaScript والميزات الحديثة ES6+',
      price: 149,
      difficulty_level: 'intermediate',
      duration_hours: 25,
      cover_image_url: '',
      is_published: true,
      category_id: 'programming',
      teacher_id: 'fallback-teacher',
      categories: { name_en: 'Programming', name_ar: 'البرمجة' },
      lessons_count: 18,
      students_count: 89,
      average_rating: 4.7
    }
  ];

  // Fallback stats to show when API fails
  const fallbackStats = { students: 850, rating: 4.6 };

  useEffect(() => {
    const load = async () => {
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
          setCourses(fallbackCourses);
          setStats(fallbackStats);
          return;
        }

        setTeacher(picked);

        try {
          const { data: courseList, error: coursesError } = await supabase
            .from('courses')
            .select(`*, categories!courses_category_id_fkey(name_en,name_ar)`) 
            .eq('teacher_id', picked.user_id)
            .order('created_at', { ascending: false });

          if (coursesError) {
            console.error('Supabase error fetching courses:', coursesError);
            throw coursesError;
          }

          if (!courseList || courseList.length === 0) {
            console.warn('No courses found for teacher, using fallback courses');
            setCourses(fallbackCourses);
            setStats(fallbackStats);
            return;
          }

          const coursesWithStats = await Promise.all((courseList || []).map(async (c: any) => {
            try {
              const [{ count: lessonsCount }, { count: studentsCount }, { data: ratings }] = await Promise.all([
                supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('course_id', c.id),
                supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('course_id', c.id),
                supabase.from('testimonials').select('rating').eq('course_id', c.id).eq('is_approved', true)
              ]);
              const averageRating = ratings && ratings.length > 0 ? (ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length) : 0;
              return { ...c, lessons_count: lessonsCount || 0, students_count: studentsCount || 0, average_rating: averageRating };
            } catch (statsError) {
              console.warn(`Error fetching stats for course ${c.id}:`, statsError);
              return { ...c, lessons_count: 0, students_count: 0, average_rating: 0 };
            }
          }));

          setCourses(coursesWithStats);

          const totalStudents = coursesWithStats.reduce((s, c) => s + (c.students_count || 0), 0);
          const avgRating = coursesWithStats.length > 0 ? coursesWithStats.reduce((s, c) => s + (c.average_rating || 0), 0) / coursesWithStats.length : 0;
          setStats({ students: totalStudents, rating: avgRating });
        } catch (coursesError) {
          console.warn('Error fetching teacher courses, using fallback data:', coursesError);
          setCourses(fallbackCourses);
          setStats(fallbackStats);
        }
      } catch (e: any) {
        console.error('Error loading teacher data:', e);
        setError(e.message || 'Failed to load teacher information');
        
        // Use fallback data when API fails
        setTeacher(fallbackTeacher);
        setCourses(fallbackCourses);
        setStats(fallbackStats);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isRTL]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    const load = async () => {
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
          setCourses(fallbackCourses);
          setStats(fallbackStats);
          return;
        }

        setTeacher(picked);

        try {
          const { data: courseList, error: coursesError } = await supabase
            .from('courses')
            .select(`*, categories!courses_category_id_fkey(name_en,name_ar)`) 
            .eq('teacher_id', picked.user_id)
            .order('created_at', { ascending: false });

          if (coursesError) {
            console.error('Supabase error fetching courses on retry:', coursesError);
            throw coursesError;
          }

          if (!courseList || courseList.length === 0) {
            setCourses(fallbackCourses);
            setStats(fallbackStats);
            return;
          }

          const coursesWithStats = await Promise.all((courseList || []).map(async (c: any) => {
            try {
              const [{ count: lessonsCount }, { count: studentsCount }, { data: ratings }] = await Promise.all([
                supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('course_id', c.id),
                supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('course_id', c.id),
                supabase.from('testimonials').select('rating').eq('course_id', c.id).eq('is_approved', true)
              ]);
              const averageRating = ratings && ratings.length > 0 ? (ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length) : 0;
              return { ...c, lessons_count: lessonsCount || 0, students_count: studentsCount || 0, average_rating: averageRating };
            } catch (statsError) {
              console.warn(`Error fetching stats for course ${c.id} on retry:`, statsError);
              return { ...c, lessons_count: 0, students_count: 0, average_rating: 0 };
            }
          }));

          setCourses(coursesWithStats);

          const totalStudents = coursesWithStats.reduce((s, c) => s + (c.students_count || 0), 0);
          const avgRating = coursesWithStats.length > 0 ? coursesWithStats.reduce((s, c) => s + (c.average_rating || 0), 0) / coursesWithStats.length : 0;
          setStats({ students: totalStudents, rating: avgRating });
        } catch (coursesError) {
          console.warn('Error fetching teacher courses on retry, using fallback data:', coursesError);
          setCourses(fallbackCourses);
          setStats(fallbackStats);
        }
      } catch (e: any) {
        console.error('Error loading teacher data on retry:', e);
        setError(e.message || 'Failed to load teacher information');
        setTeacher(fallbackTeacher);
        setCourses(fallbackCourses);
        setStats(fallbackStats);
      } finally {
        setLoading(false);
      }
    };
    load();
  };

  const qualifications = [
    {
      title: isRTL ? 'خبرة تعليمية' : 'Teaching Experience',
      institution: teacher?.full_name || (isRTL ? 'المدرب' : 'Instructor'),
      year: '2008',
      icon: GraduationCap
    },
    {
      title: isRTL ? 'دورات منشورة' : 'Published Courses',
      institution: `${courses.length}`,
      year: '2004',
      icon: Award
    },
    {
      title: isRTL ? 'عدد الطلاب' : 'Students',
      institution: stats.students.toLocaleString(),
      year: '2002',
      icon: BookOpen
    }
  ];

  const experience = [
    {
      position: isRTL ? 'أستاذ مشارك - علوم الحاسوب' : 'Associate Professor - Computer Science',
      company: isRTL ? 'جامعة الملك سعود' : 'King Saud University',
      period: isRTL ? '2015 - الآن' : '2015 - Present',
      description: isRTL 
        ? 'تدريس مقررات علوم الحاسوب والإشراف على البحوث العلمية'
        : 'Teaching computer science courses and supervising scientific research'
    },
    {
      position: isRTL ? 'مطور رئيسي' : 'Senior Developer',
      company: isRTL ? 'شركة التقنيات المتقدمة' : 'Advanced Technologies Company',
      period: isRTL ? '2010 - 2015' : '2010 - 2015',
      description: isRTL 
        ? 'تطوير تطبيقات الويب والجوال وإدارة فرق التطوير'
        : 'Developing web and mobile applications and managing development teams'
    },
    {
      position: isRTL ? 'مطور ويب' : 'Web Developer',
      company: isRTL ? 'شركة الحلول الرقمية' : 'Digital Solutions Company',
      period: isRTL ? '2008 - 2010' : '2008 - 2010',
      description: isRTL 
        ? 'تطوير مواقع الويب وتطبيقات الويب التفاعلية'
        : 'Developing websites and interactive web applications'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-8">
          <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="text-center space-y-4 mb-12">
                  <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {isRTL ? 'صفحة المدرب' : 'Teacher Profile'}
                  </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {isRTL 
                ? 'تعرف على مدربنا المحترف وخبراته في مجال التعليم'
                : 'Meet our professional instructor and their expertise in education'
                    }
                  </p>

            {/* Error message and retry button */}
            {error && (
              <div className="flex items-center justify-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg max-w-md mx-auto">
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

          {/* About Teacher Section */}
          <AboutTeacher />

          {/* Teacher Stats */}
          <section className="py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {loading ? (
                // Loading skeleton
                [...Array(3)].map((_, index) => (
                  <Card key={index} className="animate-pulse">
                  <CardContent className="p-6 text-center space-y-3">
                      <div className="w-12 h-12 bg-muted rounded-lg mx-auto" />
                      <div className="h-6 bg-muted rounded w-24 mx-auto" />
                      <div className="h-4 bg-muted rounded w-16 mx-auto" />
                  </CardContent>
                </Card>
                ))
              ) : (
                qualifications.map((qual, index) => (
                  <Card key={index} className="group hover:shadow-medium transition-all duration-300">
                  <CardContent className="p-6 text-center space-y-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <qual.icon className="w-6 h-6 text-primary" />
                    </div>
                      <div className="text-2xl font-bold text-foreground">{qual.institution}</div>
                      <div className="text-sm text-muted-foreground">{qual.title}</div>
                  </CardContent>
                </Card>
                ))
              )}
          </div>
        </section>

          {/* Experience Section */}
          <section className="py-16">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                {isRTL ? 'الخبرة المهنية' : 'Professional Experience'}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {isRTL 
                  ? 'رحلة مهنية حافلة بالإنجازات والخبرات المتنوعة'
                  : 'A career journey filled with achievements and diverse experiences'
                }
              </p>
            </div>

            <div className="space-y-6">
              {loading ? (
                // Loading skeleton
                [...Array(3)].map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="h-5 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                        <div className="h-4 bg-muted rounded w-1/3" />
                        <div className="h-3 bg-muted rounded w-full" />
                    </div>
                  </CardContent>
                </Card>
                ))
              ) : (
                experience.map((exp, index) => (
                  <Card key={index} className="group hover:shadow-medium transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Calendar className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {exp.position}
                            </h3>
                            <Badge variant="secondary">{exp.period}</Badge>
                          </div>
                          <p className="text-primary font-medium mb-2">{exp.company}</p>
                          <p className="text-muted-foreground">{exp.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>

          {/* Courses Section */}
          <section className="py-16">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                {isRTL ? 'الدورات المتاحة' : 'Available Courses'}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {isRTL 
                  ? 'اكتشف مجموعة متنوعة من الدورات التعليمية عالية الجودة'
                  : 'Discover a diverse collection of high-quality educational courses'
                }
              </p>
            </div>

            {loading ? (
              // Loading skeleton
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="border rounded-lg overflow-hidden">
                      <div className="aspect-video bg-muted" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-full" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                        <div className="flex justify-between items-center">
                          <div className="h-6 bg-muted rounded w-16" />
                          <div className="h-4 bg-muted rounded w-12" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : courses.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {courses.map((course) => (
                   <CourseCard 
                     key={course.id} 
                     id={course.id}
                     title={isRTL ? course.title_ar : course.title_en}
                     description={isRTL ? (course.short_description_ar || '') : (course.short_description_en || '')}
                     instructor={course.profiles?.full_name || (isRTL ? 'المدرب' : 'Instructor')}
                     price={course.price || 0}
                     duration={course.duration_hours ? `${course.duration_hours} ${isRTL ? 'ساعات' : 'hours'}` : (isRTL ? 'غير محدد' : 'N/A')}
                     lessons={course.lessons_count || 0}
                     students={course.students_count || 0}
                     rating={course.average_rating || 0}
                     level={(course.difficulty_level || 'beginner') as 'beginner' | 'intermediate' | 'advanced'}
                     category={course.categories ? (isRTL ? course.categories.name_ar : course.categories.name_en) : (isRTL ? 'عام' : 'General')}
                     image={course.cover_image_url || undefined}
                     featured={course.is_featured || false}
                   />
                 ))}
            </div>
            ) : (
              // No courses available
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {isRTL ? 'لا توجد دورات متاحة حالياً' : 'No courses available'}
                </h3>
                <p className="text-muted-foreground">
                  {isRTL ? 'تحقق مرة أخرى قريباً' : 'Check back soon for new courses'}
                </p>
          </div>
            )}
        </section>

          {/* Contact Section */}
          <section className="py-16">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                {isRTL ? 'تواصل مع المدرب' : 'Contact the Instructor'}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {isRTL 
                  ? 'هل لديك أسئلة؟ لا تتردد في التواصل معنا'
                  : 'Have questions? Don\'t hesitate to reach out to us'
                }
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-medium">Email</h3>
                      <p className="text-muted-foreground">
                        {loading ? (
                          <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                        ) : (
                          teacher?.email || 'contact@example.com'
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-medium">
                        {isRTL ? 'الهاتف' : 'Phone'}
                      </h3>
                      <p className="text-muted-foreground">
                        {loading ? (
                          <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                        ) : (
                          teacher?.phone || '+966 50 123 4567'
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-medium">
                        {isRTL ? 'الموقع' : 'Location'}
                      </h3>
                      <p className="text-muted-foreground">
                        {loading ? (
                          <div className="h-4 bg-muted rounded w-48 animate-pulse" />
                        ) : (
                          teacher?.location || (isRTL ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia')
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">
                    {isRTL ? 'رسالة سريعة' : 'Quick Message'}
                  </h3>
                  <p className="text-muted-foreground">
                    {isRTL 
                      ? 'أرسل رسالة مباشرة للمدرب للحصول على إجابات سريعة'
                      : 'Send a direct message to the instructor for quick answers'
                    }
                  </p>
                  <Button className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    {isRTL ? 'إرسال رسالة' : 'Send Message'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
          </div>
      </main>

      <Footer />
    </div>
  );
};

export default Teacher;