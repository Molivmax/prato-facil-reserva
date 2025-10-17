import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { Bell, Plus, LogOut, UtensilsCrossed } from 'lucide-react';

const CustomerService = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [establishment, setEstablishment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [callingWaiter, setCallingWaiter] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

  const fetchOrderData = async () => {
    try {
      // Buscar o pedido
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Verificar se o cliente fez check-in
      if (orderData.customer_status !== 'checked_in') {
        toast.error('Você precisa fazer check-in no restaurante primeiro');
        navigate(`/order-tracking/${orderId}`);
        return;
      }

      // Buscar o estabelecimento separadamente
      const { data: establishmentData, error: establishmentError } = await supabase
        .from('establishments')
        .select('*')
        .eq('id', orderData.establishment_id)
        .single();

      if (establishmentError) throw establishmentError;

      setOrder(orderData);
      setEstablishment(establishmentData);
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
      toast.error('Pedido não encontrado');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleCallWaiter = async () => {
    if (!order || !establishment) return;

    const tableNumber = order.assigned_table || order.table_number;
    
    if (!tableNumber) {
      toast.error('Mesa não identificada');
      return;
    }

    setCallingWaiter(true);
    try {
      const { error } = await supabase
        .from('customer_notifications')
        .insert({
          order_id: orderId,
          establishment_id: establishment.id,
          notification_type: 'call_waiter',
          message: `Mesa ${tableNumber} chamou o garçom`,
          table_number: tableNumber,
        });

      if (error) throw error;

      toast.success('Garçom chamado!', {
        description: 'Alguém estará com você em breve',
      });
    } catch (error) {
      console.error('Erro ao chamar garçom:', error);
      toast.error('Não foi possível chamar o garçom');
    } finally {
      setCallingWaiter(false);
    }
  };

  const handleAddItems = () => {
    navigate(`/menu-selection/${establishment.id}/${order.assigned_table || order.table_number}?orderId=${orderId}`);
  };

  const handleFinalize = () => {
    navigate(`/complete-service/${orderId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!order || !establishment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-semibold mb-2">Pedido não encontrado</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = order.items || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <UtensilsCrossed className="h-6 w-6" />
              Seu Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Estabelecimento</p>
              <p className="text-lg font-semibold">{establishment.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Mesa</p>
                <p className="text-2xl font-bold text-primary">
                  {order.assigned_table || order.table_number}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Atual</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {Number(order.total_amount).toFixed(2)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Itens do Pedido</p>
              <div className="space-y-2">
                {items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm border-b pb-2">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-semibold">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            onClick={handleCallWaiter}
            disabled={callingWaiter}
            className="w-full h-14 text-lg bg-white text-black hover:bg-gray-100 border border-gray-300"
          >
            <Bell className="mr-2 h-5 w-5" />
            {callingWaiter ? 'Chamando...' : 'Chamar Garçom'}
          </Button>

          <Button
            onClick={handleAddItems}
            className="w-full h-14 text-lg bg-white text-black hover:bg-gray-100 border border-gray-300"
          >
            <Plus className="mr-2 h-5 w-5" />
            Adicionar Mais Itens
          </Button>

          <Button
            onClick={handleFinalize}
            className="w-full h-14 text-lg bg-red-600 text-white hover:bg-red-700"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Finalizar e Sair
          </Button>
        </div>

        <Card className="mt-6 bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              💡 <strong>Dica:</strong> Você pode adicionar mais itens ao seu pedido a qualquer momento.
              Ao finalizar, você poderá avaliar sua experiência!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerService;
