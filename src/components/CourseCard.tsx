import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { Button } from './ui/button.tsx';
import { Badge } from './ui/badge.tsx';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card.tsx';
import { 
  Clock, 
  Users, 
  BookOpen, 
  Star,
  Play,
  ChevronRight
} from 'lucide-react';

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  instructor: string;
  price: number;
  duration: string;
  lessons: number;
  students: number;
  rating: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  image?: string;
  featured?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({
  id,
  title,
  description,
  instructor,
  price,
  duration,
  lessons,
  students,
  rating,
  level,
  category,
  image,
  featured = false
}) => {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  const levelColors = {
    beginner: 'bg-success/10 text-success',
    intermediate: 'bg-warning/10 text-warning',
    advanced: 'bg-destructive/10 text-destructive'
  };

  const levelLabels = {
    beginner: isRTL ? 'مبتدئ' : 'Beginner',
    intermediate: isRTL ? 'متوسط' : 'Intermediate',
    advanced: isRTL ? 'متقدم' : 'Advanced'
  };
  const formatPrice = (price: number) => {
    if (price === 0) return isRTL ? 'مجاني' : 'Free';
    return isRTL ? `${price} ج.م` : `${price} EGP`;
  };
  return (
    <Card className={`group hover:shadow-strong transition-all duration-300 hover:-translate-y-1 ${featured ? 'ring-2 ring-primary/20' : ''}`}>
      {/* Course Image */}
      <CardHeader className="p-0">
        <div className="relative overflow-hidden rounded-t-lg aspect-video bg-gradient-primary">
          {image ? (
            <img 
              src={image} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-primary">
              <BookOpen className="w-12 h-12 text-primary-foreground" />
            </div>
          )}
          
          {/* Featured Badge */}
          {featured && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-secondary text-secondary-foreground">
                {isRTL ? 'مميز' : 'Featured'}
              </Badge>
            </div>
          )}
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <div className="w-12 h-12 bg-background/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
              <Play className="w-5 h-5 text-primary ml-1" />
            </div>
          </div>
          
          {/* Price */}
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-background/90 text-foreground backdrop-blur-sm">
            {formatPrice(price)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Category & Level */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {category}
          </Badge>
          <Badge className={levelColors[level]}>
            {levelLabels[level]}
          </Badge>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Instructor */}
        <div className="text-sm text-muted-foreground">
          {isRTL ? 'المدرب: ' : 'Instructor: '} 
          <span className="text-foreground font-medium">{instructor}</span>
        </div>

        {/* Course Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <BookOpen className="w-4 h-4" />
            <span>{lessons} {t('lessons')}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>({students?.toLocaleString?.() ?? 0} {t('students')})</span>
            <Badge variant="secondary" className="bg-background/90 text-foreground backdrop-blur-sm">
            
            </Badge>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(rating) 
                    ? 'text-secondary fill-current' 
                    : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-foreground">{rating}</span>
          <span className="text-sm text-muted-foreground">
            ({students?.toLocaleString?.() ?? 0} {t('students')})
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 space-y-3">
        <Button className="w-full group" size="lg" onClick={() => navigate(`/courses/${id}`)}>
          {t('enroll')}
          <ChevronRight className={`w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
        </Button>
        
        <Button variant="outline" className="w-full" size="sm" onClick={() => navigate(`/courses/${id}`)}>
          {t('learnMore')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;