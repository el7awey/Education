import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  BookOpen, 
  Tag, 
  GraduationCap, 
  MessageSquare, 
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import AdminUsers from './admin/AdminUsers';
import AdminCourses from './admin/AdminCourses';
import AdminCategories from './admin/AdminCategories';
import AdminEnrollments from './admin/AdminEnrollments';
import AdminTestimonials from './admin/AdminTestimonials';
import AdminStats from './admin/AdminStats';

type AdminSection = 'stats' | 'users' | 'courses' | 'categories' | 'enrollments' | 'testimonials';

const AdminDashboard = () => {
  const { t, isRTL } = useLanguage();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<AdminSection>('stats');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems = [
    { id: 'stats', label: isRTL ? 'الإحصائيات' : 'Dashboard', icon: BarChart3 },
    { id: 'users', label: isRTL ? 'إدارة المستخدمين' : 'Manage Users', icon: Users },
    { id: 'courses', label: isRTL ? 'إدارة الدورات' : 'Manage Courses', icon: BookOpen },
    { id: 'categories', label: isRTL ? 'إدارة الفئات' : 'Manage Categories', icon: Tag },
    { id: 'enrollments', label: isRTL ? 'إدارة التسجيلات' : 'Manage Enrollments', icon: GraduationCap },
    { id: 'testimonials', label: isRTL ? 'إدارة التقييمات' : 'Manage Testimonials', icon: MessageSquare },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'stats':
        return <AdminStats />;
      case 'users':
        return <AdminUsers />;
      case 'courses':
        return <AdminCourses />;
      case 'categories':
        return <AdminCategories />;
      case 'enrollments':
        return <AdminEnrollments />;
      case 'testimonials':
        return <AdminTestimonials />;
      default:
        return <AdminStats />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-background/80 backdrop-blur-sm"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-primary">
              {isRTL ? 'لوحة الإدارة' : 'Admin Panel'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {profile?.full_name || profile?.email}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => {
                    setActiveSection(item.id as AdminSection);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/')}
            >
              <BookOpen className="w-4 h-4 mr-3" />
              {isRTL ? 'العودة للموقع' : 'Back to Site'}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-3" />
              {isRTL ? 'تسجيل الخروج' : 'Sign Out'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between p-4">
            <div>
              <h2 className="text-xl font-semibold">
                {menuItems.find(item => item.id === activeSection)?.label}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                {isRTL ? 'العودة للموقع' : 'Back to Site'}
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
