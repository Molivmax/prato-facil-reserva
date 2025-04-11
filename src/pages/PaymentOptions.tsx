
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, WalletCards, Banknote, Coins } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';

const PaymentOptions = () => {
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleContinue = () => {
    if (!paymentMethod) {
      toast({
        title: "Escolha um método de pagamento",
        description: "Por favor, selecione um método de pagamento para continuar",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    // Simula o processamento do pagamento
    setTimeout(() => {
      setIsProcessing(false);
      
      // Gera um ID de pedido simulado
      const orderId = "paid-order-" + Date.now();
      
      toast({
        title: "Pagamento confirmado!",
        description: "Seu pedido foi recebido pelo restaurante.",
      });
      
      // Simular envio de notificação ao restaurante quando estiver a 5min de distância
      toast({
        title: "Localização ativada",
        description: "O restaurante será notificado quando você estiver a 5 minutos de distância.",
      });
      
      navigate(`/check-in/${orderId}`);
    }, 1500);
  };

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
                <RadioGroupItem value="app" id="payment-app" />
                <Label htmlFor="payment-app" className="flex-1 cursor-pointer">
                  <div className="flex items-center">
                    <WalletCards className="h-5 w-5 text-blink-primary mr-3" />
                    <div>
                      <p className="font-medium text-white">Pagar pelo App</p>
                      <p className="text-sm text-gray-400">Use seu saldo ou cartões salvos no app</p>
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rounded-lg border border-white/10 p-4 cursor-pointer hover:bg-white/5 transition-colors">
                <RadioGroupItem value="micro-credit" id="payment-micro-credit" />
                <Label htmlFor="payment-micro-credit" className="flex-1 cursor-pointer">
                  <div className="flex items-center">
                    <Coins className="h-5 w-5 text-blink-primary mr-3" />
                    <div>
                      <p className="font-medium text-white">Micro Crédito Blink</p>
                      <p className="text-sm text-gray-400">Use seu limite de micro crédito disponível no app</p>
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
        
        <div className="space-y-4">
          <Button 
            className="w-full btn-sophisticated py-6"
            onClick={handleContinue}
            disabled={!paymentMethod || isProcessing}
          >
            {isProcessing ? "Processando..." : "Confirmar Pagamento"}
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
