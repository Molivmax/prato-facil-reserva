
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ProductsList from '@/components/ProductsList';
import AddProductForm from '@/components/AddProductForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const EstablishmentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [establishment, setEstablishment] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('products');
  const [pendingOrders, setPendingOrders] = useState(0);
  const [arrivingCustomers, setArrivingCustomers] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast.error('Você precisa estar logado para acessar esta página');
        navigate('/establishment-login');
        return;
      }
      
      setUser(data.session.user);
      fetchEstablishmentData(data.session.user.id);
    };

    checkAuth();

    // Simulação de pedidos pendentes e clientes chegando
    setPendingOrders(Math.floor(Math.random() * 5));
    setArrivingCustomers(Math.floor(Math.random() * 3));
  }, [navigate]);

  const fetchEstablishmentData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('establishments')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setEstablishment(data);
      } else {
        toast.error('Estabelecimento não encontrado');
        navigate('/partner-registration');
      }
    } catch (error: any) {
      console.error('Error fetching establishment:', error);
      toast.error(error.message || 'Erro ao carregar dados do estabelecimento');
    } finally {
      setLoading(false);
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700 hover:shadow-md transition-shadow text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-blink-primary" />
                Pedidos Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{pendingOrders}</div>
              <p className="text-sm text-gray-300 mt-1">
                {pendingOrders === 0 ? 'Nenhum pedido novo' : 'Aguardando atenção'}
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
                <BarChart className="h-5 w-5 mr-2 text-blink-primary" />
                Desempenho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">Bom</div>
              <p className="text-sm text-gray-300 mt-1">
                Avaliação média: 4.8/5
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
                    {pendingOrders > 0 && (
                      <span className="ml-2 bg-blink-primary text-black text-xs py-0.5 px-2 rounded-full">
                        {pendingOrders}
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
                    {arrivingCustomers > 0 && (
                      <span className="ml-2 bg-blink-primary text-black text-xs py-0.5 px-2 rounded-full">
                        {arrivingCustomers}
                      </span>
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    className={`justify-start rounded-none border-l-4 ${activeTab === 'notifications' ? 'border-l-blink-primary bg-black/20' : 'border-l-transparent'} text-white hover:bg-black/30`}
                    onClick={() => setActiveTab('notifications')}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Notificações
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
                    <ProductsList establishmentId={establishment.id} />
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
                  <AddProductForm 
                    establishmentId={establishment.id} 
                    onSuccess={() => {
                      setActiveTab('products');
                      toast.success('Produto adicionado com sucesso!');
                    }}
                  />
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
                  {pendingOrders > 0 ? (
                    <div className="space-y-4">
                      {Array.from({ length: pendingOrders }).map((_, index) => (
                        <Card key={index} className="border border-gray-700 bg-gray-700 hover:bg-gray-600 cursor-pointer transition-all duration-200">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <CardTitle className="text-lg text-white">Pedido #{Math.floor(Math.random() * 1000) + 1000}</CardTitle>
                              <span className="text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded-md font-medium">
                                Pendente
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-white">
                              <p className="text-sm text-gray-300">Mesa: #{Math.floor(Math.random() * 20) + 1}</p>
                              <p className="font-medium">Itens: {Math.floor(Math.random() * 5) + 1}</p>
                              <p className="font-medium">Total: R$ {(Math.random() * 100 + 20).toFixed(2)}</p>
                              <div className="flex space-x-2 pt-2">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  Aceitar
                                </Button>
                                <Button size="sm" variant="outline" className="border-red-300 text-red-500 hover:bg-red-900/20">
                                  Rejeitar
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
                        <Card key={index} className="border border-gray-700 bg-gray-700 hover:bg-gray-600 cursor-pointer transition-all duration-200">
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
                                <Button size="sm" className="bg-blink-primary hover:bg-blink-primary/90 text-black">
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default EstablishmentDashboard;
