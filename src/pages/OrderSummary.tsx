import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Users, Phone, Loader2, Bell, Plus, LogOut 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const OrderSummary = () => {
  const [order, setOrder] = useState<any>(null);
  const [establishment, setEstablishment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [callingWaiter, setCallingWaiter] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { orderId } = useParams();

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId) {
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        
        // Buscar dados do pedido
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError) throw orderError;

        if (!orderData) {
          toast({
            title: "Pedido não encontrado",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        // Buscar dados do estabelecimento
        const { data: establishmentData, error: establishmentError } = await supabase
          .from('establishments')
          .select('*')
          .eq('id', orderData.establishment_id)
          .single();

        if (establishmentError) throw establishmentError;

        setOrder(orderData);
        setEstablishment(establishmentData);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        toast({
          title: "Erro ao carregar pedido",
          description: "Não foi possível carregar os dados do pedido",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId, navigate, toast]);

  const handleCallWaiter = async () => {
    if (!order) return;
    
    setCallingWaiter(true);
    
    try {
      const { error } = await supabase
        .from('customer_notifications')
        .insert({
          order_id: order.id,
          establishment_id: order.establishment_id,
          notification_type: 'call_waiter',
          message: `Cliente da mesa ${order.table_number} solicitou atendimento`,
          table_number: order.table_number,
        });

      if (error) throw error;

      toast({
        title: "Garçom chamado!",
        description: "Um atendente virá até sua mesa em breve.",
      });
    } catch (error) {
      console.error('Erro ao chamar garçom:', error);
      toast({
        title: "Erro",
        description: "Não foi possível chamar o garçom. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setCallingWaiter(false);
    }
  };

  const handleAddItems = () => {
    if (establishment) {
      navigate(`/menu-selection/${establishment.id}/${order.table_number}`);
    }
  };

  const handleFinalize = () => {
    navigate(`/complete-service/${orderId}`);
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="container max-w-md mx-auto px-4 py-6 flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!order || !establishment) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="container max-w-md mx-auto px-4 py-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <p className="text-foreground mb-4">Pedido não encontrado</p>
              <Button onClick={() => navigate('/')}>Voltar ao início</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const orderItems = Array.isArray(order.items) ? order.items : [];
  const totalAmount = Number(order.total_amount) || 0;

  return (
    <>
      <Navbar />
      <div className="container max-w-md mx-auto px-4 py-6 bg-background min-h-screen">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <h1 className="text-2xl font-bold mb-2 text-foreground">Resumo do Pedido</h1>
        <p className="text-muted-foreground mb-6">
          {establishment.name} • Mesa {order.table_number}
        </p>
        
        <div className="space-y-6 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Status</CardTitle>
                <Badge variant="secondary">
                  {order.order_status === 'completed' ? 'Finalizado' : 'Em Andamento'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  <span className="text-foreground">Mesa {order.table_number}</span>
                </div>
                {establishment.contact && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-foreground">{establishment.contact}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Itens do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {orderItems.map((item: any, index: number) => (
                  <li key={index} className="flex justify-between">
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {item.quantity === 1 ? 'unidade' : 'unidades'} x R$ {Number(item.price).toFixed(2)}
                      </p>
                    </div>
                    <p className="font-medium text-foreground">
                      R$ {(Number(item.price) * item.quantity).toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
              
              <div className="border-t border-border mt-4 pt-4">
                <div className="flex justify-between font-bold text-foreground">
                  <p>Total</p>
                  <p className="text-primary">R$ {totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-3">
          <Button 
            className="w-full"
            size="lg"
            onClick={handleCallWaiter}
            disabled={callingWaiter}
            variant="outline"
          >
            <Bell className="mr-2 h-5 w-5" />
            {callingWaiter ? "Chamando..." : "Chamar Garçom"}
          </Button>

          <Button 
            className="w-full"
            size="lg"
            onClick={handleAddItems}
            variant="secondary"
          >
            <Plus className="mr-2 h-5 w-5" />
            Adicionar Itens
          </Button>
          
          <Button 
            className="w-full"
            size="lg"
            onClick={handleFinalize}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Finalizar e Sair
          </Button>
        </div>
      </div>
    </>
  );
};

export default OrderSummary;
