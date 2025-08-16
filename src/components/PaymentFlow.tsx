import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Button } from '../components/ui/button.tsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card.tsx';
import { Badge } from '../components/ui/badge.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs.tsx';
import { Alert, AlertDescription } from '../components/ui/alert.tsx';
import { useToast } from '../hooks/use-toast.ts';
import { supabase } from '../integrations/supabase/client.ts';
import { 
  CreditCard, 
  Smartphone,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  DollarSign
} from 'lucide-react';

interface PaymentFlowProps {
  courseId: string;
  courseTitle: string;
  coursePrice: number;
  onPaymentSuccess: () => void;
  onPaymentCancel: () => void;
}

interface Course {
  id: string;
  title_en: string;
  title_ar: string;
  price: number;
  currency: string;
}

const PaymentFlow: React.FC<PaymentFlowProps> = ({
  courseId,
  courseTitle,
  coursePrice,
  onPaymentSuccess,
  onPaymentCancel
}) => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'fawry'>('card');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const paymentMethods = [
    {
      id: 'card',
      name: isRTL ? 'البطاقات البنكية' : 'Bank Cards',
      description: isRTL ? 'فيزا، ماستركارد، ميزة' : 'Visa, MasterCard, Meeza',
      icon: CreditCard,
      fees: isRTL ? 'رسوم 2.9%' : '2.9% fees'
    },
    {
      id: 'fawry',
      name: isRTL ? 'فوري' : 'Fawry',
      description: isRTL ? 'ادفع من أي فرع فوري' : 'Pay at any Fawry outlet',
      icon: Smartphone,
      fees: isRTL ? 'رسوم 5 جنيه' : 'EGP 5 fees'
    }
  ];

  const createPayment = async () => {
    if (!user) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'يجب تسجيل الدخول أولاً' : 'Please sign in first',
        variant: 'destructive'
      });
      return;
    }
  
    setLoading(true);
    setError(null);
    setPaymentStatus('processing');
  
    try {
      const { data, error } = await supabase.functions.invoke('create-paymob-payment', {
        body: {
          courseId,
          paymentMethod
        }
      });
  
      if (error) throw error;
  
      if (data.success) {
        setPaymentId(data.payment_id);
  
        // بدل فتح نافذة popup، نعمل redirect مباشر
        window.location.href = data.payment_url;
  
        toast({
          title: isRTL ? 'جاري التوجيه للدفع' : 'Redirecting to payment',
          description: isRTL 
            ? 'ستتم إعادة توجيهك لصفحة الدفع مباشرة'
            : 'You will be redirected to the payment page'
        });
  
      } else {
        throw new Error(data.error || 'Payment creation failed');
      }
    } catch (err: any) {
      setError(err.message);
      setPaymentStatus('failed');
      toast({
        title: isRTL ? 'خطأ في الدفع' : 'Payment Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const startPaymentStatusCheck = (paymentId: string) => {
    const checkInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-payment-status', {
          body: { paymentId }
        });

        if (error) throw error;

        if (data.success && data.payment) {
          const status = data.payment.status;
          
          if (status === 'completed') {
            setPaymentStatus('success');
            clearInterval(checkInterval);
            
            toast({
              title: isRTL ? 'تم الدفع بنجاح' : 'Payment Successful',
              description: isRTL ? 'تم تسجيلك في الدورة بنجاح' : 'You have been enrolled in the course successfully'
            });
            
            onPaymentSuccess();
          } else if (status === 'failed') {
            setPaymentStatus('failed');
            clearInterval(checkInterval);
            setError(isRTL ? 'فشل في عملية الدفع' : 'Payment failed');
          }
        }
      } catch (err) {
        console.error('Payment status check failed:', err);
      }
    }, 3000); // Check every 3 seconds

    // Stop checking after 10 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      if (paymentStatus === 'processing') {
        setPaymentStatus('idle');
        setError(isRTL ? 'انتهت مهلة التحقق من الدفع' : 'Payment verification timeout');
      }
    }, 600000);
  };

  const formatPrice = (price: number) => {
    return isRTL ? `${price} جنيه مصري` : `EGP ${price}`;
  };

  if (paymentStatus === 'success') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {isRTL ? 'تم الدفع بنجاح!' : 'Payment Successful!'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {isRTL ? 'تم تسجيلك في الدورة بنجاح' : 'You have been enrolled in the course successfully'}
          </p>
          <Button onClick={onPaymentSuccess} className="w-full">
            {isRTL ? 'بدء الدورة' : 'Start Course'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === 'processing') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <Clock className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-semibold mb-2">
            {isRTL ? 'جاري معالجة الدفع...' : 'Processing Payment...'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {isRTL 
              ? 'يرجى إكمال عملية الدفع في النافذة المفتوحة'
              : 'Please complete the payment in the opened window'
            }
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={onPaymentCancel}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              onClick={() => paymentId && startPaymentStatusCheck(paymentId)}
              variant="outline"
            >
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isRTL ? 'التحقق من الحالة' : 'Check Status'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {isRTL ? 'إتمام عملية الدفع' : 'Complete Payment'}
        </CardTitle>
        <CardDescription>
          {isRTL 
            ? 'اختر طريقة الدفع المناسبة لك لشراء الدورة'
            : 'Choose your preferred payment method to purchase the course'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Course Summary */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold">{courseTitle}</h4>
              <p className="text-sm text-muted-foreground">
                {isRTL ? 'دورة تعليمية' : 'Educational Course'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatPrice(coursePrice)}</div>
              <Badge variant="secondary">
                {isRTL ? 'دفعة واحدة' : 'One-time payment'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'card' | 'fawry')}>
          <TabsList className="grid w-full grid-cols-2">
            {paymentMethods.map((method) => (
              <TabsTrigger key={method.id} value={method.id}>
                <method.icon className="w-4 h-4 mr-2" />
                {method.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {paymentMethods.map((method) => (
            <TabsContent key={method.id} value={method.id} className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <method.icon className="w-6 h-6 text-primary" />
                    <div>
                      <h4 className="font-semibold">{method.name}</h4>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{method.fees}</span>
                    <span className="font-medium">
                      {isRTL ? 'آمن ومضمون' : 'Safe & Secure'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {method.id === 'fawry' && (
                <Alert>
                  <Smartphone className="h-4 w-4" />
                  <AlertDescription>
                    {isRTL 
                      ? 'ستحصل على كود دفع لاستخدامه في أي فرع فوري. الكود صالح لمدة 7 أيام.'
                      : 'You will receive a payment code to use at any Fawry outlet. Code is valid for 7 days.'
                    }
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Security Notice */}
        <div className="text-center text-sm text-muted-foreground">
          <Shield className="w-4 h-4 inline mr-2" />
          {isRTL 
            ? 'جميع المعاملات محمية بتشفير SSL والامتثال لمعايير PCI DSS'
            : 'All transactions are protected with SSL encryption and PCI DSS compliance'
          }
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={onPaymentCancel} className="flex-1">
          {isRTL ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button 
          onClick={createPayment} 
          disabled={loading}
          className="flex-1"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <DollarSign className="w-4 h-4 mr-2" />
          {loading 
            ? (isRTL ? 'جاري المعالجة...' : 'Processing...')
            : (isRTL ? `ادفع ${formatPrice(coursePrice)}` : `Pay ${formatPrice(coursePrice)}`)
          }
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PaymentFlow;