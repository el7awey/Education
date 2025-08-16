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
    CARD: 949863,  // رقم الـ iframe للبطاقة
    FAWRY: 949862  // رقم الـ iframe لو فيه للـ Fawry
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

    // Initialize Supabase with service role key for database operations
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

    // Get request body
    const { courseId, paymentMethod = 'card' } = await req.json();
    if (!courseId) throw new Error("Course ID is required");

    // Fetch course details
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('is_published', true)
      .single();

    if (courseError || !course) {
      throw new Error("Course not found or not published");
    }
    logStep("Course found", { courseId, title: course.title_en, price: course.price });

    // Check if user already enrolled in this course
    const { data: existingEnrollment } = await supabaseClient
      .from('enrollments')
      .select('*')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existingEnrollment) {
      throw new Error("User is already enrolled in this course");
    }

    // Get integration ID based on payment method
    const integrationId = paymentMethod === 'fawry' 
      ? PAYMOB_CONFIG.INTEGRATION_IDS.FAWRY
      : PAYMOB_CONFIG.INTEGRATION_IDS.CARD;

    logStep("Using integration ID", { paymentMethod, integrationId });

    // Step 1: Get authentication token
    logStep("Getting Paymob authentication token");
    const authResponse = await fetch(`${PAYMOB_CONFIG.BASE_URL}/auth/tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: PAYMOB_CONFIG.API_KEY
      })
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      logStep("Paymob auth failed", { status: authResponse.status, error: errorText });
      throw new Error(`Paymob auth failed: ${authResponse.status} - ${errorText}`);
    }

    const authData = await authResponse.json();
    const authToken = authData.token;
    logStep("Paymob auth token received");

    // Step 2: Create order
    const amountCents = Math.round(course.price * 100); // Convert to cents
    const orderData: PaymobOrderRequest = {
      amount_cents: amountCents,
      currency: PAYMOB_CONFIG.CURRENCY,
      delivery_needed: false,
      items: [{
        name: course.title_en,
        amount_cents: amountCents,
        description: course.short_description_en || course.title_en,
        quantity: 1
      }]
    };

    logStep("Creating Paymob order", orderData);
    const orderResponse = await fetch(`${PAYMOB_CONFIG.BASE_URL}/ecommerce/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify(orderData)
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      logStep("Paymob order creation failed", { status: orderResponse.status, error: errorText });
      throw new Error(`Paymob order creation failed: ${orderResponse.status} - ${errorText}`);
    }

    const orderResult = await orderResponse.json();
    const orderId = orderResult.id;
    logStep("Paymob order created", { orderId });

    // Step 3: Get payment key
    const userProfile = user.user_metadata || {};
    const billingData = {
      first_name: userProfile.full_name?.split(' ')[0] || user.email?.split('@')[0] || "User",
      last_name: userProfile.full_name?.split(' ').slice(1).join(' ') || "Name",
      email: user.email || "",
      phone_number: userProfile.phone || "+201000000000",
      apartment: "NA",
      floor: "NA", 
      street: "NA",
      building: "NA",
      shipping_method: "NA",
      postal_code: "00000",
      city: "Cairo",
      country: PAYMOB_CONFIG.COUNTRY,
      state: "Cairo"
    };

    const paymentKeyData: PaymobPaymentKeyRequest = {
      amount_cents: amountCents,
      currency: PAYMOB_CONFIG.CURRENCY,
      integration_id: integrationId,
      order_id: orderId.toString(),
      billing_data: billingData
    };

    logStep("Getting payment key", { integrationId, orderId });
    const paymentKeyResponse = await fetch(`${PAYMOB_CONFIG.BASE_URL}/acceptance/payment_keys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify(paymentKeyData)
    });

    if (!paymentKeyResponse.ok) {
      const errorText = await paymentKeyResponse.text();
      logStep("Paymob payment key creation failed", { status: paymentKeyResponse.status, error: errorText });
      throw new Error(`Paymob payment key creation failed: ${paymentKeyResponse.status} - ${errorText}`);
    }

    const paymentKeyResult = await paymentKeyResponse.json();
    const paymentKey = paymentKeyResult.token;
    logStep("Payment key created");

    // Step 4: Store payment record in database
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
        payment_data: {
          integration_id: integrationId,
          billing_data: billingData,
          order_data: orderResult
        }
      })
      .select()
      .single();

    if (paymentError) {
      logStep("Failed to store payment record", { error: paymentError.message });
      throw new Error(`Failed to store payment record: ${paymentError.message}`);
    }
    logStep("Payment record stored", { paymentId: payment.id });

    // Generate payment URL based on payment method
    let paymentUrl: string;
    if (paymentMethod === 'fawry') {
      paymentUrl = `${PAYMOB_CONFIG.BASE_URL}/acceptance/iframes/${PAYMOB_CONFIG.IFRAME_IDS.FAWRY}?payment_token=${paymentKey}`;
    } else {
      // Card payment (Visa, MasterCard, Meeza)
      paymentUrl =`https://accept.paymob.com/api/acceptance/iframes/949862?payment_token=${paymentKey}`;
    }
    

    logStep("Payment URL generated", { paymentMethod, paymentUrl });

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
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});