import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, BookOpen, Save, X, Loader2 } from 'lucide-react';

type CourseForm = {
  id?: string;
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
  cover_image_url: string | null;
};

type LessonForm = {
  id?: string;
  course_id: string;
  order_index: number;
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  duration_minutes?: number;
  is_free: boolean;
};

const defaultCourse: CourseForm = {
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
  cover_image_url: null
};

const TeacherCourseManager: React.FC = () => {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [courseForm, setCourseForm] = useState<CourseForm>(defaultCourse);
  const [lessons, setLessons] = useState<any[]>([]);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState<LessonForm | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [{ data: cats }, { data: list }] = await Promise.all([
        supabase.from('categories').select('*').order('name_en'),
        supabase
          .from('courses')
          .select('*')
          .eq('teacher_id', user.id)
          .order('created_at', { ascending: false })
      ]);
      setCategories(cats || []);
      setCourses(list || []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const openCreateCourse = () => {
    setCourseForm(defaultCourse);
    setSelectedCourse(null);
    setCourseDialogOpen(true);
  };

  const openEditCourse = (course: any) => {
    setSelectedCourse(course);
    setCourseForm({
      id: course.id,
      title_en: course.title_en || '',
      title_ar: course.title_ar || '',
      short_description_en: course.short_description_en || '',
      short_description_ar: course.short_description_ar || '',
      price: course.price || 0,
      duration_hours: course.duration_hours || 0,
      difficulty_level: (course.difficulty_level || 'beginner'),
      is_published: !!course.is_published,
      is_featured: !!course.is_featured,
      category_id: course.category_id || null,
      cover_image_url: course.cover_image_url || null
    });
    setCourseDialogOpen(true);
  };

  const saveCourse = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const payload: any = {
        ...courseForm,
        teacher_id: user.id
      };
      if (selectedCourse) {
        const { error } = await supabase.from('courses').update(payload).eq('id', selectedCourse.id);
        if (error) throw error;
        toast({ title: isRTL ? 'تم التحديث' : 'Updated', description: isRTL ? 'تم تحديث الدورة' : 'Course updated' });
      } else {
        const { error } = await supabase.from('courses').insert(payload);
        if (error) throw error;
        toast({ title: isRTL ? 'تم الإنشاء' : 'Created', description: isRTL ? 'تم إنشاء الدورة' : 'Course created' });
      }
      setCourseDialogOpen(false);
      await loadData();
    } catch (e: any) {
      toast({ title: isRTL ? 'خطأ' : 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من حذف الدورة؟' : 'Are you sure to delete the course?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) throw error;
      toast({ title: isRTL ? 'تم الحذف' : 'Deleted', description: isRTL ? 'تم حذف الدورة' : 'Course deleted' });
      if (selectedCourse?.id === courseId) setSelectedCourse(null);
      await loadData();
    } catch (e: any) {
      toast({ title: isRTL ? 'خطأ' : 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadLessons = async (courseId: string) => {
    try {
      const { data } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('order_index');
      setLessons(data || []);
    } catch {}
  };

  const openCreateLesson = (courseId: string) => {
    setLessonForm({
      course_id: courseId,
      order_index: (lessons[lessons.length - 1]?.order_index || 0) + 1,
      title_en: '',
      title_ar: '',
      is_free: false
    });
    setLessonDialogOpen(true);
  };

  const openEditLesson = (lesson: any) => {
    setLessonForm({
      id: lesson.id,
      course_id: lesson.course_id,
      order_index: lesson.order_index,
      title_en: lesson.title_en,
      title_ar: lesson.title_ar,
      description_en: lesson.description_en,
      description_ar: lesson.description_ar,
      duration_minutes: lesson.duration_minutes,
      is_free: !!lesson.is_free
    });
    setLessonDialogOpen(true);
  };

  const saveLesson = async () => {
    if (!lessonForm) return;
    setLoading(true);
    try {
      if (lessonForm.id) {
        const { error } = await supabase.from('lessons').update(lessonForm).eq('id', lessonForm.id);
        if (error) throw error;
        toast({ title: isRTL ? 'تم التحديث' : 'Updated', description: isRTL ? 'تم تحديث الدرس' : 'Lesson updated' });
      } else {
        const { error } = await supabase.from('lessons').insert(lessonForm);
        if (error) throw error;
        toast({ title: isRTL ? 'تم الإنشاء' : 'Created', description: isRTL ? 'تم إنشاء الدرس' : 'Lesson created' });
      }
      setLessonDialogOpen(false);
      await loadLessons(lessonForm.course_id);
    } catch (e: any) {
      toast({ title: isRTL ? 'خطأ' : 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteLesson = async (lessonId: string) => {
    if (!lessonForm?.course_id && !selectedCourse) return;
    if (!confirm(isRTL ? 'هل أنت متأكد من حذف الدرس؟' : 'Delete this lesson?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
      if (error) throw error;
      toast({ title: isRTL ? 'تم الحذف' : 'Deleted', description: isRTL ? 'تم حذف الدرس' : 'Lesson deleted' });
      await loadLessons(selectedCourse?.id || lessonForm?.course_id || '');
    } catch (e: any) {
      toast({ title: isRTL ? 'خطأ' : 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{isRTL ? 'إدارة الدورات' : 'Manage Courses'}</h3>
        <Button onClick={openCreateCourse}>
          <Plus className="w-4 h-4 mr-2" />
          {isRTL ? 'دورة جديدة' : 'New Course'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? 'دوراتي' : 'My Courses'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRTL ? 'العنوان' : 'Title'}</TableHead>
                <TableHead>{isRTL ? 'السعر' : 'Price'}</TableHead>
                <TableHead>{isRTL ? 'النشر' : 'Published'}</TableHead>
                <TableHead>{isRTL ? 'مميز' : 'Featured'}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id} className={selectedCourse?.id === course.id ? 'bg-muted/40' : ''}>
                  <TableCell className="font-medium">{isRTL ? course.title_ar : course.title_en}</TableCell>
                  <TableCell>{course.price || 0}</TableCell>
                  <TableCell>
                    <Badge variant={course.is_published ? 'default' : 'outline'}>
                      {course.is_published ? (isRTL ? 'منشور' : 'Yes') : (isRTL ? 'لا' : 'No')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={course.is_featured ? 'secondary' : 'outline'}>
                      {course.is_featured ? (isRTL ? 'نعم' : 'Yes') : (isRTL ? 'لا' : 'No')}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2"> 
                    <Button size="sm" variant="outline" onClick={() => { setSelectedCourse(course); loadLessons(course.id); }}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      {isRTL ? 'الدروس' : 'Lessons'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEditCourse(course)}>
                      <Edit2 className="w-4 h-4 mr-2" />{isRTL ? 'تعديل' : 'Edit'}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteCourse(course.id)}>
                      <Trash2 className="w-4 h-4 mr-2" />{isRTL ? 'حذف' : 'Delete'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {courses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {isRTL ? 'لا توجد دورات بعد' : 'No courses yet'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedCourse && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isRTL ? 'الدروس' : 'Lessons'}: {isRTL ? selectedCourse.title_ar : selectedCourse.title_en}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => openCreateLesson(selectedCourse.id)}>
                <Plus className="w-4 h-4 mr-2" />{isRTL ? 'درس جديد' : 'New Lesson'}
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>{isRTL ? 'العنوان' : 'Title'}</TableHead>
                  <TableHead>{isRTL ? 'المدة' : 'Duration'}</TableHead>
                  <TableHead>{isRTL ? 'مجاني' : 'Free'}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessons.map((lesson) => (
                  <TableRow key={lesson.id}>
                    <TableCell>{lesson.order_index}</TableCell>
                    <TableCell>{isRTL ? lesson.title_ar : lesson.title_en}</TableCell>
                    <TableCell>{lesson.duration_minutes || 0}</TableCell>
                    <TableCell>{lesson.is_free ? (isRTL ? 'نعم' : 'Yes') : (isRTL ? 'لا' : 'No')}</TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEditLesson(lesson)}>
                        <Edit2 className="w-4 h-4 mr-2" />{isRTL ? 'تعديل' : 'Edit'}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteLesson(lesson.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />{isRTL ? 'حذف' : 'Delete'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {lessons.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {isRTL ? 'لا توجد دروس بعد' : 'No lessons yet'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Course Dialog */}
      <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCourse ? (isRTL ? 'تعديل الدورة' : 'Edit Course') : (isRTL ? 'إنشاء دورة' : 'Create Course')}</DialogTitle>
            <DialogDescription>{isRTL ? 'أدخل تفاصيل الدورة' : 'Enter course details'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm block mb-1">{isRTL ? 'العنوان (EN)' : 'Title (EN)'}</label>
              <Input value={courseForm.title_en} onChange={(e) => setCourseForm({ ...courseForm, title_en: e.target.value })} />
            </div>
            <div>
              <label className="text-sm block mb-1">{isRTL ? 'العنوان (AR)' : 'Title (AR)'}</label>
              <Input value={courseForm.title_ar} onChange={(e) => setCourseForm({ ...courseForm, title_ar: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm block mb-1">{isRTL ? 'وصف مختصر (EN)' : 'Short Description (EN)'}</label>
              <Textarea value={courseForm.short_description_en} onChange={(e) => setCourseForm({ ...courseForm, short_description_en: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm block mb-1">{isRTL ? 'وصف مختصر (AR)' : 'Short Description (AR)'}</label>
              <Textarea value={courseForm.short_description_ar} onChange={(e) => setCourseForm({ ...courseForm, short_description_ar: e.target.value })} />
            </div>
            <div>
              <label className="text-sm block mb-1">{isRTL ? 'السعر' : 'Price (EGP)'}</label>
              <Input type="number" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm block mb-1">{isRTL ? 'المدة (ساعات)' : 'Duration (hours)'}</label>
              <Input type="number" value={courseForm.duration_hours} onChange={(e) => setCourseForm({ ...courseForm, duration_hours: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm block mb-1">{isRTL ? 'المستوى' : 'Level'}</label>
              <Select value={courseForm.difficulty_level} onValueChange={(v) => setCourseForm({ ...courseForm, difficulty_level: v as any })}>
                <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر المستوى' : 'Select level'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">{isRTL ? 'مبتدئ' : 'Beginner'}</SelectItem>
                  <SelectItem value="intermediate">{isRTL ? 'متوسط' : 'Intermediate'}</SelectItem>
                  <SelectItem value="advanced">{isRTL ? 'متقدم' : 'Advanced'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm block mb-1">{isRTL ? 'الفئة' : 'Category'}</label>
              <Select value={courseForm.category_id || 'none'} onValueChange={(v) => setCourseForm({ ...courseForm, category_id: v === 'none' ? null : v })}>
                <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر الفئة' : 'Select category'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{isRTL ? 'بدون' : 'None'}</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{isRTL ? c.name_ar : c.name_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm block mb-1">{isRTL ? 'صورة الغلاف (URL)' : 'Cover Image URL'}</label>
              <Input value={courseForm.cover_image_url || ''} onChange={(e) => setCourseForm({ ...courseForm, cover_image_url: e.target.value })} />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <label className="text-sm">
                <input type="checkbox" className="mr-2" checked={courseForm.is_published} onChange={(e) => setCourseForm({ ...courseForm, is_published: e.target.checked })} />
                {isRTL ? 'منشور' : 'Published'}
              </label>
              <label className="text-sm">
                <input type="checkbox" className="mr-2" checked={courseForm.is_featured} onChange={(e) => setCourseForm({ ...courseForm, is_featured: e.target.checked })} />
                {isRTL ? 'مميز' : 'Featured'}
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setCourseDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />{isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={saveCourse} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />{isRTL ? 'حفظ' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{lessonForm?.id ? (isRTL ? 'تعديل الدرس' : 'Edit Lesson') : (isRTL ? 'إنشاء درس' : 'Create Lesson')}</DialogTitle>
            <DialogDescription>{isRTL ? 'أدخل تفاصيل الدرس' : 'Enter lesson details'}</DialogDescription>
          </DialogHeader>
          {lessonForm && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm block mb-1">#</label>
                <Input type="number" value={lessonForm.order_index} onChange={(e) => setLessonForm({ ...lessonForm, order_index: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm block mb-1">{isRTL ? 'المدة (د)' : 'Duration (min)'}</label>
                <Input type="number" value={lessonForm.duration_minutes || 0} onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm block mb-1">{isRTL ? 'العنوان (EN)' : 'Title (EN)'}</label>
                <Input value={lessonForm.title_en} onChange={(e) => setLessonForm({ ...lessonForm, title_en: e.target.value })} />
              </div>
              <div>
                <label className="text-sm block mb-1">{isRTL ? 'العنوان (AR)' : 'Title (AR)'}</label>
                <Input value={lessonForm.title_ar} onChange={(e) => setLessonForm({ ...lessonForm, title_ar: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm block mb-1">{isRTL ? 'الوصف (EN)' : 'Description (EN)'}</label>
                <Textarea value={lessonForm.description_en || ''} onChange={(e) => setLessonForm({ ...lessonForm, description_en: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm block mb-1">{isRTL ? 'الوصف (AR)' : 'Description (AR)'}</label>
                <Textarea value={lessonForm.description_ar || ''} onChange={(e) => setLessonForm({ ...lessonForm, description_ar: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm">
                  <input type="checkbox" className="mr-2" checked={lessonForm.is_free} onChange={(e) => setLessonForm({ ...lessonForm, is_free: e.target.checked })} />
                  {isRTL ? 'مجاني' : 'Free'}
                </label>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />{isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={saveLesson} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />{isRTL ? 'حفظ' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherCourseManager;


