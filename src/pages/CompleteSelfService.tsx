import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Plus, CheckCircle, Utensils } from 'lucide-react';
import Navbar from '@/components/Navbar';

const CompleteSelfService = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId]);

  const fetchOrder = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        toast.error('Pedido não encontrado');
        navigate('/my-orders');
        return;
      }

      setOrder(data);
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      toast.error('Erro ao carregar pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoreItems = () => {
    navigate(`/menu-selection/${order.establishment_id}/table-${order.assigned_table}?orderId=${orderId}`);
  };

  const handleCompleteSelfService = async () => {
    setIsCompleting(true);
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          order_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Até logo! 👋', {
        description: 'Obrigado pela visita!',
      });

      navigate('/my-orders');
    } catch (error) {
      console.error('Erro ao finalizar:', error);
      toast.error('Não foi possível finalizar');
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-900 p-4 flex items-center justify-center">
          <div className="animate-pulse text-white">Carregando...</div>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-900 p-4">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <p className="text-center">Pedido não encontrado</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const items = JSON.parse(order.items || '[]');

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-900 p-4 pt-20">
        <div className="max-w-md mx-auto">
          <Button 
            variant="ghost" 
            className="mb-4 text-white hover:bg-white/10"
            onClick={() => navigate('/my-orders')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Seu Pedido - Mesa {order.assigned_table || order.table_number}
              </CardTitle>
              <CardDescription className="text-gray-400">
                Gerencie seu atendimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Lista de itens */}
              <div className="space-y-3">
                <h3 className="font-semibold text-white text-sm">Itens do Pedido:</h3>
                <div className="space-y-2">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-700/50 p-3 rounded">
                      <div className="flex-1">
                        <p className="text-white font-medium">{item.quantity}x {item.name}</p>
                      </div>
                      <p className="text-white font-semibold">
                        R$ {((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-600 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total</span>
                  <span className="text-2xl font-bold text-white">
                    R$ {Number(order.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="space-y-3">
                <Button 
                  onClick={handleAddMoreItems}
                  variant="outline"
                  className="w-full border-blink-primary text-blink-primary hover:bg-blink-primary hover:text-black"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Adicionar Mais Itens
                </Button>

                <Button 
                  onClick={handleCompleteSelfService}
                  className="w-full bg-blink-primary hover:bg-blink-primary/90 text-black font-semibold"
                  disabled={isCompleting}
                >
                  {isCompleting ? (
                    'Finalizando...'
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Finalizar e Sair
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default CompleteSelfService;
