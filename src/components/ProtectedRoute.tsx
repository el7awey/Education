import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'teacher' | 'user';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = 'user' 
}) => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const { isRTL } = useLanguage();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isRTL ? 'جاري التحقق من الصلاحيات...' : 'Checking permissions...'}
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user || !profile) {
    toast({
      title: isRTL ? 'غير مصرح' : 'Unauthorized',
      description: isRTL 
        ? 'يجب تسجيل الدخول للوصول إلى هذه الصفحة'
        : 'You must be logged in to access this page',
      variant: 'destructive'
    });
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole === 'admin' && profile.role !== 'admin') {
    toast({
      title: isRTL ? 'غير مصرح' : 'Access Denied',
      description: isRTL 
        ? 'يجب أن تكون مدير للوصول إلى هذه الصفحة'
        : 'You must be an admin to access this page',
      variant: 'destructive'
    });
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'teacher' && !['admin', 'teacher'].includes(profile.role)) {
    toast({
      title: isRTL ? 'غير مصرح' : 'Access Denied',
      description: isRTL 
        ? 'يجب أن تكون مدرس أو مدير للوصول إلى هذه الصفحة'
        : 'You must be a teacher or admin to access this page',
      variant: 'destructive'
    });
    return <Navigate to="/" replace />;
  }

  // User has required permissions
  return <>{children}</>;
};

export default ProtectedRoute;
