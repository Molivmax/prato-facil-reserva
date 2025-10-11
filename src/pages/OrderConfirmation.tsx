import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import PartySizeSelector from '@/components/PartySizeSelector';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const OrderConfirmation = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [partySize, setPartySize] = useState<number>(2);
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setCartItems(parsed);
      } catch (e) {
        console.error("Erro ao carregar carrinho:", e);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o carrinho",
          variant: "destructive",
        });
        navigate(`/restaurant/${restaurantId}`);
      }
    } else {
      toast({
        title: "Carrinho vazio",
        description: "Não há itens no carrinho",
        variant: "destructive",
      });
      navigate(`/restaurant/${restaurantId}`);
    }

    // Fetch restaurant name
    const fetchRestaurant = async () => {
      if (!restaurantId) return;
      
      try {
        const { data, error } = await supabase
          .from('establishments')
          .select('name')
          .eq('id', restaurantId)
          .maybeSingle();

        if (error) throw error;
        if (data) setRestaurantName(data.name);
      } catch (error) {
        console.error('Erro ao buscar restaurante:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [restaurantId, navigate, toast]);

  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price = Number(item.price);
      const quantity = Number(item.quantity);
      return sum + (price * quantity);
    }, 0);
  }, [cartItems]);

  const handleAddToExistingOrder = async (orderId: string, userId: string) => {
    try {
      const { data: existingOrder, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !existingOrder) {
        throw new Error('Pedido não encontrado');
      }

      const newOrderItems = cartItems.map(item => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }));

      const existingItems = Array.isArray(existingOrder.items) ? existingOrder.items : [];
      const mergedItems = [...existingItems, ...newOrderItems];
      const newTotal = Number(existingOrder.total_amount) + totalAmount;

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          items: mergedItems,
          total_amount: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        throw updateError;
      }

      localStorage.removeItem('cartItems');
      localStorage.removeItem('existingOrderId');
      setCartItems([]);

      toast({
        title: "Itens adicionados!",
        description: `Novos itens adicionados ao seu pedido. Total adicional: R$ ${totalAmount.toFixed(2)}`,
      });

      navigate(`/payment/${orderId}`);
      
    } catch (error) {
      console.error('Erro ao adicionar itens:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar os itens ao pedido. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCreateNewOrder = async (userId: string) => {
    const orderItems = cartItems.map(item => ({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        establishment_id: restaurantId!,
        table_number: 0,
        items: orderItems as any,
        total_amount: totalAmount,
        party_size: partySize,
        payment_status: 'pending',
        order_status: 'pending'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    localStorage.setItem('party_size', partySize.toString());
    localStorage.removeItem('cartItems');
    setCartItems([]);
    navigate(`/payment/${order.id}`);
  };

  const handleConfirmOrder = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione pelo menos um item ao seu pedido",
        variant: "destructive",
      });
      return;
    }

    const existingOrderId = localStorage.getItem('existingOrderId');
    
    if (!existingOrderId && (!partySize || partySize < 1)) {
      toast({
        title: "Selecione o número de pessoas",
        description: "Por favor, informe quantas pessoas vão",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Acesso necessário",
          description: "Você precisa estar logado para fazer um pedido",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      if (existingOrderId) {
        await handleAddToExistingOrder(existingOrderId, session.user.id);
      } else {
        await handleCreateNewOrder(session.user.id);
      }
      
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container max-w-4xl mx-auto px-4 py-12">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-1/3 mb-8"></div>
        <div className="h-64 bg-gray-800 rounded w-full mb-4"></div>
        <div className="h-32 bg-gray-800 rounded w-full"></div>
      </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 py-6 pb-8">
        <Button 
          variant="ghost" 
          className="mb-6 text-white hover:bg-gray-800"
          onClick={() => navigate(`/restaurant/${restaurantId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <h1 className="text-3xl font-bold mb-2 text-white">Confirmar Pedido</h1>
        {restaurantName && (
          <p className="text-gray-300 mb-8 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            {restaurantName}
          </p>
        )}

        {/* Resumo do Pedido */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Resumo do Pedido</h2>
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-b-0">
                <div className="flex-1">
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-sm text-gray-400">
                    R$ {Number(item.price).toFixed(2)} x {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-white">
                  R$ {(Number(item.price) * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-yellow-400/30 flex justify-between items-center bg-yellow-400/10 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
            <p className="text-lg font-bold text-white">Total</p>
            <p className="text-2xl font-bold text-yellow-400">
              R$ {totalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Seletor de Pessoas - só aparece se for pedido novo */}
        {!localStorage.getItem('existingOrderId') && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            <PartySizeSelector 
              partySize={partySize} 
              onPartySizeChange={setPartySize}
            />
          </div>
        )}

        {/* Botão Confirmar */}
        <Button 
          onClick={handleConfirmOrder}
          className="w-full h-14 text-lg"
          size="lg"
        >
          Confirmar e ir para Pagamento
        </Button>
      </div>
    </>
  );
};

export default OrderConfirmation;
