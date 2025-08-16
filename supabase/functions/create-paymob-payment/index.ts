import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Paymob Configuration
const PAYMOB_CONFIG = {
  API_KEY: 'ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRBMk9Ea3dOU3dpYm1GdFpTSTZJbWx1YVhScFlXd2lmUS4tWFMwRjQtb185bm5NeGItcTZYTG5aNmk5aHVfdWMzbEprSkZLUWtvRzY0OTdyWjVmRGtZdW9aYm91M0lfdGNncVpDY0xrMUpSeE9VeGw5Z1ZNQXpvUQ==',
  INTEGRATION_IDS: {
    CARD: 5237776,
    FAWRY: 5237776
  },
  IFRAME_IDS: {
    CARD: 949862,
    FAWRY: 949862
  },
  BASE_URL: 'https://accept.paymob.com/api',
  CURRENCY: 'EGP',
  COUNTRY: 'EG'
};

interface PaymobOrderRequest {
  amount_cents: number;
  currency: string;
  delivery_needed: boolean;
  items: Array<{
    name: string;
    amount_cents: number;
    description: string;
    quantity: number;
  }>;
}

interface PaymobPaymentKeyRequest {
  amount_cents: number;
  currency: string;
  integration_id: number;
  order_id: string;
  billing_data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    apartment: string;
    floor: string;
    street: string;
    building: string;
    shipping_method: string;
    postal_code: string;
    city: string;
    country: string;
    state: string;
  };
  redirect_url?: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYMOB-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { courseId, paymentMethod = 'card', success = false, orderId: paymobOrderId } = await req.json();
    if (!courseId) throw new Error("Course ID is required");

    // Fetch course
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('is_published', true)
      .single();
    if (courseError || !course) throw new Error("Course not found or not published");
    logStep("Course found", { courseId, title: course.title_en, price: course.price });

    // Handle post-payment confirmation
    if (success && paymobOrderId) {
      logStep("Payment success detected, updating records");

      // Get payment record
      const { data: paymentRecord, error: paymentFetchError } = await supabaseClient
        .from('payments')
        .select('*')
        .eq('paymob_order_id', paymobOrderId)
        .maybeSingle();
      if (paymentFetchError || !paymentRecord) throw new Error("Payment record not found");

      // Update payment status
      await supabaseClient
        .from('payments')
        .update({ status: 'completed' })
        .eq('id', paymentRecord.id);

      // Add enrollment record
      await supabaseClient
        .from('enrollments')
        .insert([{
          student_id: user.id,
          course_id: courseId,
          enrollment_type: 'paid',
          payment_id: paymentRecord.id,
          payment_status: 'completed',
          enrolled_at: new Date(),
          progress: 0,
          completed_lessons: 0
        }]);

      return new Response(JSON.stringify({ success: true, message: "Course unlocked", courseId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabaseClient
      .from('enrollments')
      .select('*')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();
    if (existingEnrollment) throw new Error("User is already enrolled in this course");

    // Payment creation steps
    const integrationId = paymentMethod === 'fawry' ? PAYMOB_CONFIG.INTEGRATION_IDS.FAWRY : PAYMOB_CONFIG.INTEGRATION_IDS.CARD;
    logStep("Using integration ID", { paymentMethod, integrationId });

    const authResponse = await fetch(`${PAYMOB_CONFIG.BASE_URL}/auth/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: PAYMOB_CONFIG.API_KEY })
    });
    if (!authResponse.ok) throw new Error(`Paymob auth failed: ${authResponse.status}`);
    const authData = await authResponse.json();
    const authToken = authData.token;

    const amountCents = Math.round(course.price * 100);
    const orderData: PaymobOrderRequest = {
      amount_cents: amountCents,
      currency: PAYMOB_CONFIG.CURRENCY,
      delivery_needed: false,
      items: [{ name: course.title_en, amount_cents: amountCents, description: course.short_description_en || course.title_en, quantity: 1 }]
    };

    const orderResponse = await fetch(`${PAYMOB_CONFIG.BASE_URL}/ecommerce/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
      body: JSON.stringify(orderData)
    });
    const orderResult = await orderResponse.json();
    const orderId = orderResult.id;

    const userProfile = user.user_metadata || {};
    const billingData = {
      first_name: userProfile.full_name?.split(' ')[0] || user.email?.split('@')[0] || "User",
      last_name: userProfile.full_name?.split(' ').slice(1).join(' ') || "Name",
      email: user.email || "",
      phone_number: userProfile.phone || "+201000000000",
      apartment: "NA", floor: "NA", street: "NA", building: "NA", shipping_method: "NA",
      postal_code: "00000", city: "Cairo", country: PAYMOB_CONFIG.COUNTRY, state: "Cairo"
    };

    const paymentKeyResponse = await fetch(`${PAYMOB_CONFIG.BASE_URL}/acceptance/payment_keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
      body: JSON.stringify({
        amount_cents: amountCents,
        currency: PAYMOB_CONFIG.CURRENCY,
        integration_id: integrationId,
        order_id: orderId.toString(),
        billing_data: billingData,
        redirect_url: 'http://10.89.181.250:8083/courses'
      })
    });
    const paymentKeyResult = await paymentKeyResponse.json();
    const paymentKey = paymentKeyResult.token;

    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        course_id: courseId,
        amount: course.price,
        currency: PAYMOB_CONFIG.CURRENCY,
        payment_method: paymentMethod,
        paymob_order_id: orderId.toString(),
        paymob_payment_key: paymentKey,
        status: 'pending',
        payment_data: { integration_id: integrationId, billing_data: billingData, order_data: orderResult }
      })
      .select()
      .single();

    const redirectUrl = 'http://10.89.181.250:8083/courses';
    const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${paymentMethod === 'fawry' ? PAYMOB_CONFIG.IFRAME_IDS.FAWRY : PAYMOB_CONFIG.IFRAME_IDS.CARD}?payment_token=${paymentKey}&redirect_url=${encodeURIComponent(redirectUrl)}`;

    return new Response(JSON.stringify({
      success: true,
      payment_url: paymentUrl,
      payment_id: payment.id,
      order_id: orderId,
      payment_key: paymentKey,
      amount: course.price,
      currency: PAYMOB_CONFIG.CURRENCY,
      environment: 'sandbox'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
