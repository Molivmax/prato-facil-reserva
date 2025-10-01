
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    // Initialize Mercado Pago with access token
    const mercadoPagoToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mercadoPagoToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN não está configurado");
    }

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
    
    const { amount, orderDetails, restaurantId, tableId, paymentMethod, orderId } = requestData;

    if (!amount || !orderDetails || !restaurantId || !tableId || !paymentMethod || !orderId) {
      throw new Error("Dados incompletos para o pagamento");
    }

    // Handle payment based on the method
    if (paymentMethod === "credit") {
      try {
        // Create a payment with Mercado Pago
        const paymentData = {
          transaction_amount: amount,
          description: `Pedido #${orderId}`,
          payment_method_id: "credit_card",
          payer: {
            email: userData.user.email,
          },
          metadata: {
            user_id: userData.user.id,
            restaurant_id: restaurantId,
            table_id: tableId,
            order_id: orderId,
          },
        };

        const mercadoPagoResponse = await fetch("https://api.mercadopago.com/v1/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${mercadoPagoToken}`,
          },
          body: JSON.stringify(paymentData),
        });

        if (!mercadoPagoResponse.ok) {
          const errorData = await mercadoPagoResponse.json();
          console.error("Erro Mercado Pago:", errorData);
          throw new Error("Erro ao processar pagamento no Mercado Pago");
        }

        const paymentResult = await mercadoPagoResponse.json();

        // Update order in database
        const { error: updateError } = await supabaseClient
          .from('orders')
          .update({
            payment_method: paymentMethod,
            payment_status: 'paid',
            order_status: 'confirmed'
          })
          .eq('id', orderId)
          .eq('user_id', userData.user.id);

        if (updateError) {
          console.error('Erro ao atualizar pedido:', updateError);
        }

        return new Response(
          JSON.stringify({
            paymentId: paymentResult.id,
            status: paymentResult.status,
            orderId: orderId,
            success: true
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      } catch (mpError: any) {
        console.error("Erro Mercado Pago:", mpError);
        throw new Error(`Erro no processamento do pagamento: ${mpError.message}`);
      }
    } else if (paymentMethod === "pix") {
      // For PIX payment, update order status
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({
          payment_method: 'pix',
          payment_status: 'paid',
          order_status: 'confirmed'
        })
        .eq('id', orderId)
        .eq('user_id', userData.user.id);

      if (updateError) {
        console.error('Erro ao atualizar pedido:', updateError);
        throw new Error('Erro ao confirmar pagamento PIX');
      }

      return new Response(
        JSON.stringify({
          success: true,
          paymentMethod: "pix",
          orderId: orderId,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else if (paymentMethod === "pindura") {
      // For Pindura payment, update order status
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({
          payment_method: 'pindura',
          payment_status: 'pindura',
          order_status: 'confirmed'
        })
        .eq('id', orderId)
        .eq('user_id', userData.user.id);

      if (updateError) {
        console.error('Erro ao atualizar pedido:', updateError);
        throw new Error('Erro ao confirmar Pindura');
      }

      return new Response(
        JSON.stringify({
          success: true,
          paymentMethod: "pindura",
          orderId: orderId,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else if (paymentMethod === "local") {
      // For local payment, just confirm the order without payment processing
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({
          payment_method: 'local',
          payment_status: 'pay_later',
          order_status: 'confirmed'
        })
        .eq('id', orderId)
        .eq('user_id', userData.user.id);

      if (updateError) {
        console.error('Erro ao atualizar pedido:', updateError);
        throw new Error('Erro ao confirmar pedido');
      }

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
      JSON.stringify({ error: (error as Error).message || "Erro desconhecido no processamento do pagamento" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
