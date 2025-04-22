
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Stripe with the secret key
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get user authentication from request
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Autenticação necessária");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error } = await supabaseClient.auth.getUser(token);
    
    if (error || !userData.user) {
      throw new Error("Usuário não autenticado");
    }

    // Get payment data from request
    const { amount, orderDetails, restaurantId, tableId, paymentMethod } = await req.json();

    if (!amount || !orderDetails || !restaurantId || !tableId || !paymentMethod) {
      throw new Error("Dados incompletos para o pagamento");
    }

    // Generate a unique order ID
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    // Handle payment based on the method
    if (paymentMethod === "micro-credit") {
      // Check if user has credit and sufficient limit
      const userMetadata = userData.user.user_metadata;
      const creditLimit = userMetadata?.credit_limit || 0;
      const hasCredit = userMetadata?.has_credit || false;

      if (!hasCredit) {
        throw new Error("Você não possui microcrédito aprovado");
      }

      if (creditLimit < amount) {
        throw new Error(`Limite de crédito insuficiente. Seu limite é R$ ${creditLimit.toFixed(2)}`);
      }

      // Update user's credit limit (simulated)
      // In a real scenario, you would update this in your database
      const newLimit = creditLimit - amount;
      await supabaseClient.auth.updateUser({
        data: { credit_limit: newLimit }
      });

      // Log the credit usage
      console.log(`User ${userData.user.id} used ${amount} of credit. New limit: ${newLimit}`);

      // Return credit payment confirmation
      return new Response(
        JSON.stringify({
          success: true,
          paymentMethod: "micro-credit",
          orderId: orderId,
          remainingCredit: newLimit,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else if (paymentMethod === "credit" || paymentMethod === "app") {
      // Create a payment intent with Stripe for card or app payments
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents for Stripe
        currency: "brl",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: userData.user.id,
          restaurantId,
          tableId,
          orderDetailsJson: JSON.stringify(orderDetails),
        },
      });

      return new Response(
        JSON.stringify({
          clientSecret: paymentIntent.client_secret,
          orderId: orderId,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else if (paymentMethod === "local") {
      // For local payment, just confirm the order without payment processing
      return new Response(
        JSON.stringify({
          success: true,
          paymentMethod: "local",
          orderId: orderId,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      throw new Error("Método de pagamento não suportado");
    }
  } catch (error) {
    console.error("Erro no processamento do pagamento:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
