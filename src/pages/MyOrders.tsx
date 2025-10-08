import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ShoppingBag, Trash2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MyOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Você precisa estar logado');
        navigate('/login');
        return;
      }

      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast.error('Erro ao carregar pedidos');
      } else {
        setOrders(ordersData || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Tem certeza que deseja excluir este pedido?')) {
      return;
    }

    try {
      setDeletingOrderId(orderId);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Você precisa estar logado');
        return;
      }

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Delete error:', error);
        toast.error('Erro ao excluir pedido: ' + error.message);
        setDeletingOrderId(null);
        return;
      }

      // Remove o pedido da lista localmente
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      toast.success('Pedido excluído com sucesso!');
    } catch (error: any) {
      console.error('Error deleting order:', error);
      toast.error('Erro ao excluir pedido: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setDeletingOrderId(null);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blink-primary mx-auto"></div>
            <p className="mt-4 text-lg text-gray-300">Carregando...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <header className="bg-black/50 backdrop-blur-md text-white border-b border-white/10">
          <div className="container max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(-1)}
                className="text-blink-primary hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">Meus Pedidos</h1>
            </div>
          </div>
        </header>

        <main className="container max-w-4xl mx-auto px-4 py-6">
          {orders.length === 0 ? (
            <Card className="bg-black/50 backdrop-blur-md border border-white/10">
              <CardContent className="p-8">
                <div className="text-center">
                  <ShoppingBag className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhum pedido encontrado</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card 
                  key={order.id}
                  className="bg-black/50 backdrop-blur-md border border-white/10"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-white font-semibold">
                          Pedido #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Mesa {order.table_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">
                          R$ {Number(order.total_amount).toFixed(2)}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          order.order_status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          order.order_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          order.order_status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {order.order_status === 'completed' ? 'Concluído' :
                           order.order_status === 'pending' ? 'Pendente' :
                           order.order_status === 'rejected' ? 'Rejeitado' :
                           order.order_status}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">
                      {new Date(order.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-white/20 bg-transparent text-white hover:bg-white/10"
                        onClick={() => navigate(`/order-tracking/${order.id}`)}
                      >
                        Ver Detalhes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        onClick={() => handleDeleteOrder(order.id)}
                        disabled={deletingOrderId === order.id}
                      >
                        {deletingOrderId === order.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default MyOrders;
