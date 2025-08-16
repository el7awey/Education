import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.tsx';
import { useToast } from '../../hooks/use-toast.ts';
import { supabase } from '../../integrations/supabase/client.ts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Input } from '../../components/ui/input.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select.tsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar.tsx';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Star,
  MessageSquare,
  Calendar,
  User,
  BookOpen,
  Loader2
} from 'lucide-react';

interface Testimonial {
  id: string;
  student_id: string;
  course_id: string;
  rating: number;
  comment_en: string;
  comment_ar: string;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  student?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  course?: {
    title_en: string;
    title_ar: string;
  };
}

const AdminTestimonials = () => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [courses, setCourses] = useState<any[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [testimonialsResult, coursesResult] = await Promise.all([
        supabase
          .from('testimonials')
          .select(`
            *,
            student:profiles!testimonials_student_id_fkey(full_name, email, avatar_url),
            course:courses!testimonials_course_id_fkey(title_en, title_ar)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('courses').select('id, title_en, title_ar').order('title_en')
      ]);

      if (testimonialsResult.error) throw testimonialsResult.error;
      if (coursesResult.error) throw coursesResult.error;

    setTestimonials(testimonialsResult.data as unknown as Testimonial[]);
      setCourses(coursesResult.data || []);
    } catch (error: any) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTestimonials = testimonials.filter(testimonial => {
    const matchesSearch = 
      (testimonial.student?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (testimonial.student?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (testimonial.course?.title_en || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (testimonial.course?.title_ar || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'approved' && testimonial.is_approved) ||
      (statusFilter === 'pending' && !testimonial.is_approved);
    const matchesCourse = courseFilter === 'all' || testimonial.course_id === courseFilter;
    return matchesSearch && matchesStatus && matchesCourse;
  });

  const handleApproveTestimonial = async (testimonialId: string, approved: boolean) => {
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('testimonials')
        .update({ is_approved: approved })
        .eq('id', testimonialId);

      if (error) throw error;

      toast({
        title: approved ? (isRTL ? 'تمت الموافقة' : 'Approved') : (isRTL ? 'تم الرفض' : 'Rejected'),
        description: approved 
          ? (isRTL ? 'تمت الموافقة على التقييم' : 'Testimonial approved')
          : (isRTL ? 'تم رفض التقييم' : 'Testimonial rejected')
      });

      await fetchData();
    } catch (error: any) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleFeatured = async (testimonialId: string, featured: boolean) => {
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('testimonials')
        .update({ is_featured: featured })
        .eq('id', testimonialId);

      if (error) throw error;

      toast({
        title: featured ? (isRTL ? 'تم التمييز' : 'Featured') : (isRTL ? 'تم إلغاء التمييز' : 'Unfeatured'),
        description: featured 
          ? (isRTL ? 'تم تمييز التقييم' : 'Testimonial featured')
          : (isRTL ? 'تم إلغاء تمييز التقييم' : 'Testimonial unfeatured')
      });

      await fetchData();
    } catch (error: any) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm font-medium ml-1">{rating}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {isRTL ? 'إدارة التقييمات' : 'Manage Testimonials'}
          </h1>
          <p className="text-muted-foreground">
            {isRTL 
              ? 'مراجعة وإدارة تقييمات الطلاب للدورات'
              : 'Review and manage student course testimonials'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {filteredTestimonials.length} {isRTL ? 'تقييم' : 'testimonials'}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={isRTL ? 'البحث في التقييمات...' : 'Search testimonials...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder={isRTL ? 'جميع الحالات' : 'All Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {isRTL ? 'جميع الحالات' : 'All Status'}
                </SelectItem>
                <SelectItem value="approved">
                  {isRTL ? 'تمت الموافقة' : 'Approved'}
                </SelectItem>
                <SelectItem value="pending">
                  {isRTL ? 'في الانتظار' : 'Pending'}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger>
                <SelectValue placeholder={isRTL ? 'جميع الدورات' : 'All Courses'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {isRTL ? 'جميع الدورات' : 'All Courses'}
                </SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {isRTL ? course.title_ar : course.title_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {isRTL ? 'مفلتر' : 'Filtered'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testimonials Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isRTL ? 'قائمة التقييمات' : 'Testimonials List'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRTL ? 'الطالب' : 'Student'}</TableHead>
                <TableHead>{isRTL ? 'الدورة' : 'Course'}</TableHead>
                <TableHead>{isRTL ? 'التقييم' : 'Rating'}</TableHead>
                <TableHead>{isRTL ? 'التعليق' : 'Comment'}</TableHead>
                <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                <TableHead>{isRTL ? 'تاريخ الإنشاء' : 'Created'}</TableHead>
                <TableHead className="text-right">
                  {isRTL ? 'الإجراءات' : 'Actions'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTestimonials.map((testimonial) => (
                <TableRow key={testimonial.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={testimonial.student?.avatar_url || ''} />
                        <AvatarFallback>
                          {testimonial.student?.full_name?.charAt(0) || testimonial.student?.email?.charAt(0) || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {testimonial.student?.full_name || (isRTL ? 'بدون اسم' : 'No Name')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {testimonial.student?.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {isRTL ? testimonial.course?.title_ar : testimonial.course?.title_en}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {renderStars(testimonial.rating)}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm">
                        {isRTL ? testimonial.comment_ar : testimonial.comment_en}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isRTL ? testimonial.comment_en : testimonial.comment_ar}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={testimonial.is_approved ? 'default' : 'outline'}>
                        {testimonial.is_approved 
                          ? (isRTL ? 'تمت الموافقة' : 'Approved')
                          : (isRTL ? 'في الانتظار' : 'Pending')
                        }
                      </Badge>
                      {testimonial.is_featured && (
                        <Badge variant="secondary" className="text-xs">
                          {isRTL ? 'مميز' : 'Featured'}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(testimonial.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!testimonial.is_approved ? (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApproveTestimonial(testimonial.id, true)}
                          disabled={updating}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {isRTL ? 'موافقة' : 'Approve'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproveTestimonial(testimonial.id, false)}
                          disabled={updating}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          {isRTL ? 'رفض' : 'Reject'}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={testimonial.is_featured ? 'secondary' : 'outline'}
                        onClick={() => handleToggleFeatured(testimonial.id, !testimonial.is_featured)}
                        disabled={updating}
                      >
                        <Star className="w-4 h-4 mr-1" />
                        {testimonial.is_featured 
                          ? (isRTL ? 'إلغاء التمييز' : 'Unfeature')
                          : (isRTL ? 'تمييز' : 'Feature')
                        }
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTestimonials.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' || courseFilter !== 'all'
                        ? (isRTL ? 'لا توجد نتائج للبحث' : 'No search results')
                        : (isRTL ? 'لا توجد تقييمات' : 'No testimonials found')
                      }
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {testimonials.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'إجمالي التقييمات' : 'Total Testimonials'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {testimonials.filter(t => t.is_approved).length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'تمت الموافقة' : 'Approved'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <MessageSquare className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {testimonials.filter(t => !t.is_approved).length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'في الانتظار' : 'Pending'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {testimonials.filter(t => t.is_featured).length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'مميزة' : 'Featured'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminTestimonials;
