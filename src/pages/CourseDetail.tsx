import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PaymentFlow from '@/components/PaymentFlow';
import { 
  BookOpen, 
  Clock, 
  Star, 
  Users, 
  Play,
  CheckCircle,
  Target,
  Award,
  Shield,
  ArrowLeft,
  ShoppingCart,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface Course {
  id: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  short_description_en: string;
  short_description_ar: string;
  price: number;
  difficulty_level: string;
  duration_hours: number;
  cover_image_url: string;
  preview_video_url: string;
  requirements_en: string;
  requirements_ar: string;
  syllabus_en: string;
  syllabus_ar: string;
  teacher_id: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
    bio: string;
  };
  enrollments_count?: number;
  average_rating?: number;
  lessons_count?: number;
}

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fallback course data to show when API fails
  const fallbackCourse: Course = {
    id: courseId || 'fallback-course',
    title_en: 'Web Development Fundamentals',
    title_ar: 'أساسيات تطوير الويب',
    description_en: 'A comprehensive introduction to web development covering HTML, CSS, and JavaScript fundamentals.',
    description_ar: 'مقدمة شاملة في تطوير الويب تغطي أساسيات HTML و CSS و JavaScript.',
    short_description_en: 'Learn the basics of web development with HTML, CSS, and JavaScript',
    short_description_ar: 'تعلم أساسيات تطوير الويب باستخدام HTML و CSS و JavaScript',
    price: 99,
    difficulty_level: 'beginner',
    duration_hours: 20,
    cover_image_url: '',
    preview_video_url: '',
    requirements_en: 'Basic computer skills and enthusiasm to learn',
    requirements_ar: 'مهارات أساسية في الحاسوب والحماس للتعلم',
    syllabus_en: 'HTML basics, CSS styling, JavaScript fundamentals, responsive design',
    syllabus_ar: 'أساسيات HTML، تنسيق CSS، أساسيات JavaScript، التصميم المتجاوب',
    teacher_id: 'fallback-teacher',
    profiles: {
      full_name: 'John Doe',
      avatar_url: '',
      bio: 'Experienced web developer with 10+ years of teaching experience'
    },
    enrollments_count: 150,
    lessons_count: 15,
    average_rating: 4.5
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
      checkEnrollment();
    }
  }, [courseId, user]);

  const fetchCourseDetails = async () => {
    if (!courseId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          profiles!courses_teacher_id_fkey (
            full_name,
            avatar_url,
            bio
          )
        `)
        .eq('id', courseId)
        .eq('is_published', true)
        .single();

      if (error) {
        console.error('Supabase error fetching course details:', error);
        throw error;
      }

      if (!data) {
        console.warn('No course found with ID:', courseId);
        setCourse(fallbackCourse);
        return;
      }

      try {
        // Fetch additional stats
        const [enrollmentsResult, lessonsResult, testimonialsResult] = await Promise.all([
          supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', courseId),
          
          supabase
            .from('lessons')
            .select('*')
            .eq('course_id', courseId)
            .order('order_index'),
          
          supabase
            .from('testimonials')
            .select('rating')
            .eq('course_id', courseId)
            .eq('is_approved', true)
        ]);

        const averageRating = testimonialsResult.data && testimonialsResult.data.length > 0
          ? testimonialsResult.data.reduce((sum, t) => sum + t.rating, 0) / testimonialsResult.data.length
          : 0;

        setCourse({
          ...data,
          enrollments_count: enrollmentsResult.count || 0,
          lessons_count: lessonsResult.data?.length || 0,
          average_rating: averageRating
        });

        setLessons(lessonsResult.data || []);
      } catch (statsError) {
        console.warn('Error fetching course stats, using default values:', statsError);
        setCourse({
          ...data,
          enrollments_count: 0,
          lessons_count: 0,
          average_rating: 0
        });
        setLessons([]);
      }
    } catch (error: any) {
      console.error('Error fetching course:', error);
      setError(error.message || 'Failed to load course details');
      
      // Use fallback data when API fails
      setCourse(fallbackCourse);
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchCourseDetails();
  };

  const checkEnrollment = async () => {
    if (!user || !courseId) return;

    try {
      const { data } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .eq('payment_status', 'completed')
        .maybeSingle();

      setIsEnrolled(!!data);
    } catch (error) {
      console.error('Error checking enrollment:', error);
      // Don't set error state for enrollment check failure
    }
  };

  const handleEnrollClick = () => {
    if (!user) {
      toast({
        title: isRTL ? 'تسجيل الدخول مطلوب' : 'Sign In Required',
        description: isRTL ? 'يجب تسجيل الدخول أولاً للتسجيل في الدورة' : 'Please sign in to enroll in this course'
      });
      navigate('/auth');
      return;
    }

    if (course?.price === 0) {
      // Free course - direct enrollment
      enrollInFreeCourse();
    } else {
      // Paid course - show payment flow
      setShowPayment(true);
    }
  };

  const enrollInFreeCourse = async () => {
    if (!course || !user) return;

    try {
      // Create enrollment record
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          student_id: user.id,
          course_id: course.id,
          enrollment_date: new Date().toISOString(),
          payment_status: 'completed',
          progress: 0
        });

      if (enrollmentError) throw enrollmentError;

      setIsEnrolled(true);
      toast({
        title: isRTL ? 'تم التسجيل بنجاح!' : 'Successfully Enrolled!',
        description: isRTL ? 'تم تسجيلك في الدورة بنجاح' : 'You have been successfully enrolled in the course'
      });
    } catch (error: any) {
      console.error('Error enrolling in free course:', error);
      toast({
        title: isRTL ? 'خطأ في التسجيل' : 'Enrollment Error',
        description: error.message || (isRTL ? 'حدث خطأ أثناء التسجيل في الدورة' : 'An error occurred while enrolling in the course'),
        variant: 'destructive'
      });
    }
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

  const formatPrice = (price: number) => {
    if (price === 0) return isRTL ? 'مجاني' : 'Free';
    return isRTL ? `${price} ج.م` : `${price} EGP`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-8">
          <div className="container mx-auto px-4">
            {/* Loading skeleton */}
            <div className="animate-pulse space-y-8">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-muted rounded" />
                <div className="h-8 bg-muted rounded w-48" />
              </div>
              
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="aspect-video bg-muted rounded-lg" />
                  <div className="space-y-4">
                    <div className="h-8 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="h-64 bg-muted rounded-lg" />
                  <div className="space-y-3">
                    <div className="h-6 bg-muted rounded w-full" />
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-6 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-8">
          <div className="container mx-auto px-4 text-center">
            <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {isRTL ? 'الدورة غير موجودة' : 'Course Not Found'}
            </h1>
            <p className="text-muted-foreground mb-4">
              {isRTL ? 'الدورة التي تبحث عنها غير موجودة أو تم حذفها' : 'The course you are looking for does not exist or has been removed'}
            </p>
            <Button onClick={() => navigate('/courses')}>
              {isRTL ? 'العودة إلى الدورات' : 'Back to Courses'}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-8">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/courses')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {isRTL ? 'العودة إلى الدورات' : 'Back to Courses'}
            </Button>
          </div>

          {/* Error message and retry button */}
          {error && (
            <div className="flex items-center justify-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg max-w-md mx-auto mb-6">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <span className="text-sm text-destructive">
                {isRTL ? 'حدث خطأ في تحميل بيانات الدورة' : 'Error loading course details'}
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

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Video/Image */}
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg overflow-hidden">
                {course.preview_video_url && (
  <iframe
    src={course.preview_video_url}
    className="w-full h-full object-cover"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  ></iframe>
)}
                ) : course.cover_image_url ? (
                  <img 
                    src={course.cover_image_url}
                    alt={isRTL ? course.title_ar : course.title_en}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-16 h-16 text-primary" />
                  </div>
                )}
              </div>

              {/* Course Title and Description */}
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  {isRTL ? course.title_ar : course.title_en}
                </h1>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {isRTL ? course.description_ar : course.description_en}
                </p>

                {/* Course Stats */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {course.duration_hours}h
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {course.lessons_count || 0} {isRTL ? 'درس' : 'lessons'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {course.enrollments_count || 0} {isRTL ? 'طالب' : 'students'}
                  </div>
                  {course.average_rating > 0 && (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      {course.average_rating.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>

              {/* Course Tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">
                    {isRTL ? 'نظرة عامة' : 'Overview'}
                  </TabsTrigger>
                  <TabsTrigger value="curriculum">
                    {isRTL ? 'المنهج' : 'Curriculum'}
                  </TabsTrigger>
                  <TabsTrigger value="reviews">
                    {isRTL ? 'التقييمات' : 'Reviews'}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">
                      {isRTL ? 'متطلبات الدورة' : 'Course Requirements'}
                    </h3>
                    <p className="text-muted-foreground">
                      {isRTL ? course.requirements_ar : course.requirements_en}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">
                      {isRTL ? 'ماذا ستتعلم' : 'What You\'ll Learn'}
                    </h3>
                    <p className="text-muted-foreground">
                      {isRTL ? course.syllabus_ar : course.syllabus_en}
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="curriculum" className="space-y-4">
                  <h3 className="text-xl font-semibold">
                    {isRTL ? 'محتوى الدورة' : 'Course Content'}
                  </h3>
                  {lessons.length > 0 ? (
                    <div className="space-y-2">
                      {lessons.map((lesson: any, index: number) => (
                        <div key={lesson.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">
                              {isRTL ? lesson.title_ar : lesson.title_en}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {lesson.duration_minutes} {isRTL ? 'دقيقة' : 'minutes'}
                            </p>
                          </div>
                          <CheckCircle className="w-5 h-5 text-primary" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {isRTL ? 'لا توجد دروس متاحة حالياً' : 'No lessons available at the moment'}
                    </p>
                  )}
                </TabsContent>
                
                <TabsContent value="reviews" className="space-y-4">
                  <h3 className="text-xl font-semibold">
                    {isRTL ? 'تقييمات الطلاب' : 'Student Reviews'}
                  </h3>
                  <p className="text-muted-foreground">
                    {isRTL ? 'لا توجد تقييمات متاحة حالياً' : 'No reviews available at the moment'}
                  </p>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Course Card */}
              <Card className="sticky top-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {formatPrice(course.price)}
                    </span>
                    <Badge className={getDifficultyColor(course.difficulty_level)}>
                      {getDifficultyLabel(course.difficulty_level)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleEnrollClick}
                    disabled={isEnrolled}
                  >
                    {isEnrolled ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {isRTL ? 'مسجل بالفعل' : 'Already Enrolled'}
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {isRTL ? 'سجل الآن' : 'Enroll Now'}
                      </>
                    )}
                  </Button>
                  
                  <div className="text-center text-sm text-muted-foreground">
                    {isRTL ? '30 يوم ضمان استرداد الأموال' : '30-day money-back guarantee'}
                  </div>
                </CardContent>
              </Card>

              {/* Instructor Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {isRTL ? 'المدرب' : 'Instructor'}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      {course.profiles?.avatar_url ? (
                        <img 
                          src={course.profiles.avatar_url} 
                          alt={course.profiles.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Users className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {course.profiles?.full_name || (isRTL ? 'المدرب' : 'Instructor')}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {course.profiles?.bio || (isRTL ? 'مدرب معتمد' : 'Certified Instructor')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isRTL ? 'إتمام التسجيل' : 'Complete Enrollment'}
            </DialogTitle>
            <DialogDescription>
              {isRTL 
                ? 'اختر طريقة الدفع لإتمام تسجيلك في الدورة'
                : 'Choose your payment method to complete your course enrollment'
              }
            </DialogDescription>
          </DialogHeader>
          
                     <PaymentFlow 
             courseId={courseId!}
             courseTitle={isRTL ? course.title_ar : course.title_en}
             coursePrice={course.price}
             onPaymentSuccess={() => {
               setShowPayment(false);
               setIsEnrolled(true);
             }}
             onPaymentCancel={() => setShowPayment(false)}
           />
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default CourseDetail;