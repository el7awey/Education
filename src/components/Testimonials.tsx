import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Star, 
  Quote, 
  ChevronLeft, 
  ChevronRight,
  Users,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';

const Testimonials = () => {
  const { t, isRTL } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fallback testimonials to show when API fails
  const fallbackTestimonials = [
    {
      id: 'fallback-1',
      rating: 5,
      review_en: 'Amazing course! The instructor explains complex concepts in a very clear way. Highly recommended!',
      review_ar: 'دورة رائعة! يشرح المدرب المفاهيم المعقدة بطريقة واضحة جداً. أوصي بها بشدة!',
      profiles: { full_name: 'Sarah Johnson' }
    },
    {
      id: 'fallback-2',
      rating: 5,
      review_en: 'This platform has completely transformed my learning experience. The quality of content is outstanding.',
      review_ar: 'لقد غيرت هذه المنصة تجربتي التعليمية بالكامل. جودة المحتوى متميزة.',
      profiles: { full_name: 'Ahmed Hassan' }
    },
    {
      id: 'fallback-3',
      rating: 4,
      review_en: 'Great value for money. The practical exercises really help reinforce the concepts.',
      review_ar: 'قيمة ممتازة مقابل المال. التمارين العملية تساعد حقاً في تعزيز المفاهيم.',
      profiles: { full_name: 'Maria Garcia' }
    }
  ];

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('testimonials')
          .select(`
            id,
            rating,
            review_en,
            review_ar,
            profiles!testimonials_student_id_fkey ( full_name )
          `)
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .limit(12);

        if (error) {
          console.error('Supabase error fetching testimonials:', error);
          throw error;
        }

        // If no data returned, use fallback data
        if (!data || data.length === 0) {
          console.warn('No testimonials found in database, using fallback data');
          setItems(fallbackTestimonials);
          return;
        }

        setItems(data || []);
      } catch (e: any) {
        console.error('Failed to load testimonials', e);
        setError(e.message || 'Failed to load testimonials');
        
        // Use fallback data when API fails
        setItems(fallbackTestimonials);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('testimonials')
          .select(`
            id,
            rating,
            review_en,
            review_ar,
            profiles!testimonials_student_id_fkey ( full_name )
          `)
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .limit(12);

        if (error) {
          console.error('Supabase error fetching testimonials on retry:', error);
          throw error;
        }

        if (!data || data.length === 0) {
          setItems(fallbackTestimonials);
          return;
        }

        setItems(data || []);
      } catch (e: any) {
        console.error('Failed to load testimonials on retry', e);
        setError(e.message || 'Failed to load testimonials');
        setItems(fallbackTestimonials);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % items.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev + 1 + items.length) % items.length);
  };

  // Auto-play functionality
  useEffect(() => {
    if (items.length > 0) {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
    }
  }, [items.length]);

  const visibleTestimonials = items.length > 0
    ? [
        items[currentSlide % items.length],
        items[(currentSlide + 1) % items.length],
        items[(currentSlide + 2) % items.length]
      ]
    : [];

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-secondary/10 rounded-full text-sm font-medium text-secondary">
            <Users className="w-4 h-4 mr-2" />
            {isRTL ? 'آراء الطلاب' : 'Student Reviews'}
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {isRTL ? 'ماذا يقول طلابنا عنا؟' : 'What Our Students Say About Us?'}
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isRTL 
              ? 'اكتشف تجارب طلابنا الناجحة وكيف ساعدتهم دوراتنا في تحقيق أهدافهم المهنية'
              : 'Discover our students\' success stories and how our courses helped them achieve their career goals'
            }
          </p>

          {/* Error message and retry button */}
          {error && (
            <div className="flex items-center justify-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg max-w-md mx-auto">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <span className="text-sm text-destructive">
                {isRTL ? 'حدث خطأ في تحميل التقييمات' : 'Error loading testimonials'}
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

        {/* Testimonials Carousel */}
        <div className="relative">
          {/* Main Testimonials */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {loading ? (
              // Loading skeleton
              [...Array(3)].map((_, index) => (
                <Card key={`loading-${index}`} className="animate-pulse">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-10 h-10 bg-muted rounded-lg" />
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-4 h-4 bg-muted rounded" />
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </div>
                    <div className="flex items-center space-x-3 pt-4 border-t border-border">
                      <div className="w-12 h-12 bg-muted rounded-full" />
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-24" />
                        <div className="h-3 bg-muted rounded w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : visibleTestimonials.length > 0 ? (
              visibleTestimonials.map((testimonial: any, index) => (
              <Card 
                  key={`${testimonial?.id}-${currentSlide}`} 
                className={`group hover:shadow-strong transition-all duration-500 ${
                  index === 0 ? 'scale-105 lg:scale-110 ring-2 ring-primary/20' : 'scale-95 lg:scale-100'
                }`}
              >
                <CardContent className="p-6 space-y-4">
                  {/* Quote Icon */}
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Quote className="w-5 h-5 text-primary" />
                  </div>

                  {/* Rating */}
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                            i < (testimonial?.rating || 0)
                            ? 'text-secondary fill-current' 
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-muted-foreground leading-relaxed">
                      "{isRTL ? (testimonial?.review_ar || '') : (testimonial?.review_en || '')}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center space-x-3 pt-4 border-t border-border">
                    <Avatar className="w-12 h-12 bg-gradient-primary">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                          {(testimonial?.profiles?.full_name || 'U').split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{testimonial?.profiles?.full_name || (isRTL ? 'طالب' : 'Student')}</h4>
                        <p className="text-sm text-muted-foreground">{isRTL ? 'طالب' : 'Student'}</p>
                      </div>
                  </div>
                </CardContent>
              </Card>
              ))
            ) : (
              // No testimonials available
              <div className="col-span-full text-center py-12">
                <Quote className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {isRTL ? 'لا توجد تقييمات متاحة حالياً' : 'No testimonials available'}
                </h3>
                <p className="text-muted-foreground">
                  {isRTL ? 'تحقق مرة أخرى قريباً' : 'Check back soon for new testimonials'}
                </p>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          {items.length > 0 && (
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="w-10 h-10 rounded-full"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Dots Indicator */}
            <div className="flex items-center space-x-2">
                {items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === (currentSlide % items.length)
                      ? 'bg-primary w-8' 
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="w-10 h-10 rounded-full"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-16 border-t border-border">
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-primary">4.9</div>
            <div className="text-sm text-muted-foreground">
              {isRTL ? 'متوسط التقييم' : 'Average Rating'}
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-primary">10,000+</div>
            <div className="text-sm text-muted-foreground">
              {isRTL ? 'طالب راضٍ' : 'Happy Students'}
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-primary">95%</div>
            <div className="text-sm text-muted-foreground">
              {isRTL ? 'معدل إكمال الدورات' : 'Course Completion Rate'}
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-primary">100%</div>
            <div className="text-sm text-muted-foreground">
              {isRTL ? 'ضمان الاسترداد' : 'Money Back Guarantee'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;