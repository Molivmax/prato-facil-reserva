
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PlusCircle, 
  UtensilsCrossed, 
  Store, 
  LogOut, 
  Users, 
  ShoppingCart,
  Bell,
  BarChart,
  AlertCircle,
  Info,
  Check,
  X,
  Package,
  DoorOpen,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ProductsList from '@/components/ProductsList';
import AddProductForm from '@/components/AddProductForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import CheckoutDialog from '@/components/CheckoutDialog';
import EstablishmentSettings from '@/components/EstablishmentSettings';
import DailyRevenue from '@/components/DailyRevenue';

// Define order status type
type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

// Define order interface
interface Order {
  id: string | number;
  tableNumber: number;
  itemCount: number;
  total: number;
  status: OrderStatus;
  canAddMore: boolean;
  paymentStatus?: string;
  orderStatus?: string;
  items?: any;
}

const EstablishmentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [establishment, setEstablishment] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('products');
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [arrivingCustomers, setArrivingCustomers] = useState(0);
  const [attendingCustomers, setAttendingCustomers] = useState<any[]>([]);
  const [finalizedCustomers, setFinalizedCustomers] = useState(0);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [hasMPCredentials, setHasMPCredentials] = useState<boolean>(false);
  const [checkingCredentials, setCheckingCredentials] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast.error('Você precisa estar logado para acessar esta página');
        navigate('/establishment-login');
        return;
      }
      
      setUser(data.session.user);
      
      // Check if we have establishment ID from navigation state (coming from product registration)
      const state = location.state as { establishmentId?: string };
      if (state?.establishmentId) {
        fetchEstablishmentById(state.establishmentId);
      } else {
        fetchEstablishmentData(data.session.user.id);
      }
    };

    checkAuth();
  }, [navigate, location]);

  const fetchEstablishmentOrders = async (establishmentId: string) => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('establishment_id', establishmentId)
        .in('payment_status', ['pending', 'paid'])
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }
      
      if (orders && orders.length > 0) {
        const formattedOrders = orders.map(order => ({
          id: order.id,
          tableNumber: order.table_number,
          itemCount: Array.isArray(order.items) ? order.items.length : 0,
          total: Number(order.total_amount),
          status: (order.order_status === 'pending' ? 'pending' : 'accepted') as OrderStatus,
          canAddMore: order.order_status === 'confirmed',
          paymentStatus: order.payment_status,
          orderStatus: order.order_status,
          items: order.items,
        }));
        
        const pending = formattedOrders.filter(o => o.status === 'pending');
        const accepted = formattedOrders.filter(o => o.status === 'accepted');
        
        setPendingOrders(pending);
        setArrivingCustomers(pending.length);
        setAttendingCustomers(accepted);
        
        console.log('Orders loaded:', { pending: pending.length, accepted: accepted.length });
      } else {
        setPendingOrders([]);
        setArrivingCustomers(0);
        setAttendingCustomers([]);
      }
    } catch (error) {
      console.error('Error in fetchEstablishmentOrders:', error);
      toast.error('Não foi possível buscar os pedidos do estabelecimento');
    }
  };

  useEffect(() => {
    if (!establishment?.id) return;
    
    console.log('Setting up real-time for establishment:', establishment.id);
    
    fetchEstablishmentOrders(establishment.id);
    
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `establishment_id=eq.${establishment.id}`
        },
        (payload) => {
          console.log('Order changed via real-time:', payload);
          fetchEstablishmentOrders(establishment.id);
          
          if (payload.eventType === 'INSERT') {
            toast.success(`🔔 Novo Pedido! Mesa ${payload.new.table_number} - R$ ${Number(payload.new.total_amount).toFixed(2)}`);
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });
      
    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [establishment?.id]);

  const fetchEstablishmentData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('establishments')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        setEstablishment(null);
        navigate('/partner-registration');
        return;
      }

      setEstablishment(data);
      
      // Check for MP credentials
      if (data?.id) {
        checkMPCredentials(data.id);
      }
    } catch (error: any) {
      console.error('Error fetching establishment:', error);
      toast.error(error.message || 'Erro ao carregar dados do estabelecimento');
    } finally {
      setLoading(false);
    }
  };

  const fetchEstablishmentById = async (establishmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('establishments')
        .select('*')
        .eq('id', establishmentId)
        .single();

      if (error) {
        throw error;
      }

      setEstablishment(data);
      
      // Check for MP credentials
      if (data?.id) {
        checkMPCredentials(data.id);
      }
    } catch (error: any) {
      console.error('Error fetching establishment by ID:', error);
      toast.error(error.message || 'Erro ao carregar dados do estabelecimento');
      navigate('/partner-registration');
    } finally {
      setLoading(false);
    }
  };

  const checkMPCredentials = async (establishmentId: string) => {
    try {
      setCheckingCredentials(true);
      const { data, error } = await supabase
        .from('establishment_mp_credentials')
        .select('id')
        .eq('establishment_id', establishmentId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setHasMPCredentials(!!data);
    } catch (error) {
      console.error('Error checking MP credentials:', error);
    } finally {
      setCheckingCredentials(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logout realizado com sucesso');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer logout');
    }
  };

  const getPendingOrdersCount = () => {
    return pendingOrders.filter(order => order.status === 'pending').length;
  };

  // Function to handle accepting an order
  const handleAcceptOrder = (orderId: string | number) => {
    setPendingOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: 'accepted' as OrderStatus, canAddMore: true } : order
      )
    );
    toast.success(`Pedido aceito com sucesso!`);
  };

  // Function to handle rejecting an order
  const handleRejectOrder = (orderId: string | number) => {
    setPendingOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: 'rejected' as OrderStatus, canAddMore: false } : order
      )
    );
    toast.error(`Pedido rejeitado.`);
  };

  // Function to handle completing an order
  const handleCompleteOrder = (orderId: string | number) => {
    setPendingOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: 'completed' as OrderStatus, canAddMore: false } : order
      )
    );
    toast.success(`Pedido finalizado com sucesso!`);
  };

  // Function to handle deleting a rejected order
  const handleDeleteOrder = (orderId: string | number) => {
    setPendingOrders(prevOrders =>
      prevOrders.filter(order => order.id !== orderId)
    );
    toast.success(`Pedido removido da lista.`);
  };

  // Function to handle preparing a table (customer arrives)
  const handlePrepareTable = (customerIndex: number) => {
    // Move customer from arriving to attending
    const newCustomer = {
      id: Math.floor(Math.random() * 1000) + 3000,
      tableNumber: Math.floor(Math.random() * 20) + 1,
      people: Math.floor(Math.random() * 4) + 1,
      startTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      pendingAmount: 0, // No pending amount initially
      status: 'attending'
    };
    
    setAttendingCustomers(prev => [...prev, newCustomer]);
    setArrivingCustomers(prev => Math.max(0, prev - 1));
    
    toast.success(`Mesa #${newCustomer.tableNumber} preparada! Cliente está sendo atendido.`);
  };

  // Function to handle finalizing a table (send payment reminder)
  const handleFinalizeTable = (customerId: number) => {
    const customer = attendingCustomers.find(c => c.id === customerId);
    if (!customer) return;
    
    // Simulate sending payment reminder to customer's app
    toast.success(`Lembrete de pagamento enviado para o cliente da mesa #${customer.tableNumber}! Valor pendente: R$ ${customer.pendingAmount.toFixed(2)}`);
    
    // Remove customer from attending list after a short delay (simulating payment process)
    setTimeout(() => {
      setAttendingCustomers(prev => prev.filter(c => c.id !== customerId));
      setFinalizedCustomers(prev => prev + 1);
      toast.success(`Mesa #${customer.tableNumber} finalizada e liberada!`);
    }, 2000);
  };

  // Function to allow customer to add more items to an accepted order
  const handleAllowMoreItems = (orderId: string | number) => {
    // In a real application, this would send a notification to the customer's app
    toast.success(`Cliente da mesa ${pendingOrders.find(o => o.id === orderId)?.tableNumber} notificado para adicionar mais itens!`);
    
    // For demo purposes, simulate a new order being added after 3 seconds
    setTimeout(() => {
      setPendingOrders(prevOrders => {
        const orderIndex = prevOrders.findIndex(o => o.id === orderId);
        if (orderIndex >= 0) {
          const updatedOrder = { 
            ...prevOrders[orderIndex],
            itemCount: prevOrders[orderIndex].itemCount + Math.floor(Math.random() * 3) + 1,
            total: prevOrders[orderIndex].total + parseFloat((Math.random() * 30).toFixed(2))
          };
          
          const newOrders = [...prevOrders];
          newOrders[orderIndex] = updatedOrder;
          
          toast.success(`Cliente da mesa ${updatedOrder.tableNumber} adicionou mais itens ao pedido #${orderId}!`);
          return newOrders;
        }
        return prevOrders;
      });
    }, 3000);
  };

  // Function to handle checkout process
  const handleCheckout = (order: Order) => {
    setSelectedOrder(order);
    setCheckoutDialogOpen(true);
  };

  // Function to close checkout dialog
  const handleCloseCheckoutDialog = () => {
    setCheckoutDialogOpen(false);
    setSelectedOrder(null);
    
    // In a real app, we would mark the table as available after checkout
    toast.success("Mesa liberada para novos clientes!");
    
    // Redirect to daily revenue tab after releasing customer
    setActiveTab('revenue');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blink-primary mx-auto"></div>
          <p className="mt-4 text-lg text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-900 text-white border-b border-gray-800 shadow-lg">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Store className="h-8 w-8 text-blink-primary" />
              <h1 className="text-2xl font-bold">Painel do Estabelecimento</h1>
            </div>
            <div className="flex items-center space-x-6">
              <p className="text-md hidden md:block">
                Olá, <span className="font-semibold text-blink-primary">{establishment?.name}</span>
              </p>
              <Button 
                variant="outline" 
                className="border-white/20 hover:bg-white/10 text-white"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-6">
        {/* Mercado Pago Alert */}
        {!checkingCredentials && !hasMPCredentials && (
          <Alert className="mb-6 bg-yellow-500/10 border-yellow-500/50">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-yellow-500">Configuração de Pagamentos Necessária</AlertTitle>
            <AlertDescription className="text-yellow-200">
              Você ainda não configurou sua conta do Mercado Pago. Configure agora para começar a receber pagamentos dos seus clientes.
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-4 border-yellow-500 text-yellow-500 hover:bg-yellow-500/20"
                onClick={() => navigate('/payment-setup')}
              >
                Configurar Agora
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700 hover:shadow-md transition-shadow text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-blink-primary" />
                Pedidos Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{getPendingOrdersCount()}</div>
              <p className="text-sm text-gray-300 mt-1">
                {getPendingOrdersCount() === 0 ? 'Nenhum pedido novo' : 'Aguardando atenção'}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 hover:shadow-md transition-shadow text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Users className="h-5 w-5 mr-2 text-blink-primary" />
                Clientes Atendendo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{attendingCustomers.length}</div>
              <p className="text-sm text-gray-300 mt-1">
                {attendingCustomers.length === 0 ? 'Nenhum cliente sendo atendido' : 'Atualmente nas mesas'}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 hover:shadow-md transition-shadow text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Users className="h-5 w-5 mr-2 text-blink-primary" />
                Clientes Chegando
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{arrivingCustomers}</div>
              <p className="text-sm text-gray-300 mt-1">
                {arrivingCustomers === 0 ? 'Nenhum cliente a caminho' : 'A caminho do estabelecimento'}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 hover:shadow-md transition-shadow text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Check className="h-5 w-5 mr-2 text-green-400" />
                Clientes Finalizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{finalizedCustomers}</div>
              <p className="text-sm text-gray-300 mt-1">
                Total atendido hoje
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card className="bg-gray-800 border-0 text-white">
              <CardHeader>
                <CardTitle className="text-lg text-blink-primary">Menu</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="flex flex-col">
                  <Button 
                    variant="ghost" 
                    className={`justify-start rounded-none border-l-4 ${activeTab === 'products' ? 'border-l-blink-primary bg-black/20' : 'border-l-transparent'} text-white hover:bg-black/30`}
                    onClick={() => setActiveTab('products')}
                  >
                    <UtensilsCrossed className="h-4 w-4 mr-2" />
                    Produtos
                  </Button>
                  <Button 
                    variant="ghost" 
                    className={`justify-start rounded-none border-l-4 ${activeTab === 'orders' ? 'border-l-blink-primary bg-black/20' : 'border-l-transparent'} text-white hover:bg-black/30`}
                    onClick={() => setActiveTab('orders')}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Pedidos
                    {getPendingOrdersCount() > 0 && (
                      <span className="ml-2 bg-blink-primary text-black text-xs py-0.5 px-2 rounded-full">
                        {getPendingOrdersCount()}
                      </span>
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    className={`justify-start rounded-none border-l-4 ${activeTab === 'customers' ? 'border-l-blink-primary bg-black/20' : 'border-l-transparent'} text-white hover:bg-black/30`}
                    onClick={() => setActiveTab('customers')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                     Clientes
                     {(arrivingCustomers + attendingCustomers.length) > 0 && (
                       <span className="ml-2 bg-blink-primary text-black text-xs py-0.5 px-2 rounded-full">
                         {arrivingCustomers + attendingCustomers.length}
                       </span>
                     )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    className={`justify-start rounded-none border-l-4 ${activeTab === 'revenue' ? 'border-l-blink-primary bg-black/20' : 'border-l-transparent'} text-white hover:bg-black/30`}
                    onClick={() => setActiveTab('revenue')}
                  >
                    <BarChart className="h-4 w-4 mr-2" />
                    Valores do Dia
                  </Button>
                  <Button 
                    variant="ghost" 
                    className={`justify-start rounded-none border-l-4 ${activeTab === 'notifications' ? 'border-l-blink-primary bg-black/20' : 'border-l-transparent'} text-white hover:bg-black/30`}
                    onClick={() => setActiveTab('notifications')}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Notificações
                  </Button>
                  <Button 
                    variant="ghost" 
                    className={`justify-start rounded-none border-l-4 ${activeTab === 'settings' ? 'border-l-blink-primary bg-black/20' : 'border-l-transparent'} text-white hover:bg-black/30`}
                    onClick={() => setActiveTab('settings')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>
          
          {/* Main content */}
          <div className="md:col-span-3">
            {activeTab === 'products' && (
              <div className="space-y-6">
                <Card className="border-0 shadow-md bg-gray-800 text-white">
                  <CardHeader className="flex flex-row items-center justify-between bg-gray-800 rounded-t-lg border-b border-gray-700">
                    <div>
                      <CardTitle className="text-xl text-white">Gerenciar Produtos</CardTitle>
                      <CardDescription className="text-gray-300">
                        Adicione e edite os produtos disponíveis no seu estabelecimento
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => setActiveTab('add-product')}
                      className="bg-blink-primary hover:bg-blink-primary/90 text-black"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Adicionar Produto
                    </Button>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {establishment?.id ? (
                      <ProductsList establishmentId={establishment.id} />
                    ) : (
                      <Alert className="bg-gray-700 border-gray-600">
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                        <AlertTitle className="text-gray-200">Estabelecimento não encontrado</AlertTitle>
                        <AlertDescription className="text-gray-300">
                          Cadastre seu estabelecimento para gerenciar produtos.
                        </AlertDescription>
                        <div className="mt-4">
                          <Button className="bg-blink-primary hover:bg-blink-primary/90 text-black" onClick={() => navigate('/partner-registration')}>
                            Cadastrar estabelecimento
                          </Button>
                        </div>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Revenue Tab */}
            {activeTab === 'revenue' && (
              <div className="space-y-6">
                <Card className="border-0 shadow-md bg-gray-800 text-white">
                  <CardHeader className="bg-gray-800 rounded-t-lg border-b border-gray-700">
                    <CardTitle className="text-xl text-white flex items-center">
                      <BarChart className="h-5 w-5 mr-2 text-blink-primary" />
                      Controle de Valores Diários
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Acompanhe os valores recebidos, filtrados por mesa e cliente
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {establishment?.id ? (
                      <DailyRevenue establishmentId={establishment.id} />
                    ) : (
                      <Alert className="bg-gray-700 border-gray-600">
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                        <AlertTitle className="text-gray-200">Estabelecimento não encontrado</AlertTitle>
                        <AlertDescription className="text-gray-300">
                          Cadastre seu estabelecimento para acessar o controle de valores.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'add-product' && (
              <Card className="border-0 shadow-md bg-gray-800 text-white">
                <CardHeader className="bg-gray-800 rounded-t-lg border-b border-gray-700">
                  <CardTitle className="text-xl text-white">Adicionar Novo Produto</CardTitle>
                  <CardDescription className="text-gray-300">
                    Preencha os detalhes do produto para adicioná-lo ao seu cardápio
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {establishment?.id ? (
                    <AddProductForm 
                      establishmentId={establishment.id} 
                      onSuccess={() => {
                        setActiveTab('products');
                        toast.success('Produto adicionado com sucesso!');
                      }}
                    />
                  ) : (
                    <Alert className="bg-gray-700 border-gray-600">
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                      <AlertTitle className="text-gray-200">Estabelecimento não encontrado</AlertTitle>
                      <AlertDescription className="text-gray-300">
                        Cadastre seu estabelecimento para adicionar produtos.
                      </AlertDescription>
                      <div className="mt-4">
                        <Button className="bg-blink-primary hover:bg-blink-primary/90 text-black" onClick={() => navigate('/partner-registration')}>
                          Cadastrar estabelecimento
                        </Button>
                      </div>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'orders' && (
              <Card className="border-0 shadow-md bg-gray-800 text-white">
                <CardHeader className="bg-gray-800 rounded-t-lg border-b border-gray-700">
                  <CardTitle className="text-xl text-white">Gerenciar Pedidos</CardTitle>
                  <CardDescription className="text-gray-300">
                    Visualize e gerencie os pedidos do seu estabelecimento
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {pendingOrders.length > 0 ? (
                    <div className="space-y-4">
                      {pendingOrders.map((order) => (
                        <Card key={order.id} className={`border 
                          ${order.status === 'pending' ? 'border-amber-500/50 bg-amber-950/20' : 
                            order.status === 'accepted' ? 'border-green-500/50 bg-green-950/20' : 
                            order.status === 'completed' ? 'border-blue-500/50 bg-blue-950/20' :
                            'border-red-500/50 bg-red-950/20'} 
                          transition-all duration-200 hover:border-opacity-75 cursor-pointer`}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg text-white">Pedido #{order.id}</CardTitle>
                              <span className={`text-sm px-2 py-1 rounded-md font-medium ${
                                order.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                                order.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                                order.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {order.status === 'pending' ? 'Pendente' : 
                                 order.status === 'accepted' ? 'Aceito' : 
                                 order.status === 'completed' ? 'Finalizado' :
                                 'Rejeitado'}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-white">
                              <p className="text-sm text-gray-300">Mesa: #{order.tableNumber}</p>
                              <p className="font-medium">Total: R$ {order.total.toFixed(2)}</p>
                              
                              {/* Lista de itens do pedido */}
                              <div className="mt-3 space-y-2">
                                <p className="text-sm font-semibold text-gray-300">Itens do Pedido:</p>
                                {Array.isArray(order.items) && order.items.length > 0 ? (
                                  <ul className="space-y-1 pl-4">
                                    {order.items.map((item: any, idx: number) => (
                                      <li key={idx} className="text-sm text-gray-300">
                                        {item.quantity}x {item.name} - R$ {((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-gray-400 italic pl-4">Nenhum item cadastrado</p>
                                )}
                              </div>
                              
                              <div className="pt-2 border-t border-gray-600">
                                <p className="text-sm text-gray-400">
                                  Status pagamento: <span className="font-medium">{order.paymentStatus || 'pendente'}</span>
                                </p>
                              </div>
                              
                              {order.status === 'pending' && (
                                <div className="flex space-x-2 pt-2">
                                  <Button 
                                    size="sm" 
                                    variant="order-accept"
                                    onClick={() => handleAcceptOrder(order.id)}
                                  >
                                    <Check size={16} />
                                    Aceitar
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="border-red-500 text-red-400 hover:bg-red-900/20"
                                    onClick={() => handleRejectOrder(order.id)}
                                  >
                                    <X size={16} />
                                    Rejeitar
                                  </Button>
                                </div>
                              )}
                              
                              {order.status === 'accepted' && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                  <Button 
                                    size="sm" 
                                    variant="order-add"
                                    onClick={() => handleAllowMoreItems(order.id)}
                                  >
                                    <PlusCircle size={16} />
                                    Permitir Adicionar Itens
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="border-blue-500 text-blue-400 hover:bg-blue-900/20"
                                    onClick={() => handleCompleteOrder(order.id)}
                                  >
                                    <Package size={16} className="mr-1" />
                                    Finalizar Pedido
                                  </Button>
                                </div>
                              )}

                              {order.status === 'completed' && (
                                <div className="flex pt-2">
                                  <Button 
                                    size="sm"
                                    variant="outline"
                                    className="border-blink-primary text-blink-primary hover:bg-blink-primary/10"
                                    onClick={() => handleCheckout(order)}
                                  >
                                    <DoorOpen size={16} className="mr-1" />
                                    Liberar Cliente
                                  </Button>
                                 </div>
                               )}

                               {order.status === 'rejected' && (
                                 <div className="flex pt-2">
                                   <Button 
                                     size="sm"
                                     variant="outline"
                                     className="border-red-500 text-red-400 hover:bg-red-900/20"
                                     onClick={() => handleDeleteOrder(order.id)}
                                   >
                                     <X size={16} className="mr-1" />
                                     Excluir Pedido
                                   </Button>
                                 </div>
                               )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Alert className="bg-gray-700 border-gray-600">
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                      <AlertTitle className="text-gray-200">Nenhum pedido pendente</AlertTitle>
                      <AlertDescription className="text-gray-300">
                        Os novos pedidos aparecerão aqui quando os clientes fizerem seus pedidos.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'customers' && (
              <div className="space-y-6">
                {/* Clientes Atendendo */}
                <Card className="border-0 shadow-md bg-gray-800 text-white">
                  <CardHeader className="bg-gray-800 rounded-t-lg border-b border-gray-700">
                    <CardTitle className="text-xl text-white">Clientes Sendo Atendidos</CardTitle>
                    <CardDescription className="text-gray-300">
                      Mesas ocupadas e em atendimento
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {attendingCustomers.length > 0 ? (
                      <div className="space-y-4">
                        {attendingCustomers.map((customer) => (
                          <Card key={customer.id} className="border border-green-500/50 bg-green-950/20 hover:bg-green-950/30 cursor-pointer transition-all duration-200">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between">
                                <CardTitle className="text-lg text-white">Mesa #{customer.tableNumber}</CardTitle>
                                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-md font-medium">
                                  Atendendo
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 text-white">
                                <p className="text-sm text-gray-300">Início do atendimento: {customer.startTime}</p>
                                <p className="font-medium">Pessoas: {customer.people}</p>
                                <p className="font-medium">Pendente: R$ {customer.pendingAmount.toFixed(2)}</p>
                                <div className="flex space-x-2 pt-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="border-blue-500 text-blue-400 hover:bg-blue-900/20"
                                    onClick={() => handleFinalizeTable(customer.id)}
                                  >
                                    <DoorOpen size={16} className="mr-1" />
                                    Finalizar Mesa
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Alert className="bg-gray-700 border-gray-600">
                        <Info className="h-4 w-4 text-gray-400" />
                        <AlertTitle className="text-gray-200">Nenhum cliente sendo atendido</AlertTitle>
                        <AlertDescription className="text-gray-300">
                          As mesas ocupadas aparecerão aqui quando você preparar as mesas para os clientes.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Clientes Chegando */}
                <Card className="border-0 shadow-md bg-gray-800 text-white">
                  <CardHeader className="bg-gray-800 rounded-t-lg border-b border-gray-700">
                    <CardTitle className="text-xl text-white">Clientes Chegando</CardTitle>
                    <CardDescription className="text-gray-300">
                      Veja quem está a caminho do seu estabelecimento
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {arrivingCustomers > 0 ? (
                      <div className="space-y-4">
                        {Array.from({ length: arrivingCustomers }).map((_, index) => (
                          <Card key={index} className="border border-gray-700 bg-gray-700/50 hover:bg-gray-700 cursor-pointer transition-all duration-200">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between">
                                <CardTitle className="text-lg text-white">Cliente #{Math.floor(Math.random() * 1000) + 1000}</CardTitle>
                                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-medium">
                                  Chegando
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 text-white">
                                <p className="text-sm text-gray-300">Horário estimado: {new Date().getHours()}:{new Date().getMinutes() + Math.floor(Math.random() * 30)}</p>
                                <p className="font-medium">Pessoas: {Math.floor(Math.random() * 4) + 1}</p>
                                <p className="font-medium">Mesa: #{Math.floor(Math.random() * 20) + 1}</p>
                                <div className="flex space-x-2 pt-2">
                                  <Button 
                                    size="sm" 
                                    className="bg-blink-primary hover:bg-blink-primary/90 text-black"
                                    onClick={() => handlePrepareTable(index)}
                                  >
                                    Preparar Mesa
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Alert className="bg-gray-700 border-gray-600">
                        <Info className="h-4 w-4 text-gray-400" />
                        <AlertTitle className="text-gray-200">Nenhum cliente a caminho</AlertTitle>
                        <AlertDescription className="text-gray-300">
                          Os clientes que estiverem a caminho aparecerão aqui quando confirmarem sua reserva.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'notifications' && (
              <Card className="border-0 shadow-md bg-gray-800 text-white">
                <CardHeader className="bg-gray-800 rounded-t-lg border-b border-gray-700">
                  <CardTitle className="text-xl text-white">Notificações</CardTitle>
                  <CardDescription className="text-gray-300">
                    Acompanhe as atualizações do seu estabelecimento
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Alert className="bg-gray-700 border-gray-600">
                    <Bell className="h-4 w-4 text-gray-400" />
                    <AlertTitle className="text-gray-200">Nenhuma notificação no momento</AlertTitle>
                    <AlertDescription className="text-gray-300">
                      Fique atento às novidades do seu estabelecimento. As notificações aparecerão aqui.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {activeTab === 'settings' && (
              <EstablishmentSettings 
                establishment={establishment}
                onEstablishmentUpdate={setEstablishment}
              />
            )}
          </div>
        </div>
      </main>

      {/* Checkout Dialog */}
      {selectedOrder && (
        <CheckoutDialog
          isOpen={checkoutDialogOpen}
          onClose={handleCloseCheckoutDialog}
          orderId={typeof selectedOrder.id === 'string' ? parseInt(selectedOrder.id) : selectedOrder.id}
          tableNumber={selectedOrder.tableNumber}
        />
      )}
    </div>
  );
};

export default EstablishmentDashboard;
