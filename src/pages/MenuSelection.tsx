import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, ShoppingCart } from 'lucide-react';
import Navbar from '@/components/Navbar';
import MenuItem from '@/components/MenuItem';

import { Restaurant, MenuItem as MenuItemType, OrderItem, Table } from '@/data/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const MenuSelection = () => {
  const { restaurantId, tableId } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Convert cartItems format to OrderItem format
        const orderItems = parsedCart.map((item: any) => ({
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }));
        setCart(orderItems);
      } catch (e) {
        console.error("Error parsing saved cart:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (restaurantId && tableId) {
      const fetchData = async () => {
        try {
          setLoading(true);
          
          // Fetch establishment data
          const { data: establishmentData, error: establishmentError } = await supabase
            .from('establishments')
            .select('*')
            .eq('id', restaurantId)
            .single();
            
          if (establishmentError) {
            throw establishmentError;
          }
          
          if (establishmentData) {
            // Create restaurant object from establishment data
            const restaurantData: Restaurant = {
              id: establishmentData.id,
              name: establishmentData.name,
              image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
              rating: 4.5,
              cuisine: establishmentData.description || 'Variado',
              distance: '1.2 km',
              address: establishmentData.address || 'Endereço não disponível',
              openingHours: establishmentData.working_hours || 'Horário não disponível',
              description: establishmentData.description || 'Sem descrição disponível',
              phoneNumber: establishmentData.contact || 'Telefone não disponível'
            };
            
            setRestaurant(restaurantData);
            
            // Fetch products (menu items)
            const { data: productsData, error: productsError } = await supabase
              .from('products')
              .select('*')
              .eq('establishment_id', restaurantId);
              
            if (productsError) {
              throw productsError;
            }
            
            // Convert products to menu items
            const menuItemsData: MenuItemType[] = productsData.map(product => ({
              id: product.id,
              name: product.name,
              description: product.description || '',
              price: Number(product.price),
              image: product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
              category: product.category as 'Entrada' | 'Prato Principal' | 'Sobremesa' | 'Bebida',
              restaurantId: product.establishment_id
            }));
            
            setMenuItems(menuItemsData);
            
            // Create mock table from tableId (since we don't have a tables table yet)
            const mockTable: Table = {
              id: tableId,
              restaurantId: restaurantId,
              number: parseInt(tableId.replace('table-', '')) || 1,
              seats: 4,
              available: true
            };
            
            setTable(mockTable);
          }
        } catch (error) {
          console.error('Error fetching restaurant data:', error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados do restaurante",
            variant: "destructive",
          });
          navigate('/search');
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [restaurantId, tableId, navigate, toast]);

  const handleAddToCart = (menuItemId: string, quantity: number) => {
    const menuItem = menuItems.find(item => item.id === menuItemId);
    
    if (!menuItem) return;
    
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.menuItemId === menuItemId);
      
      if (existingItemIndex >= 0) {
        const updatedCart = [...prevCart];
        if (quantity === 0) {
          // Remove item from cart
          updatedCart.splice(existingItemIndex, 1);
        } else {
          // Update quantity
          updatedCart[existingItemIndex].quantity = quantity;
        }
        return updatedCart;
      } else if (quantity > 0) {
        // Add new item to cart
        return [...prevCart, {
          menuItemId,
          name: menuItem.name,
          price: menuItem.price,
          quantity
        }];
      }
      
      return prevCart;
    });
  };

  const handleReserve = async () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione pelo menos um item ao seu pedido para continuar",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingOrder(true);
    
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

      // Criar pedido no banco de dados
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          user_id: session.user.id,
          establishment_id: restaurantId!,
          table_number: table?.number || 0,
          items: cart as any,
          total_amount: totalAmount,
          payment_status: 'pending',
          order_status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar pedido:', error);
        toast({
          title: "Erro",
          description: "Não foi possível criar o pedido. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // Salvar também no localStorage
      const orderDetails = {
        id: order.id,
        items: cart,
        restaurantId: restaurantId,
        tableId: tableId,
        total: totalAmount,
        restaurantName: restaurant?.name || "",
        tableNumber: table?.number || 0,
        paymentStatus: "pending"
      };
      
      localStorage.setItem('currentOrder', JSON.stringify(orderDetails));
      
      // Navegar para página de pagamento
      navigate(`/payment/${order.id}`);
      
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container max-w-4xl mx-auto px-4 py-12 flex justify-center">
          <div className="animate-pulse w-full">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="h-10 bg-gray-200 rounded w-full mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Group menu items by category
  const starters = menuItems.filter(item => item.category === 'Entrada');
  const mains = menuItems.filter(item => item.category === 'Prato Principal');
  const desserts = menuItems.filter(item => item.category === 'Sobremesa');
  const drinks = menuItems.filter(item => item.category === 'Bebida');
  
  // Verificar se o restaurante tem sobremesas cadastradas
  const hasDesserts = desserts.length > 0;

  return (
    <>
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 py-6 pb-20">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <h1 className="text-2xl font-bold mb-2">Cardápio</h1>
        <p className="text-gray-600 mb-6">
          {restaurant?.name} • Mesa {table?.number} • {table?.seats} pessoas
        </p>
        
        <Tabs defaultValue="mains" className="mb-8">
          <TabsList className="w-full justify-start overflow-x-auto mb-6">
            <TabsTrigger value="starters">Entradas</TabsTrigger>
            <TabsTrigger value="mains">Pratos Principais</TabsTrigger>
            <TabsTrigger value="desserts">Sobremesas</TabsTrigger>
            <TabsTrigger value="drinks">Bebidas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="starters">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {starters.map(item => (
                <MenuItem
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  image={item.image}
                  category={item.category}
                  onAddToOrder={handleAddToCart}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="mains">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mains.map(item => (
                <MenuItem
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  image={item.image}
                  category={item.category}
                  onAddToOrder={handleAddToCart}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="desserts">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {desserts.map(item => (
                <MenuItem
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  image={item.image}
                  category={item.category}
                  onAddToOrder={handleAddToCart}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="drinks">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {drinks.map(item => (
                <MenuItem
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  image={item.image}
                  category={item.category}
                  onAddToOrder={handleAddToCart}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Cart summary - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center">
                <ShoppingCart className="h-5 w-5 text-restaurant-primary mr-2" />
                <span className="font-medium">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</span>
              </div>
              <div className="text-lg font-bold">
                Total: R$ {totalAmount.toFixed(2)}
              </div>
            </div>
            <Button 
              size="lg" 
              className="bg-blink-primary hover:bg-blink-primary/90 text-black font-semibold"
              onClick={handleReserve}
              disabled={cart.length === 0 || isCreatingOrder}
            >
              {isCreatingOrder ? "Processando..." : "Adicionar à Mesa"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

    </>
  );
};

export default MenuSelection;
