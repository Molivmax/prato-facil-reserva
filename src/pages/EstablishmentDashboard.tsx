
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Settings,
  TableProperties
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ProductsList from '@/components/ProductsList';
import AddProductForm from '@/components/AddProductForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import CheckoutDialog from '@/components/CheckoutDialog';
import EstablishmentSettings from '@/components/EstablishmentSettings';
import DailyRevenue from '@/components/DailyRevenue';
import AssignTableDialog from '@/components/AssignTableDialog';

// Define order status type
type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

// Define order interface
interface Order {
  id: string | number;
  dailyNumber?: number;
  tableNumber: number;
  itemCount: number;
  total: number;
  status: OrderStatus;
  canAddMore: boolean;
  paymentStatus?: string;
  orderStatus?: string;
  items?: any;
  user_id?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  partySize?: number;
  assignedTable?: number;
  customerLocation?: any;
  estimatedArrival?: string | null;
  created_at?: string;
}

// Payment Status Badge Helper
const getPaymentStatusBadge = (status: string) => {
  const statusConfig = {
    paid: {
      icon: '✅',
      label: 'Pago',
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-400',
      borderColor: 'border-green-500/50'
    },
    pending: {
      icon: '⏳',
      label: 'Pendente',
      bgColor: 'bg-yellow-500/20',
      textColor: 'text-yellow-400',
      borderColor: 'border-yellow-500/50'
    },
    pindura: {
      icon: '📋',
      label: 'Pindura',
      bgColor: 'bg-purple-500/20',
      textColor: 'text-purple-400',
      borderColor: 'border-purple-500/50'
    },
    pay_at_location: {
      icon: '🏪',
      label: 'Pagar no Local',
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/50'
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${config.bgColor} ${config.borderColor}`}>
      <span>{config.icon}</span>
      <span className={`text-xs font-semibold ${config.textColor}`}>{config.label}</span>
    </div>
  );
};

const formatETA = (estimatedArrival: string | null) => {
  if (!estimatedArrival) return 'Não informado';
  
  const now = new Date();
  const eta = new Date(estimatedArrival);
  const diffMs = eta.getTime() - now.getTime();
  const diffMins = Math.ceil(diffMs / 60000);
  
  if (diffMins <= 0) return '⚠️ Deveria ter chegado';
  if (diffMins <= 7) return `🔥 ${diffMins} min (PREPARAR!)`;
  return `${diffMins} min`;
};

const formatClientDisplay = (
  customerName: string | undefined, 
  assignedTable: number | undefined, 
  dailyNumber: number | undefined
): string => {
  const name = customerName || "Cliente";
  const table = assignedTable ? `Mesa ${assignedTable}` : "";
  const number = dailyNumber ? `Cliente #${String(dailyNumber).padStart(2, '0')}` : "";
  
  return [name, table, number].filter(Boolean).join(' - ');
};

const getServiceTime = (createdAt: string): string => {
  const startTime = new Date(createdAt);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);
  
  if (diffMinutes < 60) {
    return `há ${diffMinutes} min`;
  } else {
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `há ${hours}h ${minutes}min`;
  }
};

const EstablishmentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [establishment, setEstablishment] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('products');
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [arrivingCustomers, setArrivingCustomers] = useState(0);
  const [attendingCustomers, setAttendingCustomers] = useState<Order[]>([]);
  const [finalizedCustomers, setFinalizedCustomers] = useState(0);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [hasMPCredentials, setHasMPCredentials] = useState<boolean>(false);
  const [checkingCredentials, setCheckingCredentials] = useState(true);
  const [assignTableDialogOpen, setAssignTableDialogOpen] = useState(false);
  const [selectedOrderForTable, setSelectedOrderForTable] = useState<Order | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
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

  const fetchCustomerInfo = async (userId: string) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('name, phone, email')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching customer info:', error);
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Error in fetchCustomerInfo:', error);
      return null;
    }
  };

  const fetchEstablishmentOrders = async (establishmentId: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('establishment_id', establishmentId)
        .in('payment_status', ['pending', 'paid'])
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }
      
      if (orders && orders.length > 0) {
        const formattedOrders = orders.map((order, index) => ({
          id: order.id,
          dailyNumber: index + 1,
          tableNumber: order.table_number,
          itemCount: Array.isArray(order.items) ? order.items.length : 0,
          total: Number(order.total_amount),
          status: (order.order_status === 'pending' ? 'pending' : 'accepted') as OrderStatus,
          canAddMore: order.order_status === 'confirmed',
          paymentStatus: order.payment_status,
          orderStatus: order.order_status,
          items: order.items,
          user_id: order.user_id,
          partySize: order.party_size || 2,
          assignedTable: order.assigned_table,
          customerLocation: order.customer_location,
          estimatedArrival: order.estimated_arrival_time,
          created_at: order.created_at,
        }));
        
        // Buscar informações de clientes para pedidos confirmados
        const ordersWithCustomers = await Promise.all(
          formattedOrders.map(async (order) => {
            if (order.user_id && order.paymentStatus === 'paid') {
              const customerInfo = await fetchCustomerInfo(order.user_id);
              if (customerInfo) {
                return {
                  ...order,
                  customerName: customerInfo.name,
                  customerPhone: customerInfo.phone,
                  customerEmail: customerInfo.email,
                };
              }
            }
            return order;
          })
        );
        
        // Separar pedidos pendentes (ainda não pagos)
        const pending = ordersWithCustomers.filter(o => 
          o.paymentStatus === 'pending' && o.orderStatus === 'pending'
        );
        
        // Separar pedidos confirmados (pagos) incluindo cancelados
        const confirmed = ordersWithCustomers.filter(o => 
          o.paymentStatus === 'paid' && 
          (o.orderStatus === 'confirmed' || o.orderStatus === 'cancelled_by_customer')
        );
        
        // Clientes REALMENTE a caminho (com localização ativa)
        const arriving = ordersWithCustomers.filter(o => 
          o.paymentStatus === 'paid' && 
          o.orderStatus === 'confirmed' &&
          o.customerLocation && 
          o.estimatedArrival
        );
        
        setPendingOrders([...pending, ...confirmed]); // Mostrar AMBOS na aba Pedidos
        setArrivingCustomers(arriving.length); // Só quem está REALMENTE a caminho
        setAttendingCustomers(confirmed); // Pedidos confirmados (pagos)
        
        console.log('Orders loaded:', { 
          pending: pending.length, 
          confirmed: confirmed.length,
          totalOrders: [...pending, ...confirmed].length 
        });
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
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `establishment_id=eq.${establishment.id}`
        },
        (payload) => {
          console.log('New order received via real-time:', payload);
          toast.success('Novo pedido recebido!', {
            description: 'Um cliente acabou de fazer um pedido',
          });
          fetchEstablishmentOrders(establishment.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `establishment_id=eq.${establishment.id}`
        },
        (payload) => {
          console.log('Order updated via real-time:', payload);
          
          // Detectar se foi adição de itens
          const oldItems = JSON.parse((payload.old as any).items || '[]');
          const newItems = JSON.parse((payload.new as any).items || '[]');
          
          if (newItems.length > oldItems.length) {
            const addedCount = newItems.length - oldItems.length;
            toast.info(`🔔 Mesa ${(payload.new as any).assigned_table} adicionou ${addedCount} itens!`, {
              description: `Novo total: R$ ${(payload.new as any).total_amount}`,
            });
          }
          
          fetchEstablishmentOrders(establishment.id);
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    // Listener para notificações de clientes
    const notificationsChannel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customer_notifications',
          filter: `establishment_id=eq.${establishment.id}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          const notification = payload.new as any;
          
          toast.info(`🔔 ${notification.message}`, {
            description: 'Veja na aba Notificações',
          });
          
          fetchNotifications(establishment.id);
        }
      )
      .subscribe();
      
    fetchNotifications(establishment.id);
      
    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [establishment?.id]);

  const fetchNotifications = async (establishmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_notifications')
        .select('*')
        .eq('establishment_id', establishmentId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('customer_notifications')
        .update({ 
          is_read: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      toast.success('Notificação resolvida!');
      
      if (establishment?.id) {
        fetchNotifications(establishment.id);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Erro ao resolver notificação');
    }
  };

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
  const handleAcceptOrder = async (orderId: string | number) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          order_status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId.toString());

      if (error) throw error;

      toast.success('Cliente aceito!', {
        description: 'Cliente foi notificado e está confirmado',
      });
      
      // O real-time irá atualizar automaticamente
    } catch (error) {
      console.error('Erro ao aceitar pedido:', error);
      toast.error('Não foi possível aceitar o pedido');
    }
  };

  // Function to handle rejecting an order
  const handleRejectOrder = async (orderId: string | number) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          order_status: 'cancelled_by_establishment',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId.toString());

      if (error) throw error;

      // Remover do estado local
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
      
      toast.error('Pedido recusado', {
        description: 'Cliente foi notificado sobre o cancelamento',
      });
    } catch (error) {
      console.error('Erro ao recusar pedido:', error);
      toast.error('Não foi possível recusar o pedido');
    }
  };

  // Function to handle completing an order
  const handleCompleteOrder = async (orderId: string | number) => {
    try {
      // 1. Atualizar no banco de dados
      const { error } = await supabase
        .from('orders')
        .update({ 
          order_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId.toString());

      if (error) throw error;

      // 2. Remover do estado local
      setAttendingCustomers(prev => prev.filter(c => c.id !== orderId));
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
      
      // 3. Incrementar contador
      setFinalizedCustomers(prev => prev + 1);

      // 4. Notificar sucesso
      toast.success('Atendimento finalizado!', {
        description: 'Cliente foi notificado e pode avaliar o atendimento',
      });
    } catch (error) {
      console.error('Erro ao finalizar atendimento:', error);
      toast.error('Não foi possível finalizar o atendimento');
    }
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
    // This function is kept for backward compatibility but not used anymore
    setArrivingCustomers(prev => Math.max(0, prev - 1));
    toast.success(`Cliente preparado para atendimento.`);
  };

  // Function to handle assigning a table to an order
  const handleAssignTable = (order: Order) => {
    setSelectedOrderForTable(order);
    setAssignTableDialogOpen(true);
  };

  // Function to handle finalizing a table (send payment reminder)
  const handleFinalizeTable = (orderId: string | number) => {
    const order = attendingCustomers.find(c => c.id === orderId);
    if (!order) return;
    
    // Simulate finalizing the order
    toast.success(`Mesa #${order.tableNumber} finalizada! Total: R$ ${order.total.toFixed(2)}`);
    
    // Remove customer from attending list
    setTimeout(() => {
      setAttendingCustomers(prev => prev.filter(c => c.id !== orderId));
      setFinalizedCustomers(prev => prev + 1);
      toast.success(`Mesa #${order.tableNumber} liberada!`);
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
                    className={`justify-start rounded-none border-l-4 ${activeTab === 'clients' ? 'border-l-blink-primary bg-black/20' : 'border-l-transparent'} text-white hover:bg-black/30`}
                    onClick={() => setActiveTab('clients')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Clientes
                    {pendingOrders.length > 0 && (
                      <span className="ml-2 bg-blink-primary text-black text-xs py-0.5 px-2 rounded-full">
                        {pendingOrders.length}
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
                    {notifications.length > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs py-0.5 px-2 rounded-full">
                        {notifications.length}
                      </span>
                    )}
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

            {activeTab === 'clients' && (
              <div className="space-y-6">
                
                {/* ========== SEÇÃO 1: NOVOS CLIENTES (Pedidos Pendentes) ========== */}
                <Card className="border-0 shadow-md bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">
                      👋 Novos Clientes ({pendingOrders.filter(o => o.status === 'pending').length})
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Aguardando sua confirmação
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {pendingOrders.filter(o => o.status === 'pending').length > 0 ? (
                      <div className="space-y-4">
                        {pendingOrders
                          .filter(o => o.status === 'pending')
                          .map((order) => (
                            <Card key={order.id} className="border-amber-500/50 bg-amber-950/20">
                              <CardHeader>
                                <div className="flex justify-between items-center">
                                  <CardTitle className="text-lg text-white">
                                    {order.dailyNumber ? `Cliente #${String(order.dailyNumber).padStart(2, '0')}` : `Pedido #${order.id}`}
                                    {order.customerName && ` - ${order.customerName}`}
                                  </CardTitle>
                                  <Badge className="bg-amber-500 text-white">Novo</Badge>
                                </div>
                                <CardDescription className="text-gray-300">
                                  Mesa {order.tableNumber} • {order.partySize || 2} pessoas
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2 text-white">
                                  {order.customerPhone && (
                                    <p className="text-sm text-gray-300">📞 {order.customerPhone}</p>
                                  )}
                                  <p className="font-medium">🍽️ {order.itemCount} itens • R$ {order.total.toFixed(2)}</p>
                                  
                                  {Array.isArray(order.items) && order.items.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                      <p className="text-sm font-semibold text-gray-300">Itens do Pedido:</p>
                                      <ul className="space-y-1 pl-4">
                                        {order.items.map((item: any, idx: number) => (
                                          <li key={idx} className="text-sm text-gray-300">
                                            {item.quantity}x {item.name} - R$ {((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  
                                  <div className="pt-2 border-t border-gray-600">
                                    {getPaymentStatusBadge(order.paymentStatus || 'pending')}
                                  </div>
                                  
                                  <div className="flex space-x-2 pt-4">
                                    <Button 
                                      onClick={() => handleAcceptOrder(order.id)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Check className="mr-2" size={16} />
                                      Aceitar Cliente
                                    </Button>
                                    <Button 
                                      onClick={() => handleRejectOrder(order.id)}
                                      variant="outline"
                                      className="border-red-500 text-red-400"
                                    >
                                      <X className="mr-2" size={16} />
                                      Recusar
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    ) : (
                      <Alert className="bg-gray-700 border-gray-600">
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                        <AlertTitle className="text-gray-200">Nenhum cliente novo</AlertTitle>
                        <AlertDescription className="text-gray-300">
                          Novos clientes aparecerão aqui quando fizerem pedidos
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* ========== SEÇÃO 2: CLIENTES CONFIRMADOS (Aguardando Mesa) ========== */}
                <Card className="border-0 shadow-md bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">
                      ✅ Clientes Confirmados ({pendingOrders.filter(o => o.status === 'accepted' && !o.assignedTable).length})
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Aguardando atribuição de mesa
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {pendingOrders.filter(o => o.status === 'accepted' && !o.assignedTable).length > 0 ? (
                      <div className="space-y-4">
                        {pendingOrders
                          .filter(o => o.status === 'accepted' && !o.assignedTable)
                          .map((order) => (
                            <Card key={order.id} className="border-green-400/50 bg-green-950/20">
                              <CardHeader>
                                <div className="flex justify-between items-center">
                                  <CardTitle className="text-lg text-white">
                                    {order.dailyNumber ? `Cliente #${String(order.dailyNumber).padStart(2, '0')}` : `Pedido #${order.id}`}
                                    {order.customerName && ` - ${order.customerName}`}
                                  </CardTitle>
                                  <Badge className="bg-green-500 text-white">Confirmado</Badge>
                                </div>
                                <CardDescription className="text-gray-300">
                                  Aguardando mesa
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2 text-white">
                                  {order.customerPhone && (
                                    <p className="text-sm text-gray-300">📞 {order.customerPhone}</p>
                                  )}
                                  {getPaymentStatusBadge(order.paymentStatus || 'pending')}
                                  <p className="font-medium mt-2">🍽️ {order.itemCount} itens • R$ {order.total.toFixed(2)}</p>
                                  
                                  <Button 
                                    onClick={() => handleAssignTable(order)}
                                    className="bg-blue-600 hover:bg-blue-700 mt-4 w-full"
                                  >
                                    🪑 Atribuir Mesa
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    ) : (
                      <Alert className="bg-gray-700 border-gray-600">
                        <Info className="h-4 w-4 text-gray-400" />
                        <AlertTitle className="text-gray-200">Nenhum cliente aguardando</AlertTitle>
                        <AlertDescription className="text-gray-300">
                          Clientes confirmados sem mesa aparecerão aqui
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* ========== SEÇÃO 3: CLIENTES NO SALÃO (Mesas Ocupadas) ========== */}
                <Card className="border-0 shadow-md bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">
                      🍽️ Clientes no Salão ({attendingCustomers.length})
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Sendo atendidos no momento
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {attendingCustomers.length > 0 ? (
                      <div className="space-y-4">
                        {attendingCustomers.map((order) => (
                          <Card key={order.id} className="border-green-600/50 bg-green-950/30">
                            <CardHeader>
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-lg text-white">
                                  {formatClientDisplay(order.customerName, order.assignedTable, order.dailyNumber)}
                                </CardTitle>
                                <Badge className="bg-green-600 text-white">No Salão</Badge>
                              </div>
                              <CardDescription className="text-gray-300">
                                Sendo atendido • {order.created_at ? getServiceTime(order.created_at) : ''}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 text-white">
                                {order.customerPhone && (
                                  <p className="text-sm text-gray-300">📞 {order.customerPhone}</p>
                                )}
                                {getPaymentStatusBadge(order.paymentStatus || 'pending')}
                                <p className="font-medium mt-2">🍽️ {order.itemCount} itens • R$ {order.total.toFixed(2)}</p>
                                
                                <Button 
                                  onClick={() => handleCompleteOrder(order.id)}
                                  className="bg-blink-primary hover:bg-blink-primary/90 text-black mt-4 w-full"
                                >
                                  🍽️ Finalizar Atendimento
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Alert className="bg-gray-700 border-gray-600">
                        <Info className="h-4 w-4 text-gray-400" />
                        <AlertTitle className="text-gray-200">Nenhum cliente no salão</AlertTitle>
                        <AlertDescription className="text-gray-300">
                          Mesas ocupadas aparecerão aqui
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
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notificações
                    {notifications.length > 0 && (
                      <Badge className="bg-red-500">{notifications.length}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Chamados e solicitações dos clientes
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {notifications.length > 0 ? (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <Card key={notification.id} className="border-yellow-600/50 bg-yellow-950/30">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg text-white">
                                  {notification.notification_type === 'call_waiter' && '🔔 Garçom Chamado'}
                                </CardTitle>
                                <CardDescription className="text-gray-300">
                                  Mesa {notification.table_number} • {new Date(notification.created_at).toLocaleString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </CardDescription>
                              </div>
                              <Badge className="bg-yellow-600">Pendente</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-white">{notification.message}</p>
                            <Button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Marcar como Resolvido
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Alert className="bg-gray-700 border-gray-600">
                      <Bell className="h-4 w-4 text-gray-400" />
                      <AlertTitle className="text-gray-200">Nenhuma notificação pendente</AlertTitle>
                      <AlertDescription className="text-gray-300">
                        As solicitações dos clientes aparecerão aqui.
                      </AlertDescription>
                    </Alert>
                  )}
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

      {/* Assign Table Dialog */}
      {selectedOrderForTable && (
        <AssignTableDialog
          open={assignTableDialogOpen}
          onOpenChange={setAssignTableDialogOpen}
          orderId={selectedOrderForTable.id}
          partySize={selectedOrderForTable.partySize || 2}
          currentTableNumber={selectedOrderForTable.tableNumber}
        />
      )}
    </div>
  );
};

export default EstablishmentDashboard;
