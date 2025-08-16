import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Filter, 
  GraduationCap,
  Calendar,
  DollarSign,
  User,
  BookOpen,
  Loader2,
  Clock
} from 'lucide-react';

interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrollment_date: string;
  status: 'active' | 'completed' | 'cancelled';
  progress_percentage: number;
  last_accessed: string;
  student?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  course?: {
    title_en: string;
    title_ar: string;
    price: number;
    duration_hours: number;
  };
  payment?: {
    amount: number;
    status: string;
    payment_method: string;
  };
}

const AdminEnrollments = () => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [enrollmentsResult, coursesResult] = await Promise.all([
        supabase
          .from('enrollments')
          .select(`
            *,
            student:profiles!enrollments_student_id_fkey(full_name, email, avatar_url),
            course:courses!enrollments_course_id_fkey(title_en, title_ar, price, duration_hours),
            payment:payments!enrollments_payment_id_fkey(amount, status, payment_method)
          `)
          .order('enrollment_date', { ascending: false }),
        supabase.from('courses').select('id, title_en, title_ar').order('title_en')
      ]);

      if (enrollmentsResult.error) throw enrollmentsResult.error;
      if (coursesResult.error) throw coursesResult.error;

      setEnrollments(enrollmentsResult.data || []);
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

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch = 
      (enrollment.student?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enrollment.student?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enrollment.course?.title_en || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enrollment.course?.title_ar || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || enrollment.status === statusFilter;
    const matchesCourse = courseFilter === 'all' || enrollment.course_id === courseFilter;
    return matchesSearch && matchesStatus && matchesCourse;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return isRTL ? 'نشط' : 'Active';
      case 'completed':
        return isRTL ? 'مكتمل' : 'Completed';
      case 'cancelled':
        return isRTL ? 'ملغي' : 'Cancelled';
      default:
        return status;
    }
  };

  const getPaymentStatusBadge = (payment: any) => {
    if (!payment) return null;
    
    const variant = payment.status === 'completed' ? 'default' : 'outline';
    const label = payment.status === 'completed' 
      ? (isRTL ? 'مدفوع' : 'Paid')
      : (isRTL ? 'معلق' : 'Pending');
    
    return <Badge variant={variant} className="text-xs">{label}</Badge>;
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
            {isRTL ? 'إدارة التسجيلات' : 'Manage Enrollments'}
          </h1>
          <p className="text-muted-foreground">
            {isRTL 
              ? 'عرض وإدارة تسجيلات الطلاب في الدورات'
              : 'View and manage student course enrollments'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {filteredEnrollments.length} {isRTL ? 'تسجيل' : 'enrollments'}
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
                placeholder={isRTL ? 'البحث في التسجيلات...' : 'Search enrollments...'}
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
                <SelectItem value="active">
                  {isRTL ? 'نشط' : 'Active'}
                </SelectItem>
                <SelectItem value="completed">
                  {isRTL ? 'مكتمل' : 'Completed'}
                </SelectItem>
                <SelectItem value="cancelled">
                  {isRTL ? 'ملغي' : 'Cancelled'}
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

      {/* Enrollments Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isRTL ? 'قائمة التسجيلات' : 'Enrollments List'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRTL ? 'الطالب' : 'Student'}</TableHead>
                <TableHead>{isRTL ? 'الدورة' : 'Course'}</TableHead>
                <TableHead>{isRTL ? 'تاريخ التسجيل' : 'Enrollment Date'}</TableHead>
                <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                <TableHead>{isRTL ? 'التقدم' : 'Progress'}</TableHead>
                <TableHead>{isRTL ? 'آخر وصول' : 'Last Accessed'}</TableHead>
                <TableHead>{isRTL ? 'المدفوعات' : 'Payment'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={enrollment.student?.avatar_url || ''} />
                        <AvatarFallback>
                          {enrollment.student?.full_name?.charAt(0) || enrollment.student?.email?.charAt(0) || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {enrollment.student?.full_name || (isRTL ? 'بدون اسم' : 'No Name')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {enrollment.student?.email}
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
                          {isRTL ? enrollment.course?.title_ar : enrollment.course?.title_en}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{enrollment.course?.duration_hours}h</span>
                          <DollarSign className="w-3 h-3" />
                          <span>
                            {enrollment.course?.price === 0 
                              ? (isRTL ? 'مجاني' : 'Free')
                              : `EGP ${enrollment.course?.price}`
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(enrollment.enrollment_date).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(enrollment.status)}>
                      {getStatusLabel(enrollment.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${enrollment.progress_percentage || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium min-w-[3rem]">
                        {enrollment.progress_percentage || 0}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {enrollment.last_accessed 
                          ? new Date(enrollment.last_accessed).toLocaleDateString()
                          : (isRTL ? 'لم يتم الوصول' : 'Never accessed')
                        }
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getPaymentStatusBadge(enrollment.payment)}
                      {enrollment.payment && (
                        <div className="text-xs text-muted-foreground">
                          {enrollment.payment.payment_method === 'card' 
                            ? (isRTL ? 'بطاقة ائتمان' : 'Credit Card')
                            : (isRTL ? 'فوري' : 'Fawry')
                          }
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEnrollments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' || courseFilter !== 'all'
                        ? (isRTL ? 'لا توجد نتائج للبحث' : 'No search results')
                        : (isRTL ? 'لا توجد تسجيلات' : 'No enrollments found')
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
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {enrollments.filter(e => e.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'تسجيلات نشطة' : 'Active Enrollments'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {enrollments.filter(e => e.status === 'completed').length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'دورات مكتملة' : 'Completed Courses'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Set(enrollments.map(e => e.student_id)).size}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'طلاب مسجلين' : 'Enrolled Students'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 rounded-lg">
                <BookOpen className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Set(enrollments.map(e => e.course_id)).size}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'دورات مسجلة' : 'Enrolled Courses'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminEnrollments;
