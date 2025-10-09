import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('MERCADO_PAGO_CLIENT_ID');
    const redirectUri = Deno.env.get('MERCADO_PAGO_REDIRECT_URI');

    if (!clientId) {
      throw new Error('MERCADO_PAGO_CLIENT_ID não configurado');
    }

    if (!redirectUri) {
      throw new Error('MERCADO_PAGO_REDIRECT_URI não configurado');
    }

    return new Response(
      JSON.stringify({
        clientId,
        redirectUri,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error getting MP config:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
