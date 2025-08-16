import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  ar: {
    // Navigation
    home: 'الرئيسية',
    courses: 'الدورات',
    teacher: 'المعلم',
    about: 'عن المنصة',
    contact: 'اتصل بنا',
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    logout: 'تسجيل الخروج',
    
    // Hero Section
    welcome: 'مرحباً بكم في منصة التعليم الإلكتروني',
    heroSubtitle: 'اكتشف عالماً من المعرفة مع أفضل الدورات التعليمية',
    joinNow: 'انضم الآن',
    learnMore: 'اعرف المزيد',
    
    // Courses
    featuredCourses: 'الدورات المميزة',
    allCourses: 'جميع الدورات',
    courseDetails: 'تفاصيل الدورة',
    enroll: 'التسجيل',
    price: 'السعر',
    lessons: 'دروس',
    duration: 'المدة',
    level: 'المستوى',
    category: 'الفئة',
    
    // Teacher
    aboutTeacher: 'عن المعلم',
    qualifications: 'المؤهلات',
    experience: 'الخبرة',
    teachingStyle: 'أسلوب التدريس',
    downloadCV: 'تحميل السيرة الذاتية',
    
    // Dashboard
    dashboard: 'لوحة التحكم',
    addCourse: 'إضافة دورة',
    manageCourses: 'إدارة الدورات',
    students: 'الطلاب',
    analytics: 'الإحصائيات',
    settings: 'الإعدادات',
    
    // Common
    search: 'البحث',
    filter: 'تصفية',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    view: 'عرض',
    loading: 'جاري التحميل...',
    error: 'حدث خطأ',
    success: 'تم بنجاح',
  },
  en: {
    // Navigation
    home: 'Home',
    courses: 'Courses',
    teacher: 'Teacher',
    about: 'About',
    contact: 'Contact',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    
    // Hero Section
    welcome: 'Welcome to EduPlatform',
    heroSubtitle: 'Discover a world of knowledge with our best educational courses',
    joinNow: 'Join Now',
    learnMore: 'Learn More',
    
    // Courses
    featuredCourses: 'Featured Courses',
    allCourses: 'All Courses',
    courseDetails: 'Course Details',
    enroll: 'Enroll',
    price: 'Price',
    lessons: 'Lessons',
    duration: 'Duration',
    level: 'Level',
    category: 'Category',
    
    // Teacher
    aboutTeacher: 'About Teacher',
    qualifications: 'Qualifications',
    experience: 'Experience',
    teachingStyle: 'Teaching Style',
    downloadCV: 'Download CV',
    
    // Dashboard
    dashboard: 'Dashboard',
    addCourse: 'Add Course',
    manageCourses: 'Manage Courses',
    students: 'Students',
    analytics: 'Analytics',
    settings: 'Settings',
    
    // Common
    search: 'Search',
    filter: 'Filter',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    loading: 'Loading...',
    error: 'Error occurred',
    success: 'Success',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ar');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'ar' || savedLang === 'en')) {
      setLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Update body class for font family
    if (language === 'ar') {
      document.body.classList.add('font-arabic');
      document.body.classList.remove('font-english');
    } else {
      document.body.classList.add('font-english');
      document.body.classList.remove('font-arabic');
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['ar']] || key;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};