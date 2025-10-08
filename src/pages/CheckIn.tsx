
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, Clock, Check, Bell, Utensils, Coffee, 
  ArrowDown, CircleCheck, QrCode
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CheckIn = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadLatestOrder = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setLoading(false);
          return;
        }

        const { data: latestOrder } = await supabase
          .from('orders')
          .select('*, establishments(name, address, city, state, zip_code)')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestOrder) {
          setOrderDetails(latestOrder);
        }
      } catch (error) {
        console.error('Erro ao carregar pedido:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLatestOrder();
  }, []);

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
      <div className="container max-w-md mx-auto px-4 py-6 bg-background min-h-screen">
        <h1 className="text-2xl font-bold mb-6 text-center text-blink-primary">Check-in</h1>
        
        <Card className="mb-8 bg-black/50 backdrop-blur-md border border-white/10">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-24 h-24 bg-blink-primary/20 rounded-full flex items-center justify-center mb-4">
                {isCheckedIn 
                  ? <CircleCheck className="h-12 w-12 text-blink-primary" /> 
                  : <QrCode className="h-12 w-12 text-blink-primary" />
                }
              </div>
              <h2 className="text-xl font-bold mb-1 text-white">
                {isCheckedIn ? "Check-in Confirmado" : "Realize seu Check-in"}
              </h2>
              <p className="text-gray-400">
                {isCheckedIn 
                  ? "Dirija-se à sua mesa e aproveite sua refeição!" 
                  : "Ao chegar no restaurante, escaneie o QR code na entrada ou clique no botão abaixo."
                }
              </p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center p-3 bg-white/5 border border-white/10 rounded-lg">
                <MapPin className="h-5 w-5 text-blink-primary mr-3" />
                <div>
                  <p className="font-medium text-white">
                    {orderDetails?.establishments?.name || 'Carregando...'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {orderDetails?.establishments?.address 
                      ? `${orderDetails.establishments.address}${orderDetails.establishments.city ? `, ${orderDetails.establishments.city}` : ''}${orderDetails.establishments.state ? ` - ${orderDetails.establishments.state}` : ''}`
                      : 'Endereço não disponível'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-white/5 border border-white/10 rounded-lg">
                <Clock className="h-5 w-5 text-blink-primary mr-3" />
                <div>
                  <p className="font-medium text-white">Horário da Reserva</p>
                  <p className="text-sm text-gray-400">Hoje, {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-white/5 border border-white/10 rounded-lg">
                <Utensils className="h-5 w-5 text-blink-primary mr-3" />
                <div>
                  <p className="font-medium text-white">
                    Mesa {orderDetails?.table_number || '-'}
                  </p>
                  <p className="text-sm text-gray-400">Sua reserva</p>
                </div>
              </div>
            </div>
            
            {!isCheckedIn ? (
              <Button 
                className="w-full bg-blink-primary hover:bg-blink-primary/90 text-black font-semibold mb-4"
                size="lg"
                onClick={handleCheckIn}
                disabled={isProcessing}
              >
                {isProcessing ? "Processando..." : "Fazer Check-in agora"}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Check className="h-5 w-5 text-blink-primary mr-2" />
                    <p className="font-medium text-white">A cozinha já recebeu seu pedido!</p>
                  </div>
                  <p className="text-sm text-gray-400">
                    Seus pratos serão preparados e servidos conforme sua chegada.
                  </p>
                </div>
                
                <div className="flex space-x-4">
                  <Button 
                    className="flex-1 border-white/20 bg-transparent text-white hover:bg-white/10"
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
                    className="flex-1 bg-blink-primary hover:bg-blink-primary/90 text-black font-semibold"
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
          <h3 className="font-medium text-white">Procedimento para Check-in</h3>
          <div className="space-y-2">
            <div className="flex items-start">
              <div className="bg-blink-primary text-black rounded-full w-6 h-6 flex items-center justify-center shrink-0 mr-3 mt-0.5 font-semibold">
                1
              </div>
              <p className="text-sm text-gray-400 text-left">
                Ao chegar no restaurante, utilize o código QR na entrada
              </p>
            </div>
            
            <div className="flex items-center justify-center my-2">
              <ArrowDown className="h-5 w-5 text-gray-500" />
            </div>
            
            <div className="flex items-start">
              <div className="bg-blink-primary text-black rounded-full w-6 h-6 flex items-center justify-center shrink-0 mr-3 mt-0.5 font-semibold">
                2
              </div>
              <p className="text-sm text-gray-400 text-left">
                A cozinha será notificada e começará a preparar seu pedido
              </p>
            </div>
            
            <div className="flex items-center justify-center my-2">
              <ArrowDown className="h-5 w-5 text-gray-500" />
            </div>
            
            <div className="flex items-start">
              <div className="bg-blink-primary text-black rounded-full w-6 h-6 flex items-center justify-center shrink-0 mr-3 mt-0.5 font-semibold">
                3
              </div>
              <p className="text-sm text-gray-400 text-left">
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
