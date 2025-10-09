import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Plus, Clock, CheckCircle, QrCode } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const OrderTracking = () => {
  const { orderId } = useParams();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [estimatedArrival, setEstimatedArrival] = useState<string>('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadOrderDetails = async () => {
      try {
        // Verificar se o usuário está logado
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast({
            title: "Acesso negado",
            description: "Você precisa estar logado para ver seus pedidos",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }

        if (orderId === 'latest') {
          // Buscar o pedido mais recente do usuário
          const { data: latestOrder, error: latestError } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestError) {
            console.error('Erro ao buscar pedido:', latestError);
            throw new Error('Nenhum pedido encontrado');
          }

          if (!latestOrder) {
            toast({
              title: "Nenhum pedido encontrado",
              description: "Você ainda não fez nenhum pedido",
            });
            navigate('/');
            return;
          }

          // Buscar dados do estabelecimento
          const { data: establishment } = await supabase
            .from('establishments')
            .select('name')
            .eq('id', latestOrder.establishment_id)
            .maybeSingle();

          setOrderDetails({
            ...latestOrder,
            establishments: establishment ? { name: establishment.name } : null
          });
        } else if (orderId) {
          // Buscar detalhes do pedido específico
          const { data: order, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (error) {
            console.error('Erro ao buscar pedido:', error);
            throw new Error('Pedido não encontrado');
          }

          if (!order) {
            toast({
              title: "Pedido não encontrado",
              description: "Este pedido não existe ou você não tem permissão para visualizá-lo",
            });
            navigate('/');
            return;
          }

          // Buscar dados do estabelecimento
          const { data: establishment } = await supabase
            .from('establishments')
            .select('name')
            .eq('id', order.establishment_id)
            .maybeSingle();

          setOrderDetails({
            ...order,
            establishments: establishment ? { name: establishment.name } : null
          });
        }
      } catch (error) {
        console.error('Erro ao carregar pedido:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes do pedido",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetails();
  }, [orderId, navigate, toast]);

  const handleEnableLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Atualizar localização no pedido
            if (orderId) {
              const { error } = await supabase
                .from('orders')
                .update({
                  customer_location: { latitude, longitude },
                  estimated_arrival_time: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutos
                })
                .eq('id', orderId);

              if (error) {
                console.error('Erro ao atualizar localização:', error);
              }
            }

            setLocationEnabled(true);
            setEstimatedArrival('15 minutos');
            
            toast({
              title: "Localização ativada!",
              description: "O restaurante será notificado quando você estiver próximo.",
            });
          } catch (error) {
            console.error('Erro ao atualizar localização:', error);
            toast({
              title: "Erro",
              description: "Não foi possível ativar a localização",
              variant: "destructive",
            });
          }
        },
        (error) => {
          toast({
            title: "Erro de localização",
            description: "Não foi possível acessar sua localização. Verifique as permissões.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Geolocalização não suportada",
        description: "Seu navegador não suporta geolocalização",
        variant: "destructive",
      });
    }
  };

  const handleAddMoreItems = () => {
    if (orderDetails?.establishment_id || orderDetails?.restaurantId) {
      const restaurantId = orderDetails.establishment_id || orderDetails.restaurantId;
      navigate(`/restaurant/${restaurantId}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="container max-w-md mx-auto px-4 py-6 flex justify-center">
          <div className="animate-pulse w-full">
            <div className="h-8 bg-gray-700 rounded w-1/2 mb-6"></div>
            <div className="h-40 bg-gray-700 rounded mb-6"></div>
            <div className="h-20 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="container max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 text-white">Seu Pedido</h1>
        
        {/* Status do Pedido */}
        <Card className="mb-6 bg-black/50 backdrop-blur-md border border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
              <div>
                <h2 className="text-lg font-semibold text-white">Pedido Confirmado</h2>
                <p className="text-gray-400">
                  {orderDetails?.establishments?.name || orderDetails?.restaurantName} • Mesa {orderDetails?.table_number || orderDetails?.tableNumber}
                </p>
              </div>
            </div>
            
            {orderDetails?.payment_status === 'pindura' && (
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 mb-4">
                <p className="text-blue-300 text-sm">
                  💳 Pagamento: Pindura (você pagará no restaurante)
                </p>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-semibold text-white mb-2">Itens do Pedido:</h3>
              {orderDetails?.items?.map((item: any, index: number) => (
                <div key={index} className="flex justify-between text-gray-300">
                  <span>{item.quantity}x {item.name}</span>
                  <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-600 pt-2 mt-3 flex justify-between font-semibold text-white">
                <span>Total</span>
                <span>R$ {(orderDetails?.total_amount || orderDetails?.total)?.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Localização */}
        <Card className="mb-6 bg-black/50 backdrop-blur-md border border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <MapPin className="h-6 w-6 text-blink-primary mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Localização</h3>
                  <p className="text-gray-400">
                    {locationEnabled ? 'Ativada' : 'Desativada'}
                  </p>
                </div>
              </div>
              {estimatedArrival && (
                <div className="text-right">
                  <div className="flex items-center text-green-400">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-sm">{estimatedArrival}</span>
                  </div>
                  <p className="text-xs text-gray-500">tempo estimado</p>
                </div>
              )}
            </div>

            {!locationEnabled ? (
              <div>
                <p className="text-gray-400 text-sm mb-4">
                  Ative sua localização para que o restaurante saiba quando você está chegando e prepare seu pedido.
                </p>
                <Button 
                  className="w-full bg-blink-primary text-black hover:bg-blink-primary/90 font-semibold mb-3"
                  onClick={handleEnableLocation}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Ir Agora - Ativar Localização
                </Button>
                <Button 
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                  onClick={() => navigate(`/check-in/${orderId}`)}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Fazer Check-in
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3">
                  <p className="text-green-300 text-sm">
                    ✓ O restaurante será notificado quando você estiver próximo!
                  </p>
                </div>
                <Button 
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                  onClick={() => navigate(`/check-in/${orderId}`)}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Fazer Check-in
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Adicionar Mais Itens */}
        <Card className="mb-6 bg-black/50 backdrop-blur-md border border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Plus className="h-6 w-6 text-blink-primary mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Adicionar Mais</h3>
                  <p className="text-gray-400">Quer pedir mais alguma coisa?</p>
                </div>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full border-white/20 text-white hover:bg-white/10"
              onClick={handleAddMoreItems}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Mais Itens
            </Button>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Esta será sua página inicial quando abrir o app
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;