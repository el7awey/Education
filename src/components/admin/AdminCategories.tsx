import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Tag,
  Calendar,
  BookOpen,
  Loader2,
  X
} from 'lucide-react';

interface Category {
  id: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  created_at: string;
  updated_at: string;
  courses_count?: number;
}

const AdminCategories = () => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          courses_count:courses(count)
        `)
        .order('name_en');

      if (error) throw error;

      // Transform the data to get the count
      const transformedData = data?.map(cat => ({
        ...cat,
        courses_count: cat.courses_count?.[0]?.count || 0
      })) || [];

      setCategories(transformedData);
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

  const filteredCategories = categories.filter(category =>
    (category.name_en || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.name_ar || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCategory = async () => {
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('categories')
        .insert([categoryForm]);

      if (error) throw error;

      toast({
        title: isRTL ? 'تم الإنشاء' : 'Created',
        description: isRTL ? 'تم إنشاء الفئة بنجاح' : 'Category created successfully'
      });

      setCategoryDialogOpen(false);
      resetForm();
      await fetchCategories();
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

  const handleUpdateCategory = async () => {
    if (!selectedCategory) return;
    
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('categories')
        .update(categoryForm)
        .eq('id', selectedCategory.id);

      if (error) throw error;

      toast({
        title: isRTL ? 'تم التحديث' : 'Updated',
        description: isRTL ? 'تم تحديث الفئة بنجاح' : 'Category updated successfully'
      });

      setCategoryDialogOpen(false);
      resetForm();
      await fetchCategories();
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

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', selectedCategory.id);

      if (error) throw error;

      toast({
        title: isRTL ? 'تم الحذف' : 'Deleted',
        description: isRTL ? 'تم حذف الفئة بنجاح' : 'Category deleted successfully'
      });

      setDeleteDialogOpen(false);
      await fetchCategories();
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
    setCategoryForm({
      name_en: '',
      name_ar: '',
      description_en: '',
      description_ar: ''
    });
    setSelectedCategory(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setCategoryDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setCategoryForm({
      name_en: category.name_en || '',
      name_ar: category.name_ar || '',
      description_en: category.description_en || '',
      description_ar: category.description_ar || ''
    });
    setCategoryDialogOpen(true);
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
            {isRTL ? 'إدارة الفئات' : 'Manage Categories'}
          </h1>
          <p className="text-muted-foreground">
            {isRTL 
              ? 'إدارة فئات الدورات التعليمية'
              : 'Manage course categories'
            }
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          {isRTL ? 'إضافة فئة' : 'Add Category'}
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={isRTL ? 'البحث في الفئات...' : 'Search categories...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isRTL ? 'قائمة الفئات' : 'Categories List'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRTL ? 'الفئة' : 'Category'}</TableHead>
                <TableHead>{isRTL ? 'الوصف' : 'Description'}</TableHead>
                <TableHead>{isRTL ? 'عدد الدورات' : 'Courses Count'}</TableHead>
                <TableHead>{isRTL ? 'تاريخ الإنشاء' : 'Created'}</TableHead>
                <TableHead>{isRTL ? 'آخر تحديث' : 'Last Updated'}</TableHead>
                <TableHead className="text-right">
                  {isRTL ? 'الإجراءات' : 'Actions'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Tag className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {isRTL ? category.name_ar : category.name_en}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {isRTL ? category.name_en : category.name_ar}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {isRTL 
                        ? (category.description_ar || (isRTL ? 'لا يوجد وصف' : 'No description'))
                        : (category.description_en || 'No description')
                      }
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                      <Badge variant="outline">
                        {category.courses_count || 0} {isRTL ? 'دورة' : 'courses'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(category.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(category.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(category)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedCategory(category);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={category.courses_count > 0}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCategories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm 
                        ? (isRTL ? 'لا توجد نتائج للبحث' : 'No search results')
                        : (isRTL ? 'لا توجد فئات' : 'No categories found')
                      }
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCategory 
                ? (isRTL ? 'تعديل الفئة' : 'Edit Category')
                : (isRTL ? 'إنشاء فئة جديدة' : 'Create New Category')
              }
            </DialogTitle>
            <DialogDescription>
              {isRTL 
                ? 'أدخل تفاصيل الفئة'
                : 'Enter category details'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {isRTL ? 'اسم الفئة (EN)' : 'Category Name (EN)'}
              </label>
              <Input
                value={categoryForm.name_en || ''}
                onChange={(e) => setCategoryForm({ ...categoryForm, name_en: e.target.value })}
                placeholder={isRTL ? 'أدخل اسم الفئة بالإنجليزية' : 'Enter category name in English'}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {isRTL ? 'اسم الفئة (AR)' : 'Category Name (AR)'}
              </label>
              <Input
                value={categoryForm.name_ar || ''}
                onChange={(e) => setCategoryForm({ ...categoryForm, name_ar: e.target.value })}
                placeholder={isRTL ? 'أدخل اسم الفئة بالعربية' : 'Enter category name in Arabic'}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {isRTL ? 'الوصف (EN)' : 'Description (EN)'}
              </label>
              <Input
                value={categoryForm.description_en || ''}
                onChange={(e) => setCategoryForm({ ...categoryForm, description_en: e.target.value })}
                placeholder={isRTL ? 'أدخل الوصف بالإنجليزية (اختياري)' : 'Enter description in English (optional)'}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {isRTL ? 'الوصف (AR)' : 'Description (AR)'}
              </label>
              <Input
                value={categoryForm.description_ar || ''}
                onChange={(e) => setCategoryForm({ ...categoryForm, description_ar: e.target.value })}
                placeholder={isRTL ? 'أدخل الوصف بالعربية (اختياري)' : 'Enter description in Arabic (optional)'}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setCategoryDialogOpen(false)}
            >
              <X className="w-4 h-4 mr-2" />
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={selectedCategory ? handleUpdateCategory : handleCreateCategory}
              disabled={updating || !categoryForm.name_en || !categoryForm.name_ar}
            >
              {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedCategory 
                ? (isRTL ? 'حفظ التغييرات' : 'Save Changes')
                : (isRTL ? 'إنشاء الفئة' : 'Create Category')
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
                ? 'هل أنت متأكد من حذف هذه الفئة؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this category? This action cannot be undone.'
              }
            </DialogDescription>
          </DialogHeader>
          {selectedCategory && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">
                  {isRTL ? selectedCategory.name_ar : selectedCategory.name_en}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? selectedCategory.name_en : selectedCategory.name_ar}
                </p>
                {selectedCategory.courses_count > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      {isRTL 
                        ? `تحذير: هذه الفئة تحتوي على ${selectedCategory.courses_count} دورة. لا يمكن حذفها.`
                        : `Warning: This category contains ${selectedCategory.courses_count} courses. It cannot be deleted.`
                      }
                    </p>
                  </div>
                )}
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
                  onClick={handleDeleteCategory}
                  disabled={updating || selectedCategory.courses_count > 0}
                >
                  {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isRTL ? 'حذف الفئة' : 'Delete Category'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategories;
