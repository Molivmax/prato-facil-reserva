
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
      
      navigate(`/check-in/${orderId}`);
    }, 1500);
  };

  return (
    <>
      <Navbar />
      <div className="container max-w-md mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <h1 className="text-2xl font-bold mb-6">Opções de Pagamento</h1>
        
        <Card className="mb-8">
          <CardContent className="p-6">
            <RadioGroup
              value={paymentMethod || ""}
              onValueChange={setPaymentMethod}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="credit" id="payment-credit" />
                <Label htmlFor="payment-credit" className="flex-1 cursor-pointer">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-blink-primary mr-3" />
                    <div>
                      <p className="font-medium">Cartão de Crédito</p>
                      <p className="text-sm text-gray-500">Pague agora e tenha seu pedido aprovado imediatamente</p>
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="app" id="payment-app" />
                <Label htmlFor="payment-app" className="flex-1 cursor-pointer">
                  <div className="flex items-center">
                    <WalletCards className="h-5 w-5 text-blink-primary mr-3" />
                    <div>
                      <p className="font-medium">Pagar pelo App</p>
                      <p className="text-sm text-gray-500">Use seu saldo ou cartões salvos no app</p>
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="micro-credit" id="payment-micro-credit" />
                <Label htmlFor="payment-micro-credit" className="flex-1 cursor-pointer">
                  <div className="flex items-center">
                    <Coins className="h-5 w-5 text-blink-primary mr-3" />
                    <div>
                      <p className="font-medium">Micro Crédito Blink</p>
                      <p className="text-sm text-gray-500">Use seu limite de micro crédito disponível no app</p>
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="local" id="payment-local" />
                <Label htmlFor="payment-local" className="flex-1 cursor-pointer">
                  <div className="flex items-center">
                    <Banknote className="h-5 w-5 text-blink-primary mr-3" />
                    <div>
                      <p className="font-medium">Pagar no Local</p>
                      <p className="text-sm text-gray-500">Pague com dinheiro, cartão ou Pix no restaurante</p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          <Button 
            className="w-full bg-blink-primary hover:bg-blink-secondary hover:text-white text-blink-text"
            size="lg"
            onClick={handleContinue}
            disabled={!paymentMethod || isProcessing}
          >
            {isProcessing ? "Processando..." : "Confirmar Pagamento"}
          </Button>
          
          <p className="text-center text-sm text-gray-500">
            Ao confirmar o pagamento, você concorda com os Termos e Condições e a Política de Privacidade do Blink.
          </p>
        </div>
      </div>
    </>
  );
};

export default PaymentOptions;
