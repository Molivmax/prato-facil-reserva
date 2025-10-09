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
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Não autorizado');
    }

    const { 
      amount, 
      orderDetails, 
      restaurantId, 
      tableId, 
      paymentMethod, 
      orderId,
      payer,
      cardToken 
    } = await req.json();

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
        throw new Error('Erro ao atualizar pedido');
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
    // Buscar credenciais do estabelecimento
    const { data: credentials, error: credError } = await supabase
      .from('establishment_mp_credentials')
      .select('access_token, public_key, seller_id')
      .eq('establishment_id', restaurantId)
      .single();

    if (credError || !credentials) {
      console.error('Credentials error:', credError);
      throw new Error('Estabelecimento não configurou pagamentos online. Use outro método.');
    }

    console.log('Found credentials for seller:', credentials.seller_id);

    // Calcular taxa do app (3%)
    const applicationFee = Number((amount * 0.03).toFixed(2));
    const netAmount = Number((amount - applicationFee).toFixed(2));

    console.log('Payment breakdown:', { 
      total: amount, 
      applicationFee, 
      netAmount 
    });

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
        // Taxa da aplicação (3%)
        application_fee: applicationFee,
      };

      console.log('Creating PIX payment...');

      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credentials.access_token}`,
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
      if (!cardToken) {
        throw new Error('Token do cartão obrigatório');
      }

      if (!payer) {
        throw new Error('Dados do pagador obrigatórios');
      }

      const cardPaymentData = {
        transaction_amount: amount,
        token: cardToken,
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
        // Taxa da aplicação (3%)
        application_fee: applicationFee,
      };

      console.log('Creating card payment...');

      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credentials.access_token}`,
        },
        body: JSON.stringify(cardPaymentData),
      });

      const mpData = await mpResponse.json();

      if (!mpResponse.ok) {
        console.error('Mercado Pago error:', mpData);
        throw new Error(mpData.message || 'Erro ao processar pagamento');
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

    throw new Error('Método de pagamento inválido');

  } catch (error) {
    console.error('Error in process-payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
