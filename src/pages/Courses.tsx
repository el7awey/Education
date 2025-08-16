import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import CourseCard from '../components/CourseCard.tsx';
import { Button } from '../components/ui/button.tsx';
import { Input } from '../components/ui/input.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select.tsx';
import { Badge } from '../components/ui/badge.tsx';
import { Search, Filter, Grid3X3, List, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../integrations/supabase/client.ts';

const Courses = () => {
  const { t, isRTL } = useLanguage();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: isRTL ? 'جميع الفئات' : 'All Categories' }
  ]);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

  // Fetch courses and categories
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: categoriesData, error: categoriesError }, { data: coursesData, error: coursesError }] = await Promise.all([
        supabase.from('categories').select('*').order('name_en'),
        supabase.from('courses').select(`*, profiles!courses_teacher_id_fkey ( full_name ), categories!courses_category_id_fkey ( name_en, name_ar )`).eq('is_published', true).order('created_at', { ascending: false })
      ]);

      if (categoriesError) throw categoriesError;
      if (coursesError) throw coursesError;

      setCategories(categoriesData && categoriesData.length > 0
        ? [{ value: 'all', label: isRTL ? 'جميع الفئات' : 'All Categories' }, ...categoriesData.map((c: any) => ({ value: c.id, label: isRTL ? c.name_ar : c.name_en }))]
        : [{ value: 'all', label: isRTL ? 'جميع الفئات' : 'All Categories' }]
      );

      if (!coursesData || coursesData.length === 0) {
        setCourses([]);
        return;
      }

      const coursesWithStats = await Promise.all(coursesData.map(async (course: any) => {
        try {
          const [{ count: lessonsCount }, { count: studentsCount }, { data: testimonials }] = await Promise.all([
            supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('course_id', course.id),
            supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('course_id', course.id),
            supabase.from('testimonials').select('rating').eq('course_id', course.id).eq('is_approved', true)
          ]);
          const averageRating = testimonials && testimonials.length > 0
            ? testimonials.reduce((sum: number, t: any) => sum + t.rating, 0) / testimonials.length
            : 0;
          return { ...course, lessons_count: lessonsCount || 0, students_count: studentsCount || 0, average_rating: averageRating };
        } catch {
          return { ...course, lessons_count: 0, students_count: 0, average_rating: 0 };
        }
      }));

      setCourses(coursesWithStats);
    } catch (e: any) {
      console.error('Error loading courses', e);
      setError(e.message || 'Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [isRTL, retryCount]);

  // Handle Paymob redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order');
    const success = params.get('success') === 'true';

    if (orderId) {
      const updatePaymentStatus = async () => {
        try {
          // 1- نحدث حالة الدفع
          const { data: payment, error } = await supabase
            .from('payments')
            .update({ status: success ? 'completed' : 'failed' })
            .eq('paymob_order_id', orderId)
            .select()
            .single();
  
          if (error) {
            console.error('Failed to update payment status:', error);
            setPaymentStatus('failed');
            setPaymentMessage(isRTL ? 'فشل تحديث حالة الدفع!' : 'Failed to update payment status!');
            return;
          }
  
          // 2- لو الدفع ناجح نضيف enrollment
          if (success && payment) {
            const user = (await supabase.auth.getUser()).data.user; // الطالب الحالي
            if (user) {
              const { error: enrollError } = await supabase
                .from('enrollments')
                .insert({
                  student_id: user.id,
                  course_id: payment.course_id, // لازم تتأكد إن payment فيه course_id
                  payment_id: payment.id,
                  payment_status: 'completed',
                  enrolled_at: new Date().toISOString()
                });
  
              if (enrollError) {
                console.error('Error inserting enrollment:', enrollError);
              }
            }
          }
  
          // 3- نظهر رسالة النجاح أو الفشل
          setPaymentStatus(success ? 'success' : 'failed');
          setPaymentMessage(
            success 
              ? isRTL ? 'تم الدفع بنجاح!' : 'Payment successful!'
              : isRTL ? 'فشل الدفع!' : 'Payment failed!'
          );
        } catch (err) {
          console.error('Error updating payment status:', err);
          setPaymentStatus('failed');
          setPaymentMessage(isRTL ? 'حدث خطأ أثناء تحديث الدفع' : 'Error updating payment status');
        }
      };
      updatePaymentStatus();
    }
  }, []);

  const handleRetry = () => setRetryCount(prev => prev + 1);

  const levels = [
    { value: 'all', label: isRTL ? 'جميع المستويات' : 'All Levels' },
    { value: 'beginner', label: isRTL ? 'مبتدئ' : 'Beginner' },
    { value: 'intermediate', label: isRTL ? 'متوسط' : 'Intermediate' },
    { value: 'advanced', label: isRTL ? 'متقدم' : 'Advanced' }
  ];

  const filteredCourses = useMemo(() => {
    return courses.filter((course: any) => {
      const title = isRTL ? course.title_ar : course.title_en;
      const desc = isRTL ? (course.short_description_ar || '') : (course.short_description_en || '');
      const matchesSearch = (title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (desc || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || course.category_id === selectedCategory;
      const matchesLevel = selectedLevel === 'all' || course.difficulty_level === selectedLevel;
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [courses, searchTerm, selectedCategory, selectedLevel, isRTL]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">{isRTL ? 'جميع الدورات' : 'All Courses'}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{isRTL ? 'اكتشف مجموعة واسعة من الدورات التعليمية عالية الجودة' : 'Discover a wide range of high-quality educational courses'}</p>

            {/* Error message */}
            {error && (
              <div className="flex items-center justify-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg max-w-md mx-auto">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <span className="text-sm text-destructive">{isRTL ? 'حدث خطأ في تحميل الدورات' : 'Error loading courses'}</span>
                <Button variant="outline" size="sm" onClick={handleRetry} className="h-8 px-3 flex-shrink-0">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  {isRTL ? 'إعادة المحاولة' : 'Retry'}
                </Button>
              </div>
            )}
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder={isRTL ? 'البحث في الدورات...' : 'Search courses...'} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder={isRTL ? 'اختر الفئة' : 'Select Category'} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder={isRTL ? 'اختر المستوى' : 'Select Level'} />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex border rounded-lg">
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="rounded-r-none"><Grid3X3 className="w-4 h-4" /></Button>
              <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="rounded-l-none"><List className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">{isRTL ? `تم العثور على ${filteredCourses.length} دورة` : `Found ${filteredCourses.length} courses`}</p>
          </div>

          {/* Courses */}
          {loading ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {[...Array(8)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  {viewMode === 'grid' ? (
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
                  ) : (
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                      <div className="flex justify-between items-center">
                        <div className="h-6 bg-muted rounded w-16" />
                        <div className="h-4 bg-muted rounded w-12" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={isRTL ? course.title_ar : course.title_en}
                  description={isRTL ? course.short_description_ar : course.short_description_en}
                  instructor={course.profiles.full_name}
                  price={course.price}
                  duration={course.duration_hours}
                  lessons={course.lessons_count}
                  students={course.students_count}
                  rating={course.average_rating}
                  level={course.difficulty_level}
                  category={isRTL ? course.categories.name_ar : course.categories.name_en}
                  image={course.cover_image_url}
                  featured={course.is_featured}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{isRTL ? 'لم يتم العثور على دورات' : 'No courses found'}</h3>
              <p className="text-muted-foreground mb-4">{isRTL ? 'جرب تغيير معايير البحث أو الفلاتر' : 'Try adjusting your search criteria or filters'}</p>
              <Button variant="outline" onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setSelectedLevel('all'); }}>
                {isRTL ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Payment Overlay */}
      {paymentStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-sm w-full text-center space-y-4">
            <h2 className={`text-2xl font-bold ${paymentStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {paymentStatus === 'success' ? (isRTL ? 'نجاح' : 'Success') : (isRTL ? 'فشل' : 'Failed')}
            </h2>
            <p>{paymentMessage}</p>
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => setPaymentStatus(null)}
            >
              {isRTL ? 'اغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
