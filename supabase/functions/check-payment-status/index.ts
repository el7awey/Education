import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Paymob Configuration
const PAYMOB_CONFIG = {
  API_KEY: 'ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRBMk9EVXlPU3dpYm1GdFpTSTZJbWx1YVhScFlXd2lmUS5CYjFqTWpHY3pMaWdPSTg1d3ZReEZBZEhENkt6aXZlNU94d0tLX0JKQ19rNWhtWF8tNlF6ZURlV2NpOEdod0MwUzhhSEtqXzlsWmthNnpiN1h6alVWUQ==',
  BASE_URL: '${PAYMOB_CONFIG.BASE_URL}/acceptance/iframes/${integrationId}?payment_token=${paymentKey}',
  ENVIRONMENT: 'sandbox'
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Payment status check started");

    // Initialize Supabase with service role key
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

    const { paymentId, orderId } = await req.json();
    
    if (!paymentId && !orderId) {
      throw new Error("Either payment ID or order ID is required");
    }

    logStep("Checking payment status", { paymentId, orderId, userId: user.id });

    // Find payment record
    let query = supabaseClient
      .from('payments')
      .select(`
        *,
        courses (
          id,
          title_en,
          title_ar,
          price
        )
      `)
      .eq('user_id', user.id);

    if (paymentId) {
      query = query.eq('id', paymentId);
    } else {
      query = query.eq('paymob_order_id', orderId);
    }

    const { data: payment, error: paymentError } = await query.single();

    if (paymentError || !payment) {
      throw new Error("Payment not found");
    }

    logStep("Payment found", { 
      paymentId: payment.id, 
      status: payment.status,
      orderId: payment.paymob_order_id 
    });

    // If payment is still pending, check with Paymob API
    if (payment.status === 'pending' && payment.paymob_order_id) {
      logStep("Payment still pending, checking with Paymob");

      try {
        // Get Paymob auth token
        const authResponse = await fetch(`${PAYMOB_CONFIG.BASE_URL}/auth/tokens`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: PAYMOB_CONFIG.API_KEY
          })
        });

        if (authResponse.ok) {
          const authData = await authResponse.json();
          const authToken = authData.token;

          // Get transaction details
          const transactionResponse = await fetch(`${PAYMOB_CONFIG.BASE_URL}/acceptance/transactions/${payment.paymob_order_id}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${authToken}`
            }
          });

          if (transactionResponse.ok) {
            const transaction = await transactionResponse.json();
            logStep("Transaction details from Paymob", { 
              transactionId: transaction.id,
              success: transaction.success,
              status: transaction.status
            });

            // Update payment status if it has changed
            let newStatus = payment.status;
            if (transaction.success === true) {
              newStatus = 'completed';
            } else if (transaction.success === false || transaction.error_occured) {
              newStatus = 'failed';
            }

            if (newStatus !== payment.status) {
              logStep("Updating payment status", { oldStatus: payment.status, newStatus });
              
              const { error: updateError } = await supabaseClient
                .from('payments')
                .update({
                  status: newStatus,
                  payment_data: {
                    ...payment.payment_data,
                    last_checked: new Date().toISOString(),
                    paymob_status: transaction.status
                  }
                })
                .eq('id', payment.id);

              if (updateError) {
                logStep("Failed to update payment status", { error: updateError.message });
              } else {
                payment.status = newStatus;
                logStep("Payment status updated successfully");
              }
            }
          } else {
            logStep("Failed to get transaction details from Paymob", { 
              status: transactionResponse.status 
            });
          }
        } else {
          logStep("Failed to get Paymob auth token", { 
            status: authResponse.status 
          });
        }
      } catch (apiError) {
        logStep("Error checking Paymob API", { error: apiError instanceof Error ? apiError.message : String(apiError) });
        // Don't fail the request, just return current status
      }
    }

    // Return payment status
    return new Response(JSON.stringify({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        payment_method: payment.payment_method,
        created_at: payment.created_at,
        course: payment.courses
      }
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