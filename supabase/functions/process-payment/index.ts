import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: true, message: 'Não autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: true, message: 'Não autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const requestBody = await req.json();
    console.log('Request body received:', JSON.stringify(requestBody, null, 2));

    const { 
      amount, 
      orderDetails, 
      restaurantId, 
      tableId, 
      paymentMethod, 
      orderId,
      payer,
      cardToken,
      cardData
    } = requestBody;

    console.log('Processing payment:', { amount, restaurantId, paymentMethod, orderId });

    // Para Pindura e Local, apenas atualizar o pedido
    if (paymentMethod === 'pindura' || paymentMethod === 'local') {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_method: paymentMethod,
          payment_status: 'pending',
          order_status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating order:', updateError);
        return new Response(
          JSON.stringify({ error: true, message: 'Erro ao atualizar pedido' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Criar registro na tabela de transações
      const { error: transactionError } = await supabase
        .from('daily_transactions')
        .insert({
          establishment_id: restaurantId,
          table_number: tableId,
          total_amount: amount,
          payment_method: paymentMethod,
          status: 'confirmed',
          order_items: orderDetails,
          customer_name: user.user_metadata?.name || 'Cliente',
          customer_phone: user.phone || '',
        });

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          orderId,
          message: paymentMethod === 'pindura' 
            ? 'Pindura confirmada' 
            : 'Pedido confirmado para pagamento no local'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Para PIX e Cartão, processar via Mercado Pago
    // Usar credenciais fixas da plataforma
    const platformAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    const platformPublicKey = Deno.env.get('MERCADO_PAGO_PUBLIC_KEY');

    if (!platformAccessToken || !platformPublicKey) {
      console.error('Platform MP credentials not configured');
      return new Response(
        JSON.stringify({ 
          error: true,
          message: 'Credenciais do Mercado Pago não configuradas' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Using platform credentials for payment');

    // Processar PIX
    if (paymentMethod === 'pix') {
      if (!payer) {
        throw new Error('Dados do pagador obrigatórios para PIX');
      }

      const pixPaymentData = {
        transaction_amount: amount,
        payment_method_id: 'pix',
        payer: {
          email: payer.email,
          first_name: payer.first_name,
          last_name: payer.last_name,
          identification: {
            type: payer.identification.type,
            number: payer.identification.number
          }
        },
        description: `Pedido Mesa ${tableId}`,
        external_reference: orderId,
        notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
      };

      console.log('Creating PIX payment...');

      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${platformAccessToken}`,
          'X-Idempotency-Key': `${orderId}-${Date.now()}`,
        },
        body: JSON.stringify(pixPaymentData),
      });

      const mpData = await mpResponse.json();

      if (!mpResponse.ok) {
        console.error('Mercado Pago error:', mpData);
        throw new Error(mpData.message || 'Erro ao gerar PIX');
      }

      console.log('PIX generated:', { 
        id: mpData.id, 
        status: mpData.status 
      });

      // Atualizar pedido
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_method: 'pix',
          payment_status: 'pending',
          order_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating order:', updateError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          pixData: {
            qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
            qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
            ticket_url: mpData.point_of_interaction?.transaction_data?.ticket_url,
            payment_id: mpData.id,
          },
          orderId,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Processar Cartão de Crédito
    if (paymentMethod === 'credit') {
      let tokenToUse = cardToken;

      // Se não tiver token mas tiver cardData, criar o token no backend
      if (!tokenToUse && cardData) {
        console.log('Creating card token in backend...');
        
        const tokenPayload = {
          card_number: cardData.cardNumber,
          cardholder: {
            name: cardData.cardholderName,
            identification: {
              type: 'CPF',
              number: cardData.cpf,
            }
          },
          expiration_month: parseInt(cardData.cardExpirationMonth),
          expiration_year: parseInt('20' + cardData.cardExpirationYear),
          security_code: cardData.securityCode,
        };

        const tokenResponse = await fetch('https://api.mercadopago.com/v1/card_tokens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${platformAccessToken}`,
          },
          body: JSON.stringify(tokenPayload),
        });

        const tokenData = await tokenResponse.json();
        
        if (!tokenResponse.ok) {
          console.error('Error creating token:', tokenData);
          return new Response(
            JSON.stringify({ 
              error: true, 
              message: tokenData.message || 'Erro ao processar dados do cartão',
              details: tokenData 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        tokenToUse = tokenData.id;
        console.log('Token created successfully:', tokenToUse);
      }

      if (!tokenToUse) {
        return new Response(
          JSON.stringify({ error: true, message: 'Token do cartão obrigatório' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      if (!payer) {
        return new Response(
          JSON.stringify({ error: true, message: 'Dados do pagador obrigatórios' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const cardPaymentData = {
        transaction_amount: amount,
        token: tokenToUse,
        installments: 1,
        payment_method_id: 'visa', // Será determinado pelo token
        payer: {
          email: payer.email,
          identification: {
            type: payer.identification.type,
            number: payer.identification.number
          }
        },
        description: `Pedido Mesa ${tableId}`,
        external_reference: orderId,
        notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
      };

      console.log('Creating card payment...');

      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${platformAccessToken}`,
          'X-Idempotency-Key': `${orderId}-${Date.now()}`,
        },
        body: JSON.stringify(cardPaymentData),
      });

      const mpData = await mpResponse.json();

      if (!mpResponse.ok) {
        console.error('Mercado Pago error:', mpData);
        const errorMessage = mpData.message || mpData.cause?.[0]?.description || 'Erro ao processar pagamento';
        
        return new Response(
          JSON.stringify({ 
            error: true, 
            message: errorMessage,
            details: mpData 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      console.log('Card payment created:', { 
        id: mpData.id, 
        status: mpData.status 
      });

      // Atualizar pedido baseado no status
      const paymentStatus = mpData.status === 'approved' ? 'paid' : 'pending';
      const orderStatus = mpData.status === 'approved' ? 'confirmed' : 'pending';

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_method: 'credit',
          payment_status: paymentStatus,
          order_status: orderStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating order:', updateError);
      }

      // Se aprovado, criar transação
      if (mpData.status === 'approved') {
        const { error: transactionError } = await supabase
          .from('daily_transactions')
          .insert({
            establishment_id: restaurantId,
            table_number: tableId,
            total_amount: amount,
            payment_method: 'credit',
            status: 'completed',
            order_items: orderDetails,
            customer_name: user.user_metadata?.name || 'Cliente',
            customer_phone: user.phone || '',
          });

        if (transactionError) {
          console.error('Error creating transaction:', transactionError);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          payment: {
            id: mpData.id,
            status: mpData.status,
            status_detail: mpData.status_detail,
          },
          orderId,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: true,
        message: 'Método de pagamento inválido' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error: any) {
    console.error('Error in process-payment function:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: error.message || 'Erro ao processar pagamento',
        details: error.toString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
