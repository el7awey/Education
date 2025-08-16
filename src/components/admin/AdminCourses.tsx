import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye,
  BookOpen,
  Calendar,
  DollarSign,
  Clock,
  Star,
  Loader2,
  X
} from 'lucide-react';

interface Course {
  id: string;
  title_en: string;
  title_ar: string;
  short_description_en: string;
  short_description_ar: string;
  price: number;
  duration_hours: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  is_published: boolean;
  is_featured: boolean;
  category_id: string | null;
  teacher_id: string;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  teacher?: {
    full_name: string;
  };
  category?: {
    name_en: string;
    name_ar: string;
  };
}

interface Category {
  id: string;
  name_en: string;
  name_ar: string;
}

interface Teacher {
  user_id: string;
  full_name: string;
  email: string;
}

const AdminCourses = () => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [courseForm, setCourseForm] = useState<Partial<Course>>({
    title_en: '',
    title_ar: '',
    short_description_en: '',
    short_description_ar: '',
    price: 0,
    duration_hours: 0,
    difficulty_level: 'beginner',
    is_published: false,
    is_featured: false,
    category_id: null,
    teacher_id: '',
    cover_image_url: null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesResult, categoriesResult, teachersResult] = await Promise.all([
        supabase
          .from('courses')
          .select(`
            *,
            teacher:profiles!courses_teacher_id_fkey(full_name),
            category:categories!courses_category_id_fkey(name_en, name_ar)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name_en'),
        supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .eq('role', 'teacher')
          .order('full_name')
      ]);

      if (coursesResult.error) throw coursesResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      if (teachersResult.error) throw teachersResult.error;

      setCourses(coursesResult.data || []);
      setCategories(categoriesResult.data || []);
      setTeachers(teachersResult.data || []);
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

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      (course.title_en || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.title_ar || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || course.category_id === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'published' && course.is_published) ||
      (statusFilter === 'unpublished' && !course.is_published);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreateCourse = async () => {
    try {
      // Validate required fields
      if (!courseForm.title_en || !courseForm.title_ar || !courseForm.teacher_id) {
        toast({
          title: isRTL ? 'خطأ في التحقق' : 'Validation Error',
          description: isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      setUpdating(true);
      const { error } = await supabase
        .from('courses')
        .insert([courseForm]);

      if (error) throw error;

      toast({
        title: isRTL ? 'تم الإنشاء' : 'Created',
        description: isRTL ? 'تم إنشاء الدورة بنجاح' : 'Course created successfully'
      });

      setCourseDialogOpen(false);
      resetForm();
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

  const handleUpdateCourse = async () => {
    if (!selectedCourse) return;
    
    try {
      // Validate required fields
      if (!courseForm.title_en || !courseForm.title_ar || !courseForm.teacher_id) {
        toast({
          title: isRTL ? 'خطأ في التحقق' : 'Validation Error',
          description: isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      setUpdating(true);
      const { error } = await supabase
        .from('courses')
        .update(courseForm)
        .eq('id', selectedCourse.id);

      if (error) throw error;

      toast({
        title: isRTL ? 'تم التحديث' : 'Updated',
        description: isRTL ? 'تم تحديث الدورة بنجاح' : 'Course updated successfully'
      });

      setCourseDialogOpen(false);
      resetForm();
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

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', selectedCourse.id);

      if (error) throw error;

      toast({
        title: isRTL ? 'تم الحذف' : 'Deleted',
        description: isRTL ? 'تم حذف الدورة بنجاح' : 'Course deleted successfully'
      });

      setDeleteDialogOpen(false);
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

  const resetForm = () => {
    setCourseForm({
      title_en: '',
      title_ar: '',
      short_description_en: '',
      short_description_ar: '',
      price: 0,
      duration_hours: 0,
      difficulty_level: 'beginner',
      is_published: false,
      is_featured: false,
      category_id: null,
      teacher_id: '',
      cover_image_url: null
    });
    setSelectedCourse(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setCourseDialogOpen(true);
  };

  const openEditDialog = (course: Course) => {
    setSelectedCourse(course);
    setCourseForm({
      title_en: course.title_en || '',
      title_ar: course.title_ar || '',
      short_description_en: course.short_description_en || '',
      short_description_ar: course.short_description_ar || '',
      price: course.price || 0,
      duration_hours: course.duration_hours || 0,
      difficulty_level: course.difficulty_level || 'beginner',
      is_published: course.is_published || false,
      is_featured: course.is_featured || false,
      category_id: course.category_id,
      teacher_id: course.teacher_id || '',
      cover_image_url: course.cover_image_url
    });
    setCourseDialogOpen(true);
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'beginner':
        return isRTL ? 'مبتدئ' : 'Beginner';
      case 'intermediate':
        return isRTL ? 'متوسط' : 'Intermediate';
      case 'advanced':
        return isRTL ? 'متقدم' : 'Advanced';
      default:
        return level;
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          <h2 className="text-2xl font-bold">
            {isRTL ? 'إدارة الدورات' : 'Manage Courses'}
          </h2>
          <p className="text-muted-foreground">
            {isRTL ? 'إنشاء وتعديل وحذف الدورات التعليمية' : 'Create, edit, and delete educational courses'}
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          {isRTL ? 'إضافة دورة' : 'Add Course'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={isRTL ? 'البحث في الدورات...' : 'Search courses...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={isRTL ? 'الفئة' : 'Category'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {isRTL ? 'جميع الفئات' : 'All Categories'}
                </SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {isRTL ? category.name_ar : category.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={isRTL ? 'الحالة' : 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {isRTL ? 'جميع الحالات' : 'All Status'}
                </SelectItem>
                <SelectItem value="published">
                  {isRTL ? 'منشور' : 'Published'}
                </SelectItem>
                <SelectItem value="unpublished">
                  {isRTL ? 'غير منشور' : 'Unpublished'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isRTL ? 'قائمة الدورات' : 'Courses List'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRTL ? 'الدورة' : 'Course'}</TableHead>
                <TableHead>{isRTL ? 'المدرب' : 'Teacher'}</TableHead>
                <TableHead>{isRTL ? 'الفئة' : 'Category'}</TableHead>
                <TableHead>{isRTL ? 'السعر' : 'Price'}</TableHead>
                <TableHead>{isRTL ? 'المدة' : 'Duration'}</TableHead>
                <TableHead>{isRTL ? 'المستوى' : 'Level'}</TableHead>
                <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                <TableHead className="text-right">{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {isRTL ? course.title_ar : course.title_en}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {isRTL ? course.short_description_ar : course.short_description_en}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {course.teacher?.full_name || (isRTL ? 'غير محدد' : 'Unknown')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {course.category 
                        ? (isRTL ? course.category.name_ar : course.category.name_en)
                        : (isRTL ? 'بدون فئة' : 'No Category')
                      }
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {course.price === 0 
                          ? (isRTL ? 'مجاني' : 'Free')
                          : `EGP ${course.price}`
                        }
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{course.duration_hours}h</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getDifficultyColor(course.difficulty_level)}>
                      {getDifficultyLabel(course.difficulty_level)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={course.is_published ? 'default' : 'outline'}>
                        {course.is_published ? (isRTL ? 'منشور' : 'Published') : (isRTL ? 'غير منشور' : 'Unpublished')}
                      </Badge>
                      {course.is_featured && (
                        <Badge variant="secondary" className="text-xs">
                          {isRTL ? 'مميز' : 'Featured'}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(course)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedCourse(course);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCourses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                        ? (isRTL ? 'لا توجد نتائج للبحث' : 'No search results')
                        : (isRTL ? 'لا توجد دورات' : 'No courses found')
                      }
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Course Dialog */}
      <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCourse 
                ? (isRTL ? 'تعديل الدورة' : 'Edit Course')
                : (isRTL ? 'إنشاء دورة جديدة' : 'Create New Course')
              }
            </DialogTitle>
            <DialogDescription>
              {isRTL 
                ? 'أدخل تفاصيل الدورة'
                : 'Enter course details'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">
                {isRTL ? 'العنوان (EN)' : 'Title (EN)'} *
              </label>
              <Input
                value={courseForm.title_en || ''}
                onChange={(e) => setCourseForm({ ...courseForm, title_en: e.target.value })}
                placeholder={isRTL ? 'أدخل العنوان بالإنجليزية' : 'Enter title in English'}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {isRTL ? 'العنوان (AR)' : 'Title (AR)'} *
              </label>
              <Input
                value={courseForm.title_ar || ''}
                onChange={(e) => setCourseForm({ ...courseForm, title_ar: e.target.value })}
                placeholder={isRTL ? 'أدخل العنوان بالعربية' : 'Enter title in Arabic'}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">
                {isRTL ? 'وصف مختصر (EN)' : 'Short Description (EN)'}
              </label>
              <Textarea
                value={courseForm.short_description_en || ''}
                onChange={(e) => setCourseForm({ ...courseForm, short_description_en: e.target.value })}
                placeholder={isRTL ? 'أدخل الوصف المختصر بالإنجليزية' : 'Enter short description in English'}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">
                {isRTL ? 'وصف مختصر (AR)' : 'Short Description (AR)'}
              </label>
              <Textarea
                value={courseForm.short_description_ar || ''}
                onChange={(e) => setCourseForm({ ...courseForm, short_description_ar: e.target.value })}
                placeholder={isRTL ? 'أدخل الوصف المختصر بالعربية' : 'Enter short description in Arabic'}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {isRTL ? 'المدرب' : 'Teacher'} *
              </label>
              <Select
                value={courseForm.teacher_id || ''}
                onValueChange={(value) => setCourseForm({ ...courseForm, teacher_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isRTL ? 'اختر المدرب' : 'Select teacher'} />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.user_id} value={teacher.user_id}>
                      {teacher.full_name} ({teacher.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">
                {isRTL ? 'السعر (EGP)' : 'Price (EGP)'}
              </label>
              <Input
                type="number"
                value={courseForm.price || 0}
                onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {isRTL ? 'المدة (ساعات)' : 'Duration (hours)'}
              </label>
              <Input
                type="number"
                value={courseForm.duration_hours || 0}
                onChange={(e) => setCourseForm({ ...courseForm, duration_hours: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {isRTL ? 'المستوى' : 'Difficulty Level'}
              </label>
              <Select
                value={courseForm.difficulty_level || 'beginner'}
                onValueChange={(value) => setCourseForm({ ...courseForm, difficulty_level: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">
                    {isRTL ? 'مبتدئ' : 'Beginner'}
                  </SelectItem>
                  <SelectItem value="intermediate">
                    {isRTL ? 'متوسط' : 'Intermediate'}
                  </SelectItem>
                  <SelectItem value="advanced">
                    {isRTL ? 'متقدم' : 'Advanced'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">
                {isRTL ? 'الفئة' : 'Category'}
              </label>
              <Select
                value={courseForm.category_id || 'none'}
                onValueChange={(value) => setCourseForm({ 
                  ...courseForm, 
                  category_id: value === 'none' ? null : value 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isRTL ? 'اختر الفئة' : 'Select category'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {isRTL ? 'بدون فئة' : 'No Category'}
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {isRTL ? category.name_ar : category.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">
                {isRTL ? 'رابط صورة الغلاف' : 'Cover Image URL'}
              </label>
              <Input
                value={courseForm.cover_image_url || ''}
                onChange={(e) => setCourseForm({ ...courseForm, cover_image_url: e.target.value })}
                placeholder={isRTL ? 'أدخل رابط صورة الغلاف' : 'Enter cover image URL'}
              />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={courseForm.is_published || false}
                  onChange={(e) => setCourseForm({ ...courseForm, is_published: e.target.checked })}
                />
                {isRTL ? 'منشور' : 'Published'}
              </label>
              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={courseForm.is_featured || false}
                  onChange={(e) => setCourseForm({ ...courseForm, is_featured: e.target.checked })}
                />
                {isRTL ? 'مميز' : 'Featured'}
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setCourseDialogOpen(false)}
            >
              <X className="w-4 h-4 mr-2" />
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={selectedCourse ? handleUpdateCourse : handleCreateCourse}
              disabled={updating}
            >
              {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedCourse 
                ? (isRTL ? 'حفظ التغييرات' : 'Save Changes')
                : (isRTL ? 'إنشاء الدورة' : 'Create Course')
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isRTL ? 'تأكيد الحذف' : 'Confirm Deletion'}
            </DialogTitle>
            <DialogDescription>
              {isRTL 
                ? 'هل أنت متأكد من حذف هذه الدورة؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this course? This action cannot be undone.'
              }
            </DialogDescription>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">
                  {isRTL ? selectedCourse.title_ar : selectedCourse.title_en}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? selectedCourse.short_description_ar : selectedCourse.short_description_en}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteCourse}
                  disabled={updating}
                >
                  {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isRTL ? 'حذف' : 'Delete'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCourses;
