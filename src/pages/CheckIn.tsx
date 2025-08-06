
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, Clock, Check, Bell, Utensils, Coffee, 
  ArrowDown, CircleCheck, QrCode
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';

const CheckIn = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCheckIn = () => {
    setIsProcessing(true);
    
    // Simula o processamento do check-in
    setTimeout(() => {
      setIsProcessing(false);
      setIsCheckedIn(true);
      
      toast({
        title: "Check-in realizado!",
        description: "Sua mesa está pronta. Dirija-se ao restaurante.",
      });
    }, 1500);
  };

  const handleViewOrder = () => {
    // Navega para a página de resumo do pedido
    navigate('/order-summary/latest');
  };

  return (
    <>
      <Navbar />
      <div className="container max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Check-in</h1>
        
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-24 h-24 bg-restaurant-light rounded-full flex items-center justify-center mb-4">
                {isCheckedIn 
                  ? <CircleCheck className="h-12 w-12 text-restaurant-primary" /> 
                  : <QrCode className="h-12 w-12 text-restaurant-primary" />
                }
              </div>
              <h2 className="text-xl font-bold mb-1">
                {isCheckedIn ? "Check-in Confirmado" : "Realize seu Check-in"}
              </h2>
              <p className="text-gray-600">
                {isCheckedIn 
                  ? "Dirija-se à sua mesa e aproveite sua refeição!" 
                  : "Ao chegar no restaurante, escaneie o QR code na entrada ou clique no botão abaixo."
                }
              </p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-restaurant-primary mr-3" />
                <div>
                  <p className="font-medium">Boteco Tal</p>
                  <p className="text-sm text-gray-500">Rua das Flores, 123</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Clock className="h-5 w-5 text-restaurant-primary mr-3" />
                <div>
                  <p className="font-medium">Horário da Reserva</p>
                  <p className="text-sm text-gray-500">Hoje, {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Utensils className="h-5 w-5 text-restaurant-primary mr-3" />
                <div>
                  <p className="font-medium">Mesa 2</p>
                  <p className="text-sm text-gray-500">4 pessoas</p>
                </div>
              </div>
            </div>
            
            {!isCheckedIn ? (
              <Button 
                className="w-full bg-restaurant-primary hover:bg-restaurant-dark mb-4"
                size="lg"
                onClick={handleCheckIn}
                disabled={isProcessing}
              >
                {isProcessing ? "Processando..." : "Fazer Check-in agora"}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="bg-restaurant-light p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Check className="h-5 w-5 text-restaurant-primary mr-2" />
                    <p className="font-medium">A cozinha já recebeu seu pedido!</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Seus pratos serão preparados e servidos conforme sua chegada.
                  </p>
                </div>
                
                <div className="flex space-x-4">
                  <Button 
                    className="flex-1"
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: "Atendente chamado",
                        description: "Um atendente virá até sua mesa em breve.",
                      });
                    }}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Chamar Garçom
                  </Button>
                  
                  <Button 
                    className="flex-1 bg-restaurant-primary hover:bg-restaurant-dark"
                    onClick={handleViewOrder}
                  >
                    <Coffee className="h-4 w-4 mr-2" />
                    Ver Pedido
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="text-center space-y-4">
          <h3 className="font-medium">Procedimento para Check-in</h3>
          <div className="space-y-2">
            <div className="flex items-start">
              <div className="bg-restaurant-primary text-white rounded-full w-6 h-6 flex items-center justify-center shrink-0 mr-3 mt-0.5">
                1
              </div>
              <p className="text-sm text-gray-600 text-left">
                Ao chegar no restaurante, utilize o código QR na entrada
              </p>
            </div>
            
            <div className="flex items-center justify-center my-2">
              <ArrowDown className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="flex items-start">
              <div className="bg-restaurant-primary text-white rounded-full w-6 h-6 flex items-center justify-center shrink-0 mr-3 mt-0.5">
                2
              </div>
              <p className="text-sm text-gray-600 text-left">
                A cozinha será notificada e começará a preparar seu pedido
              </p>
            </div>
            
            <div className="flex items-center justify-center my-2">
              <ArrowDown className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="flex items-start">
              <div className="bg-restaurant-primary text-white rounded-full w-6 h-6 flex items-center justify-center shrink-0 mr-3 mt-0.5">
                3
              </div>
              <p className="text-sm text-gray-600 text-left">
                Dirija-se à sua mesa reservada e aguarde o garçom servir seu pedido
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckIn;
