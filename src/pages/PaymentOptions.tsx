
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
import CreditCardForm from '@/components/CreditCardForm';

const PaymentOptions = () => {
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [showPixCheckout, setShowPixCheckout] = useState(false);
  const [showCreditCardForm, setShowCreditCardForm] = useState(false);
  const [showPixForm, setShowPixForm] = useState(false);
  const [cpf, setCpf] = useState('');
  const [name, setName] = useState('');
  const [hasOnlinePayment, setHasOnlinePayment] = useState(false);
  const [additionalPayment, setAdditionalPayment] = useState<{
    amount: number;
    itemsAdded: number;
    timestamp: string;
  } | null>(null);
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Debug: Monitor showPixCheckout changes
  useEffect(() => {
    console.log('🔄 PaymentOptions - showPixCheckout:', showPixCheckout);
    if (!showPixCheckout) {
      console.log('⚠️ showPixCheckout foi definido como false');
      console.trace('Stack trace do fechamento');
    }
  }, [showPixCheckout]);

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
        console.log('📦 Pedido carregado do banco:', order);
        
        // ✅ Validação do order.id
        if (!order.id) {
          console.error('❌ Pedido sem ID!', order);
          toast({
            title: "Erro",
            description: "Pedido sem ID válido. Tente novamente.",
            variant: "destructive",
          });
          return;
        }

        // Verificar se existe pagamento adicional
        const storedAddition = localStorage.getItem('additionalPayment');
        if (storedAddition) {
          try {
            const additionData = JSON.parse(storedAddition);
            setAdditionalPayment(additionData);
            console.log('💰 Pagamento adicional detectado:', additionData);
            // Limpar imediatamente após capturar
            localStorage.removeItem('additionalPayment');
          } catch (e) {
            console.error('Erro ao parsear additionalPayment:', e);
          }
        }
        
        const details = {
          id: order.id,
          items: order.items,
          restaurantId: order.establishment_id,
          tableId: order.table_number,
          total: order.total_amount
        };
        
        console.log('✅ orderDetails criado:', details);
        setOrderDetails(details);
          
        // Pagamentos online sempre disponíveis (usando credenciais da plataforma)
        setHasOnlinePayment(true);
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

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
  };

  const handleContinue = async () => {
    console.log('🔍 handleContinue iniciado');
    console.log('🔍 paymentMethod:', paymentMethod);
    console.log('🔍 orderDetails:', orderDetails);
    console.log('🔍 orderDetails.id:', orderDetails?.id);
    
    if (!paymentMethod) {
      console.error('❌ Nenhum método de pagamento selecionado');
      toast({
        title: "Selecione um método de pagamento",
        variant: "destructive",
      });
      return;
    }

    if (!orderDetails?.id) {
      console.error('❌ orderDetails.id não encontrado:', orderDetails);
      toast({
        title: "Erro ao processar pedido",
        description: "ID do pedido não encontrado",
        variant: "destructive",
      });
      return;
    }
    
    console.log('✅ Validações passaram, método:', paymentMethod);

    if (paymentMethod === "credit") {
      setShowCreditCardForm(true);
      return;
    }

    if (paymentMethod === "pix") {
      // Ir direto para o checkout PIX (sem formulário duplicado)
      setShowPixCheckout(true);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      if (paymentMethod === 'pindura') {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            payment_method: 'pindura',
            payment_status: 'pending'
          })
          .eq('id', orderDetails.id);

        if (updateError) throw updateError;

        toast({
          title: "Pedido registrado!",
          description: "Você poderá pagar depois.",
        });
        navigate(`/order-tracking/${orderId}`);
      } else if (paymentMethod === 'local') {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            payment_method: 'pay_at_location',
            payment_status: 'pending'
          })
          .eq('id', orderDetails.id);

        if (updateError) throw updateError;

        toast({
          title: "Pedido confirmado!",
          description: "Pague no estabelecimento.",
        });
        navigate(`/order-tracking/${orderId}`);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
      toast({
        title: "Erro no pagamento",
        description: err instanceof Error ? err.message : 'Tente novamente',
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

  if (showCreditCardForm) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="container max-w-md mx-auto px-4 py-6">
          <Button 
            variant="ghost" 
            className="mb-4 text-white hover:bg-white/10"
            onClick={() => setShowCreditCardForm(false)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <CreditCardForm
            amount={additionalPayment?.amount || orderDetails.total}
            orderId={orderId!}
            restaurantId={orderDetails.restaurantId}
            onSuccess={() => {
              toast({
                title: "Pagamento confirmado!",
                description: "Seu pedido foi recebido pelo restaurante.",
              });
              navigate(`/order-tracking/${orderId}`);
            }}
            onCancel={() => setShowCreditCardForm(false)}
          />
        </div>
      </div>
    );
  }

  if (showPixCheckout) {
    return (
      <div className="bg-background min-h-screen" onClick={(e) => e.stopPropagation()}>
        <Navbar />
        <div className="container max-w-md mx-auto px-4 py-6">
          <MercadoPagoPixCheckout
            amount={additionalPayment?.amount || orderDetails.total}
            orderId={orderId!}
            onSuccess={() => {
              console.log('✅ MercadoPago onSuccess chamado');
              toast({
                title: "Pagamento confirmado!",
                description: "Seu pedido foi recebido pelo restaurante.",
              });
              navigate(`/order-tracking/${orderId}`);
            }}
            onCancel={() => {
              console.log('❌ MercadoPago onCancel chamado');
              console.trace('Stack trace do cancelamento');
              setShowPixCheckout(false);
            }}
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
              <h2 className="text-lg font-semibold text-white">
                {additionalPayment ? (
                  <>
                    Itens Adicionados
                    <span className="text-sm font-normal text-gray-400 ml-2">
                      ({additionalPayment.itemsAdded} {additionalPayment.itemsAdded === 1 ? 'item' : 'itens'})
                    </span>
                  </>
                ) : (
                  'Resumo do Pedido'
                )}
              </h2>
              <div className="space-y-2">
                {orderDetails.items.map((item: any, index: number) => (
                  <div key={`${item.menuItemId}-${index}`} className="flex justify-between text-gray-300">
                    <span>{item.quantity}x {item.name}</span>
                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-600 pt-2 flex justify-between font-semibold text-white">
                  <span>{additionalPayment ? 'Valor Adicional' : 'Total'}</span>
                  <span className="text-blink-primary">
                    R$ {(additionalPayment?.amount || orderDetails.total).toFixed(2)}
                  </span>
                </div>
                {additionalPayment && (
                  <p className="text-sm text-gray-400 italic mt-2">
                    Total do pedido completo: R$ {orderDetails.total.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-8 bg-black/50 backdrop-blur-md border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
          <CardContent className="p-6">
            {showPixForm ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Dados para pagamento PIX</h3>
                
                <div>
                  <Label htmlFor="name" className="text-white">Nome completo</Label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blink-primary"
                  />
                </div>

                <div>
                  <Label htmlFor="cpf" className="text-white">CPF</Label>
                  <input
                    id="cpf"
                    type="text"
                    value={cpf}
                    onChange={handleCPFChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blink-primary"
                  />
                </div>

                <Button
                  variant="outline"
                  className="w-full border-white/20 bg-transparent text-white hover:bg-white/10"
                  onClick={() => {
                    setShowPixForm(false);
                    setPaymentMethod(null);
                  }}
                >
                  Voltar
                </Button>
              </div>
            ) : (
              <>
                <RadioGroup
                  value={paymentMethod || ""}
                  onValueChange={(value) => {
                    console.log('🔘 RadioGroup - Método de pagamento selecionado:', value);
                    console.log('🔘 Valor anterior:', paymentMethod);
                    setPaymentMethod(value);
                    console.log('✅ paymentMethod atualizado para:', value);
                  }}
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
              </>
            )}
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
