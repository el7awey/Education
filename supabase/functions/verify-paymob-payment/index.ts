import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "https://deno.land/std@0.190.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Paymob Configuration
const PAYMOB_CONFIG = {
  API_KEY: 'ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRBMk9EVXlPU3dpYm1GdFpTSTZJbWx1YVhScFlXd2lmUS5CYjFqTWpHY3pMaWdPSTg1d3ZReEZBZEhENkt6aXZlNU94d0tLX0JKQ19rNWhtWF8tNlF6ZURlV2NpOEdod0MwUzhhSEtqXzlsWmthNnpiN1h6alVWUQ==',
  HMAC_SECRET: Deno.env.get("PAYMOB_HMAC_SECRET") || 'test_hmac_secret_sandbox',
  ENVIRONMENT: 'sandbox'
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYMOB-VERIFY] ${step}${detailsStr}`);
};

// Function to verify HMAC signature from Paymob
function verifyHmacSignature(data: any, receivedHmac: string): boolean {
  const hmacSecret = PAYMOB_CONFIG.HMAC_SECRET;
  
  // Construct the string to be hashed according to Paymob documentation
  const concatenatedString = [
    data.amount_cents,
    data.created_at,
    data.currency,
    data.error_occured,
    data.has_parent_transaction,
    data.id,
    data.integration_id,
    data.is_3d_secure,
    data.is_auth,
    data.is_capture,
    data.is_refunded,
    data.is_standalone_payment,
    data.is_voided,
    data.order?.id,
    data.owner,
    data.pending,
    data.source_data?.pan,
    data.source_data?.sub_type,
    data.source_data?.type,
    data.success
  ].join('');

  const hmac = createHmac('sha512', hmacSecret);
  hmac.update(concatenatedString);
  const computedHmac = hmac.digest('hex');

  logStep("HMAC verification", { 
    received: receivedHmac, 
    computed: computedHmac, 
    matches: computedHmac === receivedHmac 
  });

  return computedHmac === receivedHmac;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Payment verification started");

    // Initialize Supabase with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    const { type, obj } = body;

    logStep("Received webhook", { type, transactionId: obj?.id });

    // Handle different webhook types
    if (type === "TRANSACTION") {
      const transaction = obj;
      
      // Verify HMAC signature for security (optional in sandbox mode)
      const receivedHmac = req.headers.get("x-paymob-hmac");
      if (receivedHmac && PAYMOB_CONFIG.ENVIRONMENT === 'production') {
        if (!verifyHmacSignature(transaction, receivedHmac)) {
          logStep("HMAC verification failed");
          return new Response("Unauthorized", { status: 401 });
        }
      } else if (PAYMOB_CONFIG.ENVIRONMENT === 'sandbox') {
        logStep("Skipping HMAC verification in sandbox mode");
      }

      const orderId = transaction.order?.id?.toString();
      if (!orderId) {
        throw new Error("Order ID not found in transaction");
      }

      logStep("Processing transaction", { 
        orderId, 
        success: transaction.success,
        transactionId: transaction.id,
        amount: transaction.amount_cents,
        currency: transaction.currency
      });

      // Find the payment record
      const { data: payment, error: paymentError } = await supabaseClient
        .from('payments')
        .select('*')
        .eq('paymob_order_id', orderId)
        .single();

      if (paymentError || !payment) {
        logStep("Payment record not found", { orderId, error: paymentError?.message });
        throw new Error(`Payment record not found for order ${orderId}`);
      }

      logStep("Payment record found", { paymentId: payment.id, currentStatus: payment.status });

      // Update payment status
      const newStatus = transaction.success ? 'completed' : 'failed';
      const { error: updateError } = await supabaseClient
        .from('payments')
        .update({
          status: newStatus,
          payment_data: {
            ...payment.payment_data,
            transaction_data: transaction,
            verified_at: new Date().toISOString()
          }
        })
        .eq('id', payment.id);

      if (updateError) {
        logStep("Failed to update payment status", { error: updateError.message });
        throw new Error(`Failed to update payment status: ${updateError.message}`);
      }

      logStep("Payment status updated", { newStatus });

      // If payment is successful, create or update enrollment
      if (transaction.success) {
        // Check if enrollment already exists
        const { data: existingEnrollment } = await supabaseClient
          .from('enrollments')
          .select('*')
          .eq('student_id', payment.user_id)
          .eq('course_id', payment.course_id)
          .maybeSingle();

        if (existingEnrollment) {
          // Update existing enrollment
          const { error: enrollmentUpdateError } = await supabaseClient
            .from('enrollments')
            .update({
              enrollment_type: 'purchase',
              payment_status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingEnrollment.id);

          if (enrollmentUpdateError) {
            logStep("Failed to update enrollment", { error: enrollmentUpdateError.message });
          } else {
            logStep("Enrollment updated successfully");
          }
        } else {
          // Create new enrollment
          const { error: enrollmentCreateError } = await supabaseClient
            .from('enrollments')
            .insert({
              student_id: payment.user_id,
              course_id: payment.course_id,
              enrollment_type: 'purchase',
              payment_status: 'completed',
              enrolled_at: new Date().toISOString()
            });

          if (enrollmentCreateError) {
            logStep("Failed to create enrollment", { error: enrollmentCreateError.message });
          } else {
            logStep("Enrollment created successfully");
          }
        }
      }

      logStep("Webhook processed successfully", { 
        orderId, 
        success: transaction.success,
        paymentId: payment.id 
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Webhook processed successfully" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else {
      logStep("Unsupported webhook type", { type });
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Unsupported webhook type" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});