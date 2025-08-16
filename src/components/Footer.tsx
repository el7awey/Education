import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  BookOpen, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  const { t, isRTL } = useLanguage();

  const quickLinks = [
    { key: 'home', href: '/' },
    { key: 'courses', href: '/courses' },
    { key: 'teacher', href: '/teacher' },
    { key: 'about', href: '/about' },
    { key: 'contact', href: '/contact' },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', color: 'hover:text-blue-600' },
    { icon: Twitter, href: '#', color: 'hover:text-blue-400' },
    { icon: Instagram, href: '#', color: 'hover:text-pink-500' },
    { icon: Youtube, href: '#', color: 'hover:text-red-500' },
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                {isRTL ? 'منصة التعليم' : 'EduPlatform'}
              </h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {isRTL 
                ? 'منصة تعليمية شاملة تهدف إلى توفير أفضل تجربة تعليمية للطلاب في جميع أنحاء العالم'
                : 'A comprehensive educational platform designed to provide the best learning experience for students worldwide'
              }
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">
              {isRTL ? 'روابط سريعة' : 'Quick Links'}
            </h4>
            <nav className="flex flex-col space-y-2">
              {quickLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  {t(link.key)}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">
              {isRTL ? 'تواصل معنا' : 'Contact Us'}
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-muted-foreground text-sm">
                <Mail className="w-4 h-4 text-primary" />
                <span>info@eduplatform.com</span>
              </div>
              <div className="flex items-center space-x-3 text-muted-foreground text-sm">
                <Phone className="w-4 h-4 text-primary" />
                <span>+1 234 567 8900</span>
              </div>
              <div className="flex items-center space-x-3 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span>
                  {isRTL ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}
                </span>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">
              {isRTL ? 'تابعنا' : 'Follow Us'}
            </h4>
            <div className="flex space-x-3">
              {socialLinks.map((social, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="icon"
                  className={`w-9 h-9 ${social.color} transition-colors`}
                  asChild
                >
                  <a href={social.href} target="_blank" rel="noopener noreferrer">
                    <social.icon className="w-4 h-4" />
                  </a>
                </Button>
              ))}
            </div>
            <p className="text-muted-foreground text-sm">
              {isRTL 
                ? 'ابق على اطلاع بآخر الأخبار والتحديثات'
                : 'Stay updated with our latest news and updates'
              }
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-muted-foreground text-sm flex items-center">
              {isRTL ? 'جُعل بـ' : 'Made with'}
              <Heart className="w-4 h-4 mx-1 text-red-500 fill-current" />
              {isRTL ? 'في المملكة العربية السعودية' : 'in Saudi Arabia'}
            </p>
            <p className="text-muted-foreground text-sm">
              © 2024 EduPlatform. {isRTL ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;