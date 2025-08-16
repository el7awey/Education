import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  BookOpen, 
  Clock, 
  Star, 
  Users, 
  Play,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface Course {
  id: string;
  title_en: string;
  title_ar: string;
  short_description_en: string;
  short_description_ar: string;
  description_en: string;
  description_ar: string;
  price: number;
  difficulty_level: string;
  duration_hours: number;
  cover_image_url: string;
  preview_video_url: string;
  is_featured: boolean;
  created_at: string;
  teacher_id: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
  enrollments_count?: number;
  average_rating?: number;
  lessons_count?: number;
}

const FeaturedCourses = () => {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Sample fallback data to show when API fails
  const fallbackCourses: Course[] = [
    {
      id: 'fallback-1',
      title_en: 'Web Development Fundamentals',
      title_ar: 'أساسيات تطوير الويب',
      short_description_en: 'Learn the basics of web development with HTML, CSS, and JavaScript',
      short_description_ar: 'تعلم أساسيات تطوير الويب باستخدام HTML و CSS و JavaScript',
      description_en: 'A comprehensive introduction to web development',
      description_ar: 'مقدمة شاملة في تطوير الويب',
      price: 99,
      difficulty_level: 'beginner',
      duration_hours: 20,
      cover_image_url: '',
      preview_video_url: '',
      is_featured: true,
      created_at: new Date().toISOString(),
      teacher_id: 'fallback-teacher',
      profiles: { full_name: 'John Doe', avatar_url: '' },
      enrollments_count: 150,
      lessons_count: 15,
      average_rating: 4.5
    },
    {
      id: 'fallback-2',
      title_en: 'Advanced JavaScript',
      title_ar: 'JavaScript المتقدم',
      short_description_en: 'Master advanced JavaScript concepts and modern ES6+ features',
      short_description_ar: 'أتقن المفاهيم المتقدمة في JavaScript والميزات الحديثة ES6+',
      description_en: 'Advanced JavaScript programming techniques',
      description_ar: 'تقنيات البرمجة المتقدمة في JavaScript',
      price: 149,
      difficulty_level: 'intermediate',
      duration_hours: 25,
      cover_image_url: '',
      preview_video_url: '',
      is_featured: true,
      created_at: new Date().toISOString(),
      teacher_id: 'fallback-teacher',
      profiles: { full_name: 'Jane Smith', avatar_url: '' },
      enrollments_count: 89,
      lessons_count: 18,
      average_rating: 4.7
    }
  ];

  useEffect(() => {
    fetchFeaturedCourses();
  }, []);

  const fetchFeaturedCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          profiles!courses_teacher_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('is_published', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Supabase error fetching featured courses:', error);
        throw error;
      }

      // If no data returned, use fallback data
      if (!data || data.length === 0) {
        console.warn('No featured courses found in database, using fallback data');
        setCourses(fallbackCourses);
        return;
      }

      // Fetch additional stats for each course
      const coursesWithStats = await Promise.all((data || []).map(async (course) => {
        try {
          // Get enrollments count
          const { count: enrollmentsCount } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          // Get lessons count
          const { count: lessonsCount } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          // Get average rating from testimonials
          const { data: testimonials } = await supabase
            .from('testimonials')
            .select('rating')
            .eq('course_id', course.id)
            .eq('is_approved', true);

          const averageRating = testimonials && testimonials.length > 0
            ? testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length
            : 0;

          return {
            ...course,
            enrollments_count: enrollmentsCount || 0,
            lessons_count: lessonsCount || 0,
            average_rating: averageRating
          };
        } catch (statsError) {
          console.warn(`Error fetching stats for course ${course.id}:`, statsError);
          // Return course with default stats if stats fetch fails
          return {
            ...course,
            enrollments_count: 0,
            lessons_count: 0,
            average_rating: 0
          };
        }
      }));

      setCourses(coursesWithStats);
    } catch (error: any) {
      console.error('Error fetching featured courses:', error);
      setError(error.message || 'Failed to load featured courses');
      
      // Use fallback data when API fails
      setCourses(fallbackCourses);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchFeaturedCourses();
  };

  const formatPrice = (price: number) => {
    if (price === 0) return isRTL ? 'مجاني' : 'Free';
    return isRTL ? `${price} ج.م` : `${price} EGP`;
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getDifficultyLabel = (level: string) => {
    const labels = {
      beginner: isRTL ? 'مبتدئ' : 'Beginner',
      intermediate: isRTL ? 'متوسط' : 'Intermediate',
      advanced: isRTL ? 'متقدم' : 'Advanced'
    };
    return labels[level as keyof typeof labels] || level;
  };

  if (loading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary">
              <BookOpen className="w-4 h-4 mr-2" />
              {t('featuredCourses')}
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {isRTL ? 'اكتشف أفضل الدورات التعليمية' : 'Discover Our Best Courses'}
            </h2>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {isRTL 
                ? 'مجموعة مختارة من أفضل الدورات التعليمية التي ستساعدك على تطوير مهاراتك وتحقيق أهدافك المهنية'
                : 'A curated collection of our best educational courses that will help you develop your skills and achieve your career goals'
              }
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="overflow-hidden animate-pulse">
                <div className="aspect-video bg-muted" />
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-3 bg-muted rounded mb-4 w-3/4" />
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-muted rounded w-16" />
                    <div className="h-4 bg-muted rounded w-12" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary">
            <BookOpen className="w-4 h-4 mr-2" />
            {t('featuredCourses')}
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {isRTL ? 'اكتشف أفضل الدورات التعليمية' : 'Discover Our Best Courses'}
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isRTL 
              ? 'مجموعة مختارة من أفضل الدورات التعليمية التي ستساعدك على تطوير مهاراتك وتحقيق أهدافك المهنية'
              : 'A curated collection of our best educational courses that will help you develop your skills and achieve your career goals'
            }
          </p>

          {/* Error message and retry button */}
          {error && (
            <div className="flex items-center justify-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="text-sm text-destructive">
                {isRTL ? 'حدث خطأ في تحميل البيانات' : 'Error loading data'}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
                className="h-8 px-3"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                {isRTL ? 'إعادة المحاولة' : 'Retry'}
              </Button>
            </div>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {isRTL ? 'لا توجد دورات مميزة حالياً' : 'No featured courses available'}
            </h3>
            <p className="text-muted-foreground">
              {isRTL ? 'تحقق مرة أخرى قريباً' : 'Check back soon for new courses'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-strong transition-all duration-300 group">
                <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/10 overflow-hidden">
                  {course.cover_image_url ? (
                    <img 
                      src={course.cover_image_url}
                      alt={isRTL ? course.title_ar : course.title_en}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-primary" />
                    </div>
                  )}
                  
                  {course.preview_video_url && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50">
                      <Button size="lg" className="rounded-full">
                        <Play className="w-6 h-6" />
                      </Button>
                    </div>
                  )}

                  <div className="absolute top-4 left-4">
                    <Badge className={getDifficultyColor(course.difficulty_level)}>
                      {getDifficultyLabel(course.difficulty_level)}
                    </Badge>
                  </div>

                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-background/90 text-foreground">
                      {formatPrice(course.price)}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {isRTL ? course.title_ar : course.title_en}
                  </CardTitle>
                  
                  <CardDescription className="mb-4 line-clamp-3">
                    {isRTL ? course.short_description_ar : course.short_description_en}
                  </CardDescription>

                  {/* Instructor */}
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      {course.profiles?.avatar_url ? (
                        <img 
                          src={course.profiles.avatar_url} 
                          alt={course.profiles.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Users className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {course.profiles?.full_name || (isRTL ? 'المدرب' : 'Instructor')}
                      </p>
                    </div>
                  </div>

                  {/* Course Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {course.duration_hours}h
                    </div>
                    
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-1" />
                      {course.lessons_count || 0} {isRTL ? 'درس' : 'lessons'}
                    </div>
                    
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {course.enrollments_count || 0}
                    </div>
                  </div>

                  {/* Rating */}
                  {course.average_rating > 0 && (
                    <div className="flex items-center mb-4">
                      <div className="flex items-center mr-2">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${
                              i < Math.floor(course.average_rating) 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {course.average_rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-6 pt-0">
                  <Button 
                    className="w-full group"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    {isRTL ? 'تفاصيل الدورة' : 'View Course'}
                    <ChevronRight className={`w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center">
          <Button 
            size="lg" 
            variant="outline" 
            className="group"
            onClick={() => navigate('/courses')}
          >
            {t('allCourses')}
            <ArrowRight className={`w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCourses;