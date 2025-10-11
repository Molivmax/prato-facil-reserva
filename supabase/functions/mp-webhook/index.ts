import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const body = await req.json();
    console.log('Webhook received from Mercado Pago:', JSON.stringify(body));

    // Mercado Pago envia notificações de diferentes tipos
    // Tipo mais comum: { type: "payment", data: { id: "payment_id" } }
    if (body.type !== 'payment') {
      console.log('Ignoring non-payment notification:', body.type);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      console.error('No payment ID in webhook data');
      return new Response(JSON.stringify({ error: 'No payment ID' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log('Processing payment notification:', paymentId);

    // Buscar detalhes do pagamento no Mercado Pago
    // Primeiro precisamos descobrir qual estabelecimento é dono deste pagamento
    // Vamos tentar buscar usando o payment_id ou external_reference

    // Tentar buscar o pagamento usando diferentes credenciais de estabelecimentos
    const { data: allCredentials, error: credError } = await supabase
      .from('establishment_mp_credentials')
      .select('*');

    if (credError || !allCredentials || allCredentials.length === 0) {
      console.error('Error fetching MP credentials:', credError);
      return new Response(JSON.stringify({ error: 'No credentials found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Tentar buscar o pagamento com cada credencial até encontrar
    let paymentData = null;
    let establishmentId = null;

    for (const credential of allCredentials) {
      try {
        const mpResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${paymentId}`,
          {
            headers: {
              'Authorization': `Bearer ${credential.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (mpResponse.ok) {
          paymentData = await mpResponse.json();
          establishmentId = credential.establishment_id;
          console.log('Payment found for establishment:', establishmentId);
          break;
        }
      } catch (error) {
        console.log('Failed to fetch with credential:', credential.establishment_id, error);
        continue;
      }
    }

    if (!paymentData || !establishmentId) {
      console.error('Payment not found with any credentials');
      return new Response(JSON.stringify({ error: 'Payment not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    console.log('Payment data retrieved:', {
      id: paymentData.id,
      status: paymentData.status,
      external_reference: paymentData.external_reference,
    });

    // Buscar o pedido usando external_reference (orderId)
    const orderId = paymentData.external_reference;
    if (!orderId) {
      console.error('No external_reference in payment data');
      return new Response(JSON.stringify({ error: 'No order reference' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderId, orderError);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Mapear status do Mercado Pago para nosso sistema
    let paymentStatus = 'pending';
    let orderStatus = order.order_status;

    switch (paymentData.status) {
      case 'approved':
        paymentStatus = 'paid';
        orderStatus = 'confirmed';
        break;
      case 'pending':
      case 'in_process':
      case 'in_mediation':
        paymentStatus = 'pending';
        orderStatus = 'pending';
        break;
      case 'rejected':
      case 'cancelled':
      case 'refunded':
      case 'charged_back':
        paymentStatus = 'failed';
        orderStatus = 'cancelled';
        break;
    }

    console.log('Updating order:', {
      orderId,
      paymentStatus,
      orderStatus,
      mpStatus: paymentData.status,
    });

    // Atualizar o pedido
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        order_status: orderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update order' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Se o pagamento foi aprovado, criar/atualizar daily_transactions
    if (paymentStatus === 'paid') {
      console.log('Payment approved, creating daily transaction');

      // Mapear payment_type_id do Mercado Pago para os valores aceitos pela constraint
      let mappedPaymentMethod = 'credit';
      if (paymentData.payment_type_id === 'bank_transfer' || 
          paymentData.payment_method_id === 'pix') {
        mappedPaymentMethod = 'credit';
      } else if (paymentData.payment_type_id === 'credit_card' || 
                 paymentData.payment_type_id === 'debit_card') {
        mappedPaymentMethod = 'credit';
      }

      const { error: transactionError } = await supabase
        .from('daily_transactions')
        .insert({
          establishment_id: order.establishment_id,
          table_number: order.table_number,
          total_amount: order.total_amount,
          payment_method: mappedPaymentMethod,
          status: 'completed',
          order_items: order.items,
          customer_name: paymentData.payer?.first_name || 'Cliente',
          customer_phone: paymentData.payer?.phone?.number || '',
        });

      if (transactionError) {
        console.error('Error creating daily transaction:', transactionError);
        // Não retornamos erro aqui pois o pedido já foi atualizado
      } else {
        console.log('Daily transaction created successfully');
      }
    }

    console.log('Webhook processed successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId, 
        paymentStatus, 
        orderStatus 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
