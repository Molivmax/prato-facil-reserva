import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, ShoppingCart } from 'lucide-react';
import Navbar from '@/components/Navbar';
import MenuItem from '@/components/MenuItem';
import { getRestaurantById, getMenuItemsByRestaurantId, getTablesByRestaurantId } from '@/data/mockData';
import { Restaurant, MenuItem as MenuItemType, OrderItem, Table } from '@/data/types';
import { useToast } from '@/hooks/use-toast';

const MenuSelection = () => {
  const { restaurantId, tableId } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  useEffect(() => {
    if (restaurantId && tableId) {
      // Simulando uma chamada de API
      setTimeout(() => {
        const restaurantData = getRestaurantById(restaurantId);
        if (restaurantData) {
          setRestaurant(restaurantData);
          const menuItemsData = getMenuItemsByRestaurantId(restaurantId);
          setMenuItems(menuItemsData);
          
          const tablesData = getTablesByRestaurantId(restaurantId);
          const selectedTable = tablesData.find(t => t.id === tableId);
          setTable(selectedTable || null);
        } else {
          toast({
            title: "Erro",
            description: "Restaurante não encontrado",
            variant: "destructive",
          });
          navigate('/search');
        }
        setLoading(false);
      }, 500);
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

  const handleContinue = () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione pelo menos um item ao seu pedido para continuar",
        variant: "destructive",
      });
      return;
    }
    
    // Calcular o valor total do pedido
    const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    // Criar um objeto com os detalhes do pedido para passar para a página de pagamento
    const orderDetails = {
      items: cart,
      restaurantId: restaurantId,
      tableId: tableId,
      total: totalAmount,
      restaurantName: restaurant?.name || "",
      tableNumber: table?.number || 0
    };
    
    // Salvar detalhes do pedido no localStorage (abordagem simples para o MVP)
    localStorage.setItem('currentOrder', JSON.stringify(orderDetails));
    
    // Gerar um ID de pedido temporário
    const tempOrderId = "order-" + Date.now();
    
    // Navegar para a página de pagamento
    navigate(`/payment/${tempOrderId}`);
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
              className="bg-restaurant-primary hover:bg-restaurant-dark"
              onClick={handleContinue}
              disabled={cart.length === 0}
            >
              Continuar
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MenuSelection;
