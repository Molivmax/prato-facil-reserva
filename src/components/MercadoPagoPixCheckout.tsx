import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MercadoPagoPixCheckoutProps {
  amount: number;
  orderId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const MercadoPagoPixCheckout = ({ amount, orderId, onSuccess, onCancel }: MercadoPagoPixCheckoutProps) => {
  const [loading, setLoading] = useState(true);
  const [pixData, setPixData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    initMercadoPago();
  }, []);

  const initMercadoPago = async () => {
    try {
      setLoading(true);
      
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Você precisa estar logado');
      }

      console.log('Iniciando pagamento PIX para pedido:', orderId);

      // Call edge function to create PIX payment
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          amount,
          orderId,
          paymentMethod: 'pix',
          orderDetails: [], // Adicionar detalhes vazios por enquanto
          restaurantId: 'temp', // Será preenchido pela edge function
          tableId: 0 // Será preenchido pela edge function
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      console.log('Resposta do process-payment:', data);
      console.log('Erro do process-payment:', error);

      if (error) {
        console.error('Erro na invocação:', error);
        throw new Error(error.message || 'Erro ao processar pagamento');
      }

      if (data?.success === false || data?.error) {
        console.error('Erro retornado pela função:', data.error);
        throw new Error(data.error || 'Erro ao processar pagamento');
      }
      
      if (data?.pixData) {
        console.log('PIX data recebido:', data.pixData);
        setPixData({
          qrCode: data.pixData.qrCode,
          qrCodeText: data.pixData.qrCodeText,
          paymentId: data.pixData.paymentId,
        });
      } else {
        console.error('Dados do PIX não encontrados na resposta:', data);
        throw new Error('Dados do PIX não recebidos. Verifique a configuração do Mercado Pago.');
      }
    } catch (error: any) {
      console.error('Erro ao inicializar Mercado Pago:', error);
      toast({
        title: "Erro no PIX",
        description: error.message || "Não foi possível gerar o código PIX. Verifique se o Mercado Pago está configurado.",
        variant: "destructive",
      });
      setPixData(null); // Garantir que o estado está limpo
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = async () => {
    if (pixData?.qrCodeText) {
      try {
        await navigator.clipboard.writeText(pixData.qrCodeText);
        setCopied(true);
        toast({
          title: "Código copiado!",
          description: "Cole no seu app de pagamento para finalizar.",
        });
        setTimeout(() => setCopied(false), 3000);
      } catch (error) {
        toast({
          title: "Erro ao copiar",
          description: "Tente novamente",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <Card className="bg-black/50 backdrop-blur-md border border-white/10">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-blink-primary mb-4" />
          <p className="text-white">Gerando código PIX...</p>
        </CardContent>
      </Card>
    );
  }

  if (!pixData) {
    return (
      <Card className="bg-black/50 backdrop-blur-md border border-white/10">
        <CardContent className="p-6">
          <p className="text-white text-center mb-4">Erro ao gerar código PIX</p>
          <Button 
            onClick={onCancel}
            variant="outline"
            className="w-full border-white/20 bg-transparent text-white hover:bg-white/10"
          >
            Voltar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/50 backdrop-blur-md border border-white/10">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-white text-center mb-4">
          Pagar com PIX
        </h3>
        
        <div className="bg-white p-4 rounded-lg mb-4">
          {pixData.qrCode && (
            <img 
              src={`data:image/png;base64,${pixData.qrCode}`}
              alt="QR Code PIX"
              className="w-full max-w-[250px] mx-auto"
            />
          )}
        </div>

        <div className="space-y-3">
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Código PIX Copia e Cola</p>
            <p className="text-white text-xs break-all font-mono">
              {pixData.qrCodeText?.substring(0, 50)}...
            </p>
          </div>

          <Button
            onClick={copyPixCode}
            className="w-full bg-blink-primary text-black hover:bg-blink-primary/90 font-semibold"
          >
            {copied ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copiar código PIX
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">
              Total: R$ {amount.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              Após o pagamento, seu pedido será confirmado automaticamente
            </p>
          </div>

          <Button
            onClick={onCancel}
            variant="outline"
            className="w-full border-white/20 bg-transparent text-white hover:bg-white/10"
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MercadoPagoPixCheckout;
