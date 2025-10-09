
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
    // Get user authentication from request
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
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
    
    const { amount, orderDetails, restaurantId, tableId, paymentMethod, orderId, payer } = requestData;

    if (!amount || !orderDetails || !restaurantId || tableId === undefined || tableId === null || !paymentMethod || !orderId) {
      throw new Error("Dados incompletos para o pagamento");
    }

    // Validar dados do pagador para PIX
    if (paymentMethod === "pix" && (!payer || !payer.identification || !payer.identification.number)) {
      throw new Error("CPF do pagador é obrigatório para pagamento PIX");
    }

    // Get establishment credentials from database
    console.log('Buscando credenciais do estabelecimento:', restaurantId);
    
    const { data: credentials, error: credError } = await supabaseClient
      .from('establishment_mp_credentials')
      .select('access_token, public_key, seller_id')
      .eq('establishment_id', restaurantId)
      .maybeSingle();

    if (credError || !credentials) {
      console.error('Erro ao buscar credenciais:', credError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Este estabelecimento ainda não configurou o Mercado Pago. Entre em contato com eles." 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    const mercadoPagoToken = credentials.access_token;
    console.log('Credenciais encontradas - Seller ID:', credentials.seller_id);

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
      try {
        console.log('Iniciando pagamento PIX para pedido:', orderId);
        console.log('Valor:', amount);
        console.log('Dados do pagador:', payer);
        
        // Create PIX payment with Mercado Pago
        // Documentação: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/pix
        const pixPaymentData = {
          transaction_amount: Number(amount),
          description: `Pedido #${orderId.substring(0, 8)}`,
          payment_method_id: "pix",
          payer: {
            email: payer.email,
            first_name: payer.first_name,
            last_name: payer.last_name,
            identification: {
              type: payer.identification.type,
              number: payer.identification.number
            }
          },
        };

        console.log('Dados do pagamento PIX:', JSON.stringify(pixPaymentData));

        const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${mercadoPagoToken}`,
          },
          body: JSON.stringify(pixPaymentData),
        });

        const pixResult = await mpResponse.json();
        console.log('Resposta Mercado Pago - Status:', mpResponse.status);
        console.log('Resposta Mercado Pago - Body:', JSON.stringify(pixResult));

        if (!mpResponse.ok) {
          console.error("Erro Mercado Pago PIX:", pixResult);
          throw new Error(`Erro PIX: ${pixResult.message || JSON.stringify(pixResult.cause || pixResult)}`);
        }

        // Update order status
        const { error: updateError } = await supabaseClient
          .from('orders')
          .update({
            payment_method: 'pix',
            payment_status: 'pending',
            order_status: 'pending'
          })
          .eq('id', orderId)
          .eq('user_id', userData.user.id);

        if (updateError) {
          console.error('Erro ao atualizar pedido:', updateError);
        }

        const qrCodeBase64 = pixResult.point_of_interaction?.transaction_data?.qr_code_base64;
        const qrCodeText = pixResult.point_of_interaction?.transaction_data?.qr_code;

        console.log('QR Code Base64 presente:', !!qrCodeBase64);
        console.log('QR Code Text presente:', !!qrCodeText);

        return new Response(
          JSON.stringify({
            success: true,
            paymentMethod: "pix",
            orderId: orderId,
            pixData: {
              qrCode: qrCodeBase64,
              qrCodeText: qrCodeText,
              paymentId: pixResult.id,
            }
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      } catch (mpError: any) {
        console.error("Erro PIX Mercado Pago:", mpError);
        throw new Error(`Erro no processamento do PIX: ${mpError.message}`);
      }
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
    const errorMessage = (error as Error).message || "Erro desconhecido no processamento do pagamento";
    console.error("Mensagem de erro:", errorMessage);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Mudando para 200 para que o frontend possa processar o erro
      }
    );
  }
});
