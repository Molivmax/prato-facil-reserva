import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Restaurant } from '@/data/types';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import ProductsList from '@/components/ProductsList';
import RestaurantHeader from '@/components/restaurant/RestaurantHeader';
import RestaurantInfoCards from '@/components/restaurant/RestaurantInfoCards';
import RestaurantTabs from '@/components/restaurant/RestaurantTabs';
import RestaurantAbout from '@/components/restaurant/RestaurantAbout';
import CartFooter from '@/components/cart/CartFooter';

const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const existingOrderId = location.state?.existingOrderId || null;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProducts, setShowProducts] = useState(true);
  const [cartItems, setCartItems] = useState<{id: string, name: string, price: number, quantity: number}[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load cart from localStorage if exists
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        console.log('📦 Carregando carrinho do localStorage:', parsed);
        
        // ✅ Normalizar todos os preços para Number
        const normalized = parsed.map((item: any) => {
          const normalizedItem = {
            ...item,
            price: Number(item.price),
            quantity: Number(item.quantity)
          };
          console.log('🔄 Item normalizado:', {
            original: item.price,
            normalized: normalizedItem.price,
            type: typeof normalizedItem.price
          });
          return normalizedItem;
        });
        
        console.log('✅ Carrinho normalizado:', normalized);
        setCartItems(normalized);
      } catch (e) {
        console.error("❌ Error parsing saved cart:", e);
      }
    }

    if (id) {
      const fetchRestaurantData = async () => {
        try {
          console.log("Fetching restaurant data for ID:", id);
          // Fetch from Supabase
          const { data: establishmentData, error } = await supabase
            .from('establishments')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          console.log("Supabase response:", { establishmentData, error });

          if (error) {
            throw error;
          }

          if (establishmentData) {
            // Convert Supabase data to Restaurant type
            const restaurantData: Restaurant = {
              id: establishmentData.id,
              name: establishmentData.name,
              // Use a default image since image_url doesn't exist in the establishments table
              image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
              rating: 4.5, // Default value since not in Supabase
              cuisine: establishmentData.description || 'Variado',
              distance: '1.2 km', // Default value
              address: establishmentData.address || 'Endereço não disponível',
              openingHours: establishmentData.working_hours || 'Horário não disponível',
              description: establishmentData.description || 'Sem descrição disponível',
              phoneNumber: establishmentData.contact || 'Telefone não disponível'
            };
            
            console.log("Restaurant data created:", restaurantData);
            setRestaurant(restaurantData);
          } else {
            toast({
              title: "Erro",
              description: "Restaurante não encontrado",
              variant: "destructive",
            });
            navigate('/search');
          }
        } catch (error) {
          console.error("Erro ao buscar dados do restaurante:", error);
          toast({
            title: "Erro",
            description: "Erro ao buscar dados do restaurante",
            variant: "destructive",
          });
          navigate('/search');
        } finally {
          setLoading(false);
        }
      };

      fetchRestaurantData();
    }
  }, [id, navigate, toast]);

  // Calculate total amount with useMemo
  const totalAmount = useMemo(() => {
    console.log('🧮 Calculando total do carrinho...');
    
    const total = cartItems.reduce((sum, item) => {
      const price = Number(item.price);
      const quantity = Number(item.quantity);
      
      // ✅ Validação robusta
      if (isNaN(price) || isNaN(quantity)) {
        console.error('❌ Preço ou quantidade inválidos:', {
          item: item.name,
          price: item.price,
          priceConverted: price,
          priceType: typeof item.price,
          quantity: item.quantity,
          quantityConverted: quantity,
          quantityType: typeof item.quantity
        });
        return sum;
      }
      
      const itemTotal = price * quantity;
      console.log('✅ Item válido:', {
        name: item.name,
        price,
        priceType: typeof price,
        quantity,
        quantityType: typeof quantity,
        subtotal: itemTotal
      });
      
      return sum + itemTotal;
    }, 0);
    
    console.log('💰 TOTAL CALCULADO:', total, 'CartItems count:', cartItems.length);
    return total;
  }, [cartItems]);

  // Debug: Monitor cart changes
  useEffect(() => {
    console.log('🛒 Cart Updated:', {
      itemCount: cartItems.length,
      items: cartItems,
      totalAmount: totalAmount
    });
  }, [cartItems, totalAmount]);

  // Add item to cart
  const addToCart = (item: {id: string, name: string, price: number, quantity: number}) => {
    console.log('➕ Adding to cart:', item.name, 'Qty:', item.quantity, 'Price:', item.price);
    
    const updatedCart = [...cartItems];
    const existingItemIndex = updatedCart.findIndex(i => i.id === item.id);
    
    if (existingItemIndex >= 0) {
      updatedCart[existingItemIndex].quantity += item.quantity;
    } else {
      updatedCart.push({
        ...item,
        price: Number(item.price)
      });
    }
    
    console.log('📦 Updated Cart:', updatedCart);
    setCartItems(updatedCart);
    localStorage.setItem('cartItems', JSON.stringify(updatedCart));
  };

  // Clear cart function
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cartItems');
    toast({
      title: "Carrinho esvaziado",
      description: "Todos os itens foram removidos do carrinho",
      variant: "default",
    });
  };

  // Update cart item quantity
  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeCartItem(itemId);
      return;
    }
    
    setCartItems(prev => {
      const updated = prev.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      localStorage.setItem('cartItems', JSON.stringify(updated));
      return updated;
    });
  };

  // Remove cart item
  const removeCartItem = (itemId: string) => {
    setCartItems(prev => {
      const updated = prev.filter(item => item.id !== itemId);
      localStorage.setItem('cartItems', JSON.stringify(updated));
      return updated;
    });
  };

  const handleReserve = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione pelo menos um item ao seu pedido",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    
    if (existingOrderId) {
      localStorage.setItem('existingOrderId', existingOrderId);
    }
    
    navigate(`/order-confirmation/${id}`);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container max-w-4xl mx-auto px-4 py-12 flex justify-center">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg w-full max-w-2xl mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-full max-w-xs mt-6"></div>
          </div>
        </div>
      </>
    );
  }

  if (!restaurant) {
    return (
      <>
        <Navbar />
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-xl text-gray-600">Restaurante não encontrado</p>
            <Button 
              variant="link" 
              className="text-restaurant-primary mt-4"
              asChild
            >
              <div onClick={() => navigate('/search')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para a busca
              </div>
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 py-6 pb-24">
        <Button 
          variant="ghost" 
          className="mb-4 text-black hover:bg-gray-100"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <RestaurantHeader 
          name={restaurant.name}
          image={restaurant.image}
          rating={restaurant.rating}
          cuisine={restaurant.cuisine}
        />
        
        <RestaurantInfoCards 
          address={restaurant.address}
          openingHours={restaurant.openingHours}
          phoneNumber={restaurant.phoneNumber}
        />
        
        <RestaurantTabs 
          showProducts={showProducts}
          setShowProducts={setShowProducts}
        />
        
        {showProducts ? (
          <div className="mb-8">
            {id && <ProductsList establishmentId={id} onAddToCart={addToCart} />}
          </div>
        ) : (
          <RestaurantAbout description={restaurant.description} />
        )}
      </div>
      
      <CartFooter
        cartItems={cartItems}
        totalAmount={totalAmount}
        onReserve={handleReserve}
        onUpdateQuantity={updateCartItemQuantity}
        onRemoveItem={removeCartItem}
        onClearCart={clearCart}
      />
    </>
  );
};

export default RestaurantDetails;
