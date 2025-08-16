import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send,
  MessageSquare,
  Users,
  Calendar,
  CheckCircle
} from 'lucide-react';

const Contact = () => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: isRTL ? 'تم إرسال الرسالة بنجاح' : 'Message sent successfully',
        description: isRTL 
          ? 'سنقوم بالرد عليك في أقرب وقت ممكن'
          : 'We will get back to you as soon as possible',
      });
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      
      setIsSubmitting(false);
    }, 2000);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: isRTL ? 'البريد الإلكتروني' : 'Email',
      value: 'info@eduplatform.com',
      description: isRTL ? 'راسلنا في أي وقت' : 'Email us anytime'
    },
    {
      icon: Phone,
      title: isRTL ? 'الهاتف' : 'Phone',
      value: '+966 11 234 5678',
      description: isRTL ? 'اتصل بنا للدعم الفوري' : 'Call us for immediate support'
    },
    {
      icon: MapPin,
      title: isRTL ? 'العنوان' : 'Address',
      value: isRTL ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia',
      description: isRTL ? 'مقرنا الرئيسي' : 'Our main headquarters'
    },
    {
      icon: Clock,
      title: isRTL ? 'ساعات العمل' : 'Working Hours',
      value: isRTL ? 'الأحد - الخميس: 9 ص - 6 م' : 'Sun - Thu: 9 AM - 6 PM',
      description: isRTL ? 'نحن هنا لمساعدتك' : 'We are here to help you'
    }
  ];

  const faqs = [
    {
      question: isRTL ? 'كيف يمكنني التسجيل في دورة؟' : 'How can I enroll in a course?',
      answer: isRTL 
        ? 'يمكنك التسجيل في أي دورة بالنقر على زر "التسجيل" في صفحة الدورة ومتابعة خطوات الدفع.'
        : 'You can enroll in any course by clicking the "Enroll" button on the course page and following the payment steps.'
    },
    {
      question: isRTL ? 'هل يمكنني الحصول على شهادة؟' : 'Can I get a certificate?',
      answer: isRTL 
        ? 'نعم، ستحصل على شهادة معتمدة عند إكمال الدورة بنجاح.'
        : 'Yes, you will receive an accredited certificate upon successful completion of the course.'
    },
    {
      question: isRTL ? 'كم تبلغ مدة الوصول للدورة؟' : 'How long do I have access to the course?',
      answer: isRTL 
        ? 'ستحصل على وصول مدى الحياة لجميع الدورات التي تشتريها.'
        : 'You will have lifetime access to all courses you purchase.'
    },
    {
      question: isRTL ? 'هل يمكنني استرداد المبلغ؟' : 'Can I get a refund?',
      answer: isRTL 
        ? 'نعم، نوفر ضمان استرداد المبلغ خلال 30 يوماً من تاريخ الشراء.'
        : 'Yes, we offer a 30-day money-back guarantee from the date of purchase.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-8">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 text-center">
            <div className="space-y-4 mb-16">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                {t('contact')}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {isRTL 
                  ? 'نحن هنا لمساعدتك! تواصل معنا لأي استفسار أو دعم تحتاجه'
                  : 'We are here to help you! Contact us for any questions or support you need'
                }
              </p>
            </div>

            {/* Contact Info Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((info, index) => (
                <Card key={index} className="group hover:shadow-medium transition-all duration-300">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <info.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">{info.title}</h3>
                      <p className="text-primary font-medium">{info.value}</p>
                      <p className="text-sm text-muted-foreground">{info.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              {/* Contact Form */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">
                    {isRTL ? 'أرسل لنا رسالة' : 'Send us a Message'}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    {isRTL 
                      ? 'املأ النموذج أدناه وسنقوم بالرد عليك في أقرب وقت ممكن'
                      : 'Fill out the form below and we will get back to you as soon as possible'
                    }
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <span>{isRTL ? 'نموذج الاتصال' : 'Contact Form'}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            {isRTL ? 'الاسم' : 'Name'} *
                          </label>
                          <Input
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder={isRTL ? 'أدخل اسمك' : 'Enter your name'}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            {isRTL ? 'البريد الإلكتروني' : 'Email'} *
                          </label>
                          <Input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder={isRTL ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            {isRTL ? 'رقم الهاتف' : 'Phone'}
                          </label>
                          <Input
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder={isRTL ? 'أدخل رقم هاتفك' : 'Enter your phone number'}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            {isRTL ? 'الموضوع' : 'Subject'} *
                          </label>
                          <Input
                            name="subject"
                            value={formData.subject}
                            onChange={handleInputChange}
                            placeholder={isRTL ? 'موضوع الرسالة' : 'Message subject'}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          {isRTL ? 'الرسالة' : 'Message'} *
                        </label>
                        <Textarea
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          placeholder={isRTL ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                          rows={6}
                          required
                        />
                      </div>

                      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                            {isRTL ? 'جاري الإرسال...' : 'Sending...'}
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            {isRTL ? 'إرسال الرسالة' : 'Send Message'}
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* FAQ Section */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">
                    {isRTL ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    {isRTL 
                      ? 'إجابات على الأسئلة الأكثر شيوعاً'
                      : 'Answers to the most common questions'
                    }
                  </p>
                </div>

                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <Card key={index} className="group hover:shadow-medium transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center mt-1">
                              <CheckCircle className="w-4 h-4 text-success" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground flex-1">
                              {faq.question}
                            </h3>
                          </div>
                          <p className="text-muted-foreground leading-relaxed pl-9">
                            {faq.answer}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Contact Stats */}
                <div className="grid grid-cols-2 gap-4 pt-8">
                  <Card className="group hover:shadow-medium transition-all duration-300">
                    <CardContent className="p-6 text-center space-y-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-2xl font-bold text-foreground">10,000+</div>
                      <div className="text-sm text-muted-foreground">
                        {isRTL ? 'طالب راضٍ' : 'Happy Students'}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="group hover:shadow-medium transition-all duration-300">
                    <CardContent className="p-6 text-center space-y-3">
                      <div className="w-12 h-12 bg-secondary/10 rounded-lg mx-auto flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                        <Calendar className="w-6 h-6 text-secondary" />
                      </div>
                      <div className="text-2xl font-bold text-foreground">24/7</div>
                      <div className="text-sm text-muted-foreground">
                        {isRTL ? 'دعم فني' : 'Support'}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;