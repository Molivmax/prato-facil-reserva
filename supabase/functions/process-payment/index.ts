
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
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY não está configurado");
    }
    
    const stripe = new Stripe(stripeSecretKey, {
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
    const requestData = await req.json().catch(() => {
      throw new Error("Formato de dados inválido");
    });
    
    const { amount, orderDetails, restaurantId, tableId, paymentMethod } = requestData;

    if (!amount || !orderDetails || !restaurantId || !tableId || !paymentMethod) {
      throw new Error("Dados incompletos para o pagamento");
    }

    // Generate a unique order ID
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    // Handle payment based on the method
    if (paymentMethod === "credit" || paymentMethod === "app") {
      try {
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
      } catch (stripeError: any) {
        console.error("Erro Stripe:", stripeError);
        throw new Error(`Erro no processamento do pagamento: ${stripeError.message}`);
      }
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
      JSON.stringify({ error: error.message || "Erro desconhecido no processamento do pagamento" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
