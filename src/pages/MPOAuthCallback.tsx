import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const MPOAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      navigate('/payment-setup?error=oauth_failed');
      return;
    }

    if (code && state) {
      // Redirect to edge function to process OAuth
      const edgeUrl = `https://lstbjfcupoowfeunlcly.supabase.co/functions/v1/mp-oauth-callback?code=${code}&state=${state}`;
      window.location.href = edgeUrl;
    } else {
      navigate('/payment-setup?error=missing_params');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Processando autorização...</h2>
        <p className="text-muted-foreground">Por favor, aguarde.</p>
      </div>
    </div>
  );
};

export default MPOAuthCallback;
