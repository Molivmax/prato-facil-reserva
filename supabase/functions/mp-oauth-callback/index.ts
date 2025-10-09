import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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
    const mpClientId = Deno.env.get('MERCADO_PAGO_CLIENT_ID');
    const mpClientSecret = Deno.env.get('MERCADO_PAGO_CLIENT_SECRET');
    const mpRedirectUri = Deno.env.get('MERCADO_PAGO_REDIRECT_URI');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // establishment_id
    const error = url.searchParams.get('error');

    console.log('OAuth callback received:', { code: !!code, state, error });

    if (error) {
      console.error('OAuth error:', error);
      return new Response(JSON.stringify({ error: 'OAuth authorization failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!code || !state) {
      return new Response(JSON.stringify({ error: 'Missing code or state' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Exchange code for access token
    console.log('Exchanging code for token...');
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: mpClientId,
        client_secret: mpClientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: mpRedirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return new Response(JSON.stringify({ error: 'Failed to exchange code for token' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tokenData = await tokenResponse.json();
    console.log('Token received:', { 
      user_id: tokenData.user_id, 
      expires_in: tokenData.expires_in 
    });

    // Get seller info to retrieve public_key
    const sellerResponse = await fetch('https://api.mercadopago.com/users/me', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });

    let publicKey = null;
    if (sellerResponse.ok) {
      const sellerData = await sellerResponse.json();
      publicKey = sellerData.public_key;
    }

    // Calculate token expiration
    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    // Store credentials in database
    const { data, error: dbError } = await supabase
      .from('establishment_mp_credentials')
      .upsert({
        establishment_id: state,
        seller_id: tokenData.user_id.toString(),
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type || 'Bearer',
        expires_at: expiresAt,
        public_key: publicKey,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'establishment_id',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(JSON.stringify({ error: 'Failed to store credentials' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Credentials stored successfully');

    // Redirect to success page
    const redirectUrl = `${url.origin}/mp-oauth-success?establishment=${state}`;
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
      },
    });

  } catch (error) {
    console.error('Error in mp-oauth-callback:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
