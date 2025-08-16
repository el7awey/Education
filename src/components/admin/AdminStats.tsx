import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  MessageSquare, 
  TrendingUp,
  DollarSign,
  Star,
  Activity
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalTestimonials: number;
  publishedCourses: number;
  totalRevenue: number;
  averageRating: number;
  activeUsers: number;
}

const AdminStats = () => {
  const { t, isRTL } = useLanguage();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalTestimonials: 0,
    publishedCourses: 0,
    totalRevenue: 0,
    averageRating: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          { count: usersCount },
          { count: coursesCount },
          { count: enrollmentsCount },
          { count: testimonialsCount },
          { count: publishedCoursesCount },
          { data: payments },
          { data: ratings },
          { count: activeUsersCount }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('courses').select('*', { count: 'exact', head: true }),
          supabase.from('enrollments').select('*', { count: 'exact', head: true }),
          supabase.from('testimonials').select('*', { count: 'exact', head: true }),
          supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
          supabase.from('payments').select('amount, status').eq('status', 'completed'),
          supabase.from('testimonials').select('rating').eq('is_approved', true),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        ]);

        const totalRevenue = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
        const averageRating = ratings && ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
          : 0;

        setStats({
          totalUsers: usersCount || 0,
          totalCourses: coursesCount || 0,
          totalEnrollments: enrollmentsCount || 0,
          totalTestimonials: testimonialsCount || 0,
          publishedCourses: publishedCoursesCount || 0,
          totalRevenue,
          averageRating,
          activeUsers: activeUsersCount || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: isRTL ? 'إجمالي المستخدمين' : 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: isRTL ? 'إجمالي الدورات' : 'Total Courses',
      value: stats.totalCourses.toLocaleString(),
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: isRTL ? 'إجمالي التسجيلات' : 'Total Enrollments',
      value: stats.totalEnrollments.toLocaleString(),
      icon: GraduationCap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: isRTL ? 'إجمالي التقييمات' : 'Total Testimonials',
      value: stats.totalTestimonials.toLocaleString(),
      icon: MessageSquare,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '+5%',
      changeType: 'positive'
    }
  ];

  const metricCards = [
    {
      title: isRTL ? 'الدورات المنشورة' : 'Published Courses',
      value: stats.publishedCourses,
      icon: BookOpen,
      color: 'text-green-600'
    },
    {
      title: isRTL ? 'إجمالي الإيرادات' : 'Total Revenue',
      value: `EGP ${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: isRTL ? 'متوسط التقييم' : 'Average Rating',
      value: stats.averageRating.toFixed(1),
      icon: Star,
      color: 'text-yellow-600'
    },
    {
      title: isRTL ? 'المستخدمين النشطين' : 'Active Users',
      value: stats.activeUsers,
      icon: Activity,
      color: 'text-blue-600'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-8 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">
          {isRTL ? 'مرحباً بك في لوحة الإدارة' : 'Welcome to Admin Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          {isRTL 
            ? 'نظرة عامة على إحصائيات المنصة وأدائها'
            : 'Overview of platform statistics and performance'
          }
        </p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <Badge 
                        variant={stat.changeType === 'positive' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {stat.change}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-2">
                        {isRTL ? 'من الشهر الماضي' : 'from last month'}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {isRTL ? 'إجراءات سريعة' : 'Quick Actions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium mb-1">
                {isRTL ? 'إضافة دورة جديدة' : 'Add New Course'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRTL ? 'إنشاء دورة تعليمية جديدة' : 'Create a new educational course'}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium mb-1">
                {isRTL ? 'إدارة المستخدمين' : 'Manage Users'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRTL ? 'عرض وتعديل حسابات المستخدمين' : 'View and modify user accounts'}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium mb-1">
                {isRTL ? 'مراجعة التقييمات' : 'Review Testimonials'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRTL ? 'الموافقة على التقييمات الجديدة' : 'Approve new testimonials'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStats;
