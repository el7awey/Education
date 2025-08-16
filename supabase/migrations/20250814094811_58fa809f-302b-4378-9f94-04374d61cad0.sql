-- Create payments table to track all payment transactions
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EGP',
  payment_method TEXT, -- visa, mastercard, meeza, fawry, etc.
  paymob_order_id TEXT,
  paymob_transaction_id TEXT,
  paymob_payment_key TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  payment_data JSONB, -- Store additional Paymob response data
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Add indexes for better performance
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_course_id ON public.payments(course_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_paymob_order_id ON public.payments(paymob_order_id);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments table
CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Edge functions can update payments" 
ON public.payments 
FOR UPDATE 
USING (true);

CREATE POLICY "Admins can view all payments" 
ON public.payments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add payment_status to enrollments table to track if enrollment is paid
ALTER TABLE public.enrollments 
ADD COLUMN payment_id UUID REFERENCES payments(id),
ADD COLUMN payment_status TEXT DEFAULT 'pending';