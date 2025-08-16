import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Star, Users, BookOpen, Trophy, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const HeroSection = () => {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [statValues, setStatValues] = useState({ students: 0, courses: 0, rating: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fallback stats to show when API fails
  const fallbackStats = { students: 1500, courses: 25, rating: 4.8 };

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [{ count: coursesCount }, { count: enrollmentsCount }, { data: ratings }] = await Promise.all([
          supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
          supabase.from('enrollments').select('*', { count: 'exact', head: true }),
          supabase.from('testimonials').select('rating').eq('is_approved', true)
        ]);
        
        const avgRating = ratings && ratings.length > 0 ? (ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length) : 0;
        setStatValues({ 
          students: enrollmentsCount || 0, 
          courses: coursesCount || 0, 
          rating: avgRating 
        });
      } catch (error: any) {
        console.error('Error loading hero stats:', error);
        setError(error.message || 'Failed to load statistics');
        
        // Use fallback stats when API fails
        setStatValues(fallbackStats);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [{ count: coursesCount }, { count: enrollmentsCount }, { data: ratings }] = await Promise.all([
          supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
          supabase.from('enrollments').select('*', { count: 'exact', head: true }),
          supabase.from('testimonials').select('rating').eq('is_approved', true)
        ]);
        
        const avgRating = ratings && ratings.length > 0 ? (ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length) : 0;
        setStatValues({ 
          students: enrollmentsCount || 0, 
          courses: coursesCount || 0, 
          rating: avgRating 
        });
      } catch (error: any) {
        console.error('Error loading hero stats on retry:', error);
        setError(error.message || 'Failed to load statistics');
        setStatValues(fallbackStats);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  };

  const stats = [
    { icon: Users, value: statValues.students.toLocaleString(), label: isRTL ? 'طالب' : 'Students' },
    { icon: BookOpen, value: statValues.courses.toLocaleString(), label: isRTL ? 'دورة' : 'Courses' },
    { icon: Trophy, value: '95%', label: isRTL ? 'معدل النجاح' : 'Success Rate' },
    { icon: Star, value: statValues.rating.toFixed(1), label: isRTL ? 'تقييم' : 'Rating' },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 bg-secondary/10 rounded-full text-sm font-medium text-secondary">
                <Star className="w-4 h-4 mr-2 fill-current" />
                {isRTL ? 'منصة تعليمية معتمدة' : 'Certified Learning Platform'}
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                {isRTL ? (
                  <>
                    <span className="text-primary">تعلم</span> بلا حدود
                    <br />
                    مع أفضل <span className="text-secondary">المعلمين</span>
                  </>
                ) : (
                  <>
                    Learn Without <span className="text-primary">Limits</span>
                    <br />
                    With Expert <span className="text-secondary">Teachers</span>
                  </>
                )}
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {isRTL 
                  ? 'اكتشف عالماً من المعرفة والإبداع. انضم إلى آلاف الطلاب الذين يحققون أهدافهم التعليمية معنا'
                  : 'Discover a world of knowledge and creativity. Join thousands of students achieving their educational goals with us'
                }
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="group shadow-medium hover:shadow-strong transition-all duration-300"
                onClick={() => navigate('/courses')}
              >
                {t('joinNow')}
                <ArrowRight className={`w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="group"
                onClick={() => navigate('/teacher')}
              >
                <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                {isRTL ? 'شاهد العرض التوضيحي' : 'Watch Demo'}
              </Button>
            </div>

            {/* Error message and retry button */}
            {error && (
              <div className="flex items-center justify-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg max-w-md">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <span className="text-sm text-destructive">
                  {isRTL ? 'حدث خطأ في تحميل الإحصائيات' : 'Error loading statistics'}
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

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {loading ? (
                      <div className="h-8 bg-muted rounded animate-pulse" />
                    ) : (
                      stat.value
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image/Video */}
          <div className="relative">
            <div className="relative bg-gradient-primary rounded-2xl p-8 shadow-strong">
              <div className="aspect-video bg-background/10 rounded-lg backdrop-blur-sm flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-background/20 rounded-full mx-auto flex items-center justify-center backdrop-blur-sm">
                    <Play className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="text-primary-foreground">
                    <h3 className="text-xl font-semibold">
                      {isRTL ? 'جولة تعريفية' : 'Platform Tour'}
                    </h3>
                    <p className="text-primary-foreground/80">
                      {isRTL ? 'اكتشف كيف تبدأ رحلتك التعليمية' : 'Discover how to start your learning journey'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-secondary rounded-full flex items-center justify-center shadow-glow animate-pulse">
              <Trophy className="w-8 h-8 text-secondary-foreground" />
            </div>
            
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-success rounded-full flex items-center justify-center shadow-soft">
              <Star className="w-6 h-6 text-success-foreground fill-current" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;