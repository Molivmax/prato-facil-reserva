import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, LinkIcon } from "lucide-react";

const MP_CLIENT_ID = 'TEST-fd2a4268-c4f7-4902-b349-c3f80ad8659c';

const PaymentSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<any>(null);

  useEffect(() => {
    checkConnection();
    
    const success = searchParams.get('success');
    if (success === 'true') {
      toast({
        title: "Conexão realizada!",
        description: "Sua conta do Mercado Pago foi conectada com sucesso.",
      });
    }
  }, [searchParams]);

  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/establishment-login');
        return;
      }

      const { data: establishments } = await supabase
        .from('establishments')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (establishments) {
        setEstablishmentId(establishments.id);

        const { data: creds } = await supabase
          .from('establishment_mp_credentials')
          .select('*')
          .eq('establishment_id', establishments.id)
          .single();

        if (creds) {
          setIsConnected(true);
          setCredentials(creds);
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectMP = () => {
    if (!establishmentId) {
      toast({
        title: "Erro",
        description: "Estabelecimento não encontrado",
        variant: "destructive",
      });
      return;
    }

    const redirectUri = `${window.location.origin}/mp-oauth-callback`;
    const authUrl = `https://auth.mercadopago.com.br/authorization?client_id=${MP_CLIENT_ID}&response_type=code&platform_id=mp&state=${establishmentId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    window.location.href = authUrl;
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
      toast({
        title: "Desconectado",
        description: "Sua conta do Mercado Pago foi desconectada.",
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desconectar a conta.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Configuração de Pagamento</h1>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isConnected ? (
                <><CheckCircle2 className="h-5 w-5 text-green-600" /> Conta Conectada</>
              ) : (
                <><LinkIcon className="h-5 w-5" /> Conectar Mercado Pago</>
              )}
            </CardTitle>
            <CardDescription>
              {isConnected 
                ? "Sua conta do Mercado Pago está conectada e pronta para receber pagamentos."
                : "Conecte sua conta do Mercado Pago para receber pagamentos dos clientes."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnected ? (
              <>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="text-sm"><strong>Seller ID:</strong> {credentials?.seller_id}</p>
                  <p className="text-sm"><strong>Status:</strong> <span className="text-green-600">Ativa</span></p>
                  {credentials?.public_key && (
                    <p className="text-sm"><strong>Public Key:</strong> {credentials.public_key.substring(0, 20)}...</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDisconnect} variant="destructive">
                    Desconectar Conta
                  </Button>
                  <Button onClick={() => navigate('/establishment-dashboard')} variant="outline">
                    Voltar ao Dashboard
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Como funciona:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Clique em "Conectar Mercado Pago"</li>
                    <li>Faça login na sua conta do Mercado Pago</li>
                    <li>Autorize o aplicativo a processar pagamentos</li>
                    <li>Pronto! Você receberá 97% de cada venda (3% de comissão do app)</li>
                  </ol>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleConnectMP} className="w-full">
                    Conectar Mercado Pago
                  </Button>
                  <Button onClick={() => navigate('/establishment-dashboard')} variant="outline">
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
