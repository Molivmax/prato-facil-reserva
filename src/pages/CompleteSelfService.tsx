import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Star, Receipt, CreditCard } from 'lucide-react';
import Navbar from '@/components/Navbar';

const CompleteSelfService = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [establishment, setEstablishment] = useState<any>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId]);

  const fetchOrder = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, establishments(*)')
        .eq('id', id)
        .single();

      if (error) throw error;

      setOrder(data);
      setEstablishment(data.establishments);
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
      toast.error('Pedido não encontrado');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoreItems = () => {
    navigate(`/customer-service/${orderId}`);
  };

  const handleRequestBill = () => {
    toast.info('Conta solicitada!', {
      description: 'O estabelecimento foi notificado',
    });
  };

  const handleCompleteSelfService = async () => {
    if (rating === 0) {
      toast.error('Por favor, avalie sua experiência antes de sair');
      return;
    }

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
        description: `Obrigado pela visita! Avaliação: ${rating} estrelas`,
      });

      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error('Erro ao finalizar:', error);
      toast.error('Não foi possível finalizar');
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order || !establishment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-semibold">Pedido não encontrado</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = JSON.parse(order.items || '[]');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Receipt className="h-6 w-6" />
              Finalizar Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground">Estabelecimento</p>
              <p className="text-lg font-semibold">{establishment.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Mesa</p>
                <p className="text-xl font-bold">{order.assigned_table || order.table_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-primary">
                  R$ {Number(order.total_amount).toFixed(2)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-3">Resumo do Pedido</p>
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

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-3">Como foi sua experiência?</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-10 w-10 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-muted-foreground mt-2">
                  {rating === 5 ? 'Excelente!' : rating === 4 ? 'Muito bom!' : rating === 3 ? 'Bom' : rating === 2 ? 'Regular' : 'Poderia melhorar'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            onClick={handleRequestBill}
            variant="outline"
            className="w-full h-12"
          >
            <CreditCard className="mr-2 h-5 w-5" />
            Solicitar Conta
          </Button>

          <Button
            onClick={handleAddMoreItems}
            variant="outline"
            className="w-full h-12"
          >
            Voltar ao Atendimento
          </Button>

          <Button
            onClick={handleCompleteSelfService}
            className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
            disabled={isCompleting || rating === 0}
          >
            {isCompleting ? 'Finalizando...' : '✅ Finalizar e Sair'}
          </Button>
        </div>

        {rating === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            ⭐ Por favor, avalie sua experiência antes de sair
          </p>
        )}
      </div>
    </div>
  );
};

export default CompleteSelfService;
