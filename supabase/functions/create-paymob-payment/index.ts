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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

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

    // Handle success callback
    if (success && paymobOrderId) {
      const { data: paymentRecord } = await supabaseClient
        .from('payments')
        .select('*')
        .eq('paymob_order_id', paymobOrderId)
        .maybeSingle();
      if (!paymentRecord) throw new Error("Payment record not found");

      await supabaseClient
        .from('payments')
        .update({ status: 'completed' })
        .eq('id', paymentRecord.id);

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

    // Paymob Auth
    const integrationId = paymentMethod === 'fawry'
      ? PAYMOB_CONFIG.INTEGRATION_IDS.FAWRY
      : PAYMOB_CONFIG.INTEGRATION_IDS.CARD;

    const authResponse = await fetch(`${PAYMOB_CONFIG.BASE_URL}/auth/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: PAYMOB_CONFIG.API_KEY })
    });
    const authData = await authResponse.json();
    const authToken = authData.token;

    const amountCents = Math.round(course.price * 100);

    const orderResponse = await fetch(`${PAYMOB_CONFIG.BASE_URL}/ecommerce/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
      body: JSON.stringify({
        amount_cents: amountCents,
        currency: PAYMOB_CONFIG.CURRENCY,
        delivery_needed: false,
        items: [{ name: course.title_en, amount_cents: amountCents, description: course.short_description_en || course.title_en, quantity: 1 }]
      })
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

    const redirectUrl = "https://education-jin4.onrender.com";

    const paymentKeyResponse = await fetch(`${PAYMOB_CONFIG.BASE_URL}/acceptance/payment_keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
      body: JSON.stringify({
        amount_cents: amountCents,
        currency: PAYMOB_CONFIG.CURRENCY,
        integration_id: integrationId,
        order_id: orderId.toString(),
        billing_data: billingData,
        redirect_url: redirectUrl
      })
    });
    const paymentKeyResult = await paymentKeyResponse.json();
    const paymentKey = paymentKeyResult.token;

    const { data: payment } = await supabaseClient
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

    const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${
      paymentMethod === 'fawry' ? PAYMOB_CONFIG.IFRAME_IDS.FAWRY : PAYMOB_CONFIG.IFRAME_IDS.CARD
    }?payment_token=${paymentKey}&redirect_url=${encodeURIComponent(redirectUrl)}`;

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
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
