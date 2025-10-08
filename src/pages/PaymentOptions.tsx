
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, WalletCards, Banknote, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MercadoPagoPixCheckout from '@/components/MercadoPagoPixCheckout';

const PaymentOptions = () => {
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [showPixCheckout, setShowPixCheckout] = useState(false);
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch order details from Supabase
  useEffect(() => {
    const getOrderDetails = async () => {
      if (!orderId) {
        toast({
          title: "Erro",
          description: "ID do pedido não encontrado",
          variant: "destructive",
        });
        return;
      }

      try {
        const { data: order, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (error) {
          console.error("Erro ao buscar pedido:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os detalhes do pedido",
            variant: "destructive",
          });
          return;
        }

        if (order) {
          setOrderDetails({
            items: order.items,
            restaurantId: order.establishment_id,
            tableId: order.table_number,
            total: order.total_amount
          });
        }
      } catch (err) {
        console.error("Erro ao buscar detalhes do pedido:", err);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes do pedido",
          variant: "destructive",
        });
      }
    };
    
    getOrderDetails();
  }, [orderId, toast]);

  const handleContinue = async () => {
    if (!paymentMethod) {
      toast({
        title: "Escolha um método de pagamento",
        description: "Por favor, selecione um método de pagamento para continuar",
        variant: "destructive",
      });
      return;
    }

    if (!orderDetails) {
      toast({
        title: "Erro no pedido",
        description: "Não foi possível carregar os detalhes do pedido",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Obter a sessão do usuário
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Você precisa estar logado para continuar");
      }
      
      // Chamar a função edge do Supabase para processar o pagamento
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          amount: orderDetails.total,
          orderDetails: orderDetails.items,
          restaurantId: orderDetails.restaurantId,
          tableId: orderDetails.tableId,
          paymentMethod: paymentMethod,
          orderId: orderId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) {
        throw new Error(error.message || "Erro ao processar o pagamento");
      }
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Processar a resposta com base no método de pagamento
      if (paymentMethod === "pix") {
        // Para PIX, mostrar o componente de checkout
        setShowPixCheckout(true);
        setIsProcessing(false);
        return;
      } else if (paymentMethod === "credit") {
        // Para pagamento com cartão
        toast({
          title: "Pagamento confirmado!",
          description: "Seu pedido foi recebido pelo restaurante.",
        });
        
        navigate(`/order-tracking/${data.orderId || orderId}`);
      } else if (paymentMethod === "pindura") {
        // Para pagamento via "pindura" (mini crédito)
        toast({
          title: "Pindura confirmada!",
          description: "Você pagará quando usar o app novamente.",
        });
        
        navigate(`/order-tracking/${data.orderId || orderId}`);
      } else if (paymentMethod === "local") {
        // Para pagamento no local
        toast({
          title: "Pedido confirmado!",
          description: "Você pagará diretamente no estabelecimento.",
        });
        
        navigate(`/order-tracking/${data.orderId || orderId}`);
      }
      
      // Simular envio de notificação ao restaurante quando estiver a 5min de distância
      toast({
        title: "Localização ativada",
        description: "O restaurante será notificado quando você estiver a 5 minutos de distância.",
      });
    } catch (err: any) {
      console.error("Erro no pagamento:", err);
      setError(err.message || "Houve um erro ao processar o pagamento. Tente novamente.");
      toast({
        title: "Erro no pagamento",
        description: err.message || "Houve um erro ao processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!orderDetails) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="container max-w-md mx-auto px-4 py-6 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blink-primary" />
          <p className="ml-2 text-white">Carregando detalhes do pedido...</p>
        </div>
      </div>
    );
  }

  if (showPixCheckout) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="container max-w-md mx-auto px-4 py-6">
          <MercadoPagoPixCheckout
            amount={orderDetails.total}
            orderId={orderId!}
            onSuccess={() => {
              toast({
                title: "Pagamento confirmado!",
                description: "Seu pedido foi recebido pelo restaurante.",
              });
              navigate(`/order-tracking/${orderId}`);
            }}
            onCancel={() => setShowPixCheckout(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="container max-w-md mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          className="mb-4 text-white hover:bg-white/10"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <h1 className="text-2xl font-bold mb-6 text-white">Opções de Pagamento</h1>
        
        <Card className="mb-6 bg-black/50 backdrop-blur-md border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
          <CardContent className="p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Resumo do Pedido</h2>
              <div className="space-y-2">
                {orderDetails.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-gray-300">
                    <span>{item.quantity}x {item.name}</span>
                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-600 pt-2 flex justify-between font-semibold text-white">
                  <span>Total</span>
                  <span>R$ {orderDetails.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-8 bg-black/50 backdrop-blur-md border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
          <CardContent className="p-6">
            <RadioGroup
              value={paymentMethod || ""}
              onValueChange={setPaymentMethod}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2 rounded-lg border border-white/10 p-4 cursor-pointer hover:bg-white/5 transition-colors">
                <RadioGroupItem value="credit" id="payment-credit" />
                <Label htmlFor="payment-credit" className="flex-1 cursor-pointer">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-blink-primary mr-3" />
                    <div>
                      <p className="font-medium text-white">Cartão de Crédito</p>
                      <p className="text-sm text-gray-400">Pague agora e tenha seu pedido aprovado imediatamente</p>
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rounded-lg border border-white/10 p-4 cursor-pointer hover:bg-white/5 transition-colors">
                <RadioGroupItem value="pix" id="payment-pix" />
                <Label htmlFor="payment-pix" className="flex-1 cursor-pointer">
                  <div className="flex items-center">
                    <WalletCards className="h-5 w-5 text-blink-primary mr-3" />
                    <div>
                      <p className="font-medium text-white">PIX</p>
                      <p className="text-sm text-gray-400">Pagamento instantâneo via PIX</p>
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rounded-lg border border-white/10 p-4 cursor-pointer hover:bg-white/5 transition-colors">
                <RadioGroupItem value="pindura" id="payment-pindura" />
                <Label htmlFor="payment-pindura" className="flex-1 cursor-pointer">
                  <div className="flex items-center">
                    <Banknote className="h-5 w-5 text-blink-primary mr-3" />
                    <div>
                      <p className="font-medium text-white">Pindura</p>
                      <p className="text-sm text-gray-400">Mini crédito do app - pague depois</p>
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rounded-lg border border-white/10 p-4 cursor-pointer hover:bg-white/5 transition-colors">
                <RadioGroupItem value="local" id="payment-local" />
                <Label htmlFor="payment-local" className="flex-1 cursor-pointer">
                  <div className="flex items-center">
                    <Banknote className="h-5 w-5 text-blink-primary mr-3" />
                    <div>
                      <p className="font-medium text-white">Pagar no Local</p>
                      <p className="text-sm text-gray-400">Pague com dinheiro, cartão ou Pix no restaurante</p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-md text-white">
            <p>{error}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <Button 
            className="w-full bg-blink-primary text-black hover:bg-blink-primary/90 py-6 font-semibold"
            onClick={handleContinue}
            disabled={!paymentMethod || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Confirmar Pagamento"
            )}
          </Button>
          
          <Button 
            className="w-full bg-blink-primary text-black hover:bg-blink-primary/80 py-6 font-semibold transition-colors"
            onClick={() => navigate(-1)}
            disabled={isProcessing}
          >
            Deixar para depois
          </Button>
          
          <p className="text-center text-sm text-gray-400">
            Ao confirmar o pagamento, você concorda com os Termos e Condições e a Política de Privacidade do Blink.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentOptions;
