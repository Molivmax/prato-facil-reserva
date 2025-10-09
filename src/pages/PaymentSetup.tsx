import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const PaymentSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<any>(null);

  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      toast.success('Mercado Pago conectado com sucesso!');
    }
    checkConnection();
  }, [searchParams]);

  const checkConnection = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Você precisa estar logado');
        navigate('/establishment-login');
        return;
      }

      // Get establishment
      const { data: establishment, error: estError } = await supabase
        .from('establishments')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (estError || !establishment) {
        toast.error('Estabelecimento não encontrado');
        return;
      }

      setEstablishmentId(establishment.id);

      // Check for existing credentials
      const { data: creds, error: credsError } = await supabase
        .from('establishment_mp_credentials')
        .select('*')
        .eq('establishment_id', establishment.id)
        .maybeSingle();

      if (creds) {
        setIsConnected(true);
        setCredentials(creds);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      toast.error('Erro ao verificar conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectMP = async () => {
    if (!establishmentId) {
      toast.error('ID do estabelecimento não encontrado');
      return;
    }

    try {
      console.log('Buscando configurações do Mercado Pago...');
      
      // Buscar configurações do Mercado Pago
      const { data: config, error } = await supabase.functions.invoke('get-mp-config');

      console.log('Resposta da função:', { config, error });

      if (error) {
        console.error('Erro ao buscar configurações:', error);
        throw error;
      }

      if (!config || !config.clientId) {
        throw new Error('Configurações do Mercado Pago não encontradas');
      }

      const { clientId, redirectUri } = config;
      console.log('Client ID obtido:', clientId);
      
      const encodedRedirectUri = encodeURIComponent(redirectUri);
      
      const authUrl = `https://auth.mercadopago.com.br/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${establishmentId}&redirect_uri=${encodedRedirectUri}`;
      
      console.log('Redirecionando para:', authUrl);
      console.log('Client ID usado:', clientId);
      console.log('Redirect URI usado:', redirectUri);
      
      // Mostrar confirmação antes de redirecionar
      const confirmar = window.confirm(
        `Verificar configurações antes de continuar:\n\n` +
        `Client ID: ${clientId}\n` +
        `Redirect URI: ${redirectUri}\n\n` +
        `Confirme se o Client ID está correto no painel do Mercado Pago.\n\n` +
        `Clique OK para continuar ou Cancelar para verificar.`
      );
      
      if (confirmar) {
        window.location.href = authUrl;
      }
    } catch (error: any) {
      console.error('Erro ao conectar com Mercado Pago:', error);
      toast.error(error.message || 'Erro ao conectar com Mercado Pago. Verifique as configurações.');
    }
  };

  const handleDisconnect = async () => {
    if (!establishmentId) return;

    try {
      const { error } = await supabase
        .from('establishment_mp_credentials')
        .delete()
        .eq('establishment_id', establishmentId);

      if (error) throw error;

      setIsConnected(false);
      setCredentials(null);
      toast.success('Mercado Pago desconectado com sucesso');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Erro ao desconectar Mercado Pago');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Configuração de Pagamentos</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Mercado Pago</CardTitle>
            <CardDescription>
              Conecte sua conta do Mercado Pago para receber pagamentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnected ? (
              <>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Status: Conectado</p>
                  <p className="text-sm">
                    <strong>Seller ID:</strong> {credentials?.seller_id}
                  </p>
                  {credentials?.public_key && (
                    <p className="text-sm">
                      <strong>Public Key:</strong> {credentials.public_key.substring(0, 20)}...
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={handleDisconnect}>
                    Desconectar
                  </Button>
                  <Button onClick={() => navigate('/establishment-dashboard')}>
                    Voltar ao Dashboard
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Você ainda não conectou sua conta do Mercado Pago. 
                  Clique no botão abaixo para autorizar o acesso.
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleConnectMP}>
                    Conectar Mercado Pago
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/establishment-dashboard')}>
                    Voltar
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSetup;
