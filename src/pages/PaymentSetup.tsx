
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Wallet, ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const PaymentSetup = () => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!selectedMethod) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma forma de pagamento",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Forma de pagamento salva",
      description: "Sua forma de pagamento foi configurada com sucesso!",
    });
    
    navigate('/search');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-black/70 p-4">
      <div className="container max-w-md mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6 text-white"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card className="bg-black/50 backdrop-blur-md border border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Configurar Pagamento</CardTitle>
            <CardDescription className="text-gray-400">
              Escolha sua forma de pagamento preferida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedMethod}
              onValueChange={setSelectedMethod}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2 rounded-lg border border-white/10 p-4 cursor-pointer hover:bg-white/5">
                <RadioGroupItem value="credit" id="payment-credit" />
                <Label htmlFor="payment-credit" className="flex-1 cursor-pointer">
                  <div className="flex items-center text-white">
                    <CreditCard className="h-5 w-5 mr-3 text-restaurant-primary" />
                    <div>
                      <p className="font-medium">Cartão de Crédito</p>
                      <p className="text-sm text-gray-400">Adicione um cartão de crédito</p>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 rounded-lg border border-white/10 p-4 cursor-pointer hover:bg-white/5">
                <RadioGroupItem value="wallet" id="payment-wallet" />
                <Label htmlFor="payment-wallet" className="flex-1 cursor-pointer">
                  <div className="flex items-center text-white">
                    <Wallet className="h-5 w-5 mr-3 text-restaurant-primary" />
                    <div>
                      <p className="font-medium">Carteira Digital</p>
                      <p className="text-sm text-gray-400">Configure sua carteira digital</p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            <div className="flex flex-col gap-3 mt-6">
              <Button
                className="w-full bg-blink-primary hover:bg-blink-primary/90 text-black font-semibold transition-colors"
                onClick={handleSubmit}
              >
                Configurar Agora
              </Button>
              
              <Button
                className="w-full bg-blink-primary hover:bg-blink-primary/80 text-black font-semibold transition-colors"
                onClick={() => navigate('/search')}
              >
                Deixar para depois
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSetup;
