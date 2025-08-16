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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Shield,
  User,
  Mail,
  Calendar,
  Loader2
} from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

const AdminUsers = () => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleUpdateUser = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: isRTL ? 'تم التحديث' : 'Updated',
        description: isRTL ? 'تم تحديث المستخدم بنجاح' : 'User updated successfully'
      });

      setEditDialogOpen(false);
      await fetchUsers();
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

  const handleDeleteUser = async (userId: string) => {
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: isRTL ? 'تم الحذف' : 'Deleted',
        description: isRTL ? 'تم حذف المستخدم بنجاح' : 'User deleted successfully'
      });

      setDeleteDialogOpen(false);
      await fetchUsers();
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

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'teacher':
        return 'secondary';
      case 'user':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return isRTL ? 'مدير' : 'Admin';
      case 'teacher':
        return isRTL ? 'مدرس' : 'Teacher';
      case 'user':
        return isRTL ? 'مستخدم' : 'User';
      default:
        return role;
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
          <h1 className="text-2xl font-bold">
            {isRTL ? 'إدارة المستخدمين' : 'Manage Users'}
          </h1>
          <p className="text-muted-foreground">
            {isRTL 
              ? 'إدارة حسابات المستخدمين وأدوارهم'
              : 'Manage user accounts and their roles'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {filteredUsers.length} {isRTL ? 'مستخدم' : 'users'}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={isRTL ? 'البحث في المستخدمين...' : 'Search users...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder={isRTL ? 'جميع الأدوار' : 'All Roles'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {isRTL ? 'جميع الأدوار' : 'All Roles'}
                </SelectItem>
                <SelectItem value="admin">
                  {isRTL ? 'مدير' : 'Admin'}
                </SelectItem>
                <SelectItem value="teacher">
                  {isRTL ? 'مدرس' : 'Teacher'}
                </SelectItem>
                <SelectItem value="user">
                  {isRTL ? 'مستخدم' : 'User'}
                </SelectItem>
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

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isRTL ? 'قائمة المستخدمين' : 'Users List'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRTL ? 'المستخدم' : 'User'}</TableHead>
                <TableHead>{isRTL ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                <TableHead>{isRTL ? 'الدور' : 'Role'}</TableHead>
                <TableHead>{isRTL ? 'تاريخ الإنشاء' : 'Created'}</TableHead>
                <TableHead>{isRTL ? 'آخر تحديث' : 'Last Updated'}</TableHead>
                <TableHead className="text-right">
                  {isRTL ? 'الإجراءات' : 'Actions'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback>
                          {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.full_name || (isRTL ? 'بدون اسم' : 'No Name')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ID: {user.user_id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {new Date(user.updated_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedUser(user);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm || roleFilter !== 'all' 
                        ? (isRTL ? 'لا توجد نتائج للبحث' : 'No search results')
                        : (isRTL ? 'لا توجد مستخدمين' : 'No users found')
                      }
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isRTL ? 'تعديل المستخدم' : 'Edit User'}
            </DialogTitle>
            <DialogDescription>
              {isRTL 
                ? 'تعديل معلومات المستخدم ودوره'
                : 'Modify user information and role'
              }
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  {isRTL ? 'الاسم الكامل' : 'Full Name'}
                </label>
                <Input
                  value={selectedUser.full_name || ''}
                  onChange={(e) => setSelectedUser({
                    ...selectedUser,
                    full_name: e.target.value
                  })}
                  placeholder={isRTL ? 'أدخل الاسم الكامل' : 'Enter full name'}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  {isRTL ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <Input
                  value={selectedUser.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {isRTL ? 'لا يمكن تعديل البريد الإلكتروني' : 'Email cannot be modified'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">
                  {isRTL ? 'الدور' : 'Role'}
                </label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) => setSelectedUser({
                    ...selectedUser,
                    role: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {isRTL ? 'مستخدم' : 'User'}
                      </div>
                    </SelectItem>
                    <SelectItem value="teacher">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        {isRTL ? 'مدرس' : 'Teacher'}
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        {isRTL ? 'مدير' : 'Admin'}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">
                  {isRTL ? 'نبذة' : 'Bio'}
                </label>
                <Input
                  value={selectedUser.bio || ''}
                  onChange={(e) => setSelectedUser({
                    ...selectedUser,
                    bio: e.target.value
                  })}
                  placeholder={isRTL ? 'أدخل نبذة' : 'Enter bio'}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  onClick={() => handleUpdateUser(selectedUser.id, {
                    full_name: selectedUser.full_name,
                    role: selectedUser.role,
                    bio: selectedUser.bio
                  })}
                  disabled={updating}
                >
                  {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isRTL ? 'حفظ التغييرات' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isRTL ? 'تأكيد الحذف' : 'Confirm Deletion'}
            </DialogTitle>
            <DialogDescription>
              {isRTL 
                ? 'هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this user? This action cannot be undone.'
              }
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedUser.full_name || 'No Name'}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                <Badge variant={getRoleBadgeVariant(selectedUser.role)} className="mt-2">
                  {getRoleLabel(selectedUser.role)}
                </Badge>
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
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  disabled={updating}
                >
                  {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isRTL ? 'حذف المستخدم' : 'Delete User'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
