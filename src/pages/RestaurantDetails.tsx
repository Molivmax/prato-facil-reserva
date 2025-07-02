
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProducts, setShowProducts] = useState(true);
  const [cartItems, setCartItems] = useState<{id: string, name: string, price: number, quantity: number}[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Load cart from localStorage if exists
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error parsing saved cart:", e);
      }
    }

    if (id) {
      const fetchRestaurantData = async () => {
        try {
          // Fetch from Supabase
          const { data: establishmentData, error } = await supabase
            .from('establishments')
            .select('*')
            .eq('id', id)
            .single();

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

  // Calculate total amount
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Add item to cart
  const addToCart = (item: {id: string, name: string, price: number, quantity: number}) => {
    const updatedCart = [...cartItems];
    const existingItemIndex = updatedCart.findIndex(i => i.id === item.id);
    
    if (existingItemIndex >= 0) {
      updatedCart[existingItemIndex].quantity += item.quantity;
    } else {
      updatedCart.push(item);
    }
    
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

  const handleReserve = () => {
    if (id) {
      // Save cart to localStorage before navigating
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      navigate(`/table-selection/${id}`);
    }
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
        onClearCart={clearCart}
      />
    </>
  );
};

export default RestaurantDetails;
