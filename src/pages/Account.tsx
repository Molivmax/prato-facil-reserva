import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Lock, 
  Camera, 
  CreditCard, 
  Bell, 
  Shield,
  ArrowLeft,
  Upload,
  Save,
  Eye,
  EyeOff,
  ShoppingBag,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Account = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Você precisa estar logado para acessar esta página');
        navigate('/login');
        return;
      }

      setUser(session.user);
      
      // Fetch user data from users table
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
      } else if (userProfile) {
        setUserData({
          name: userProfile.name || '',
          email: userProfile.email || session.user.email || '',
          phone: userProfile.phone || ''
        });
      }

      // Load profile image if exists
      const { data: avatarData } = await supabase.storage
        .from('avatars')
        .list(`${session.user.id}/`);

      if (avatarData && avatarData.length > 0) {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(`${session.user.id}/${avatarData[0].name}`);
        setProfileImage(publicUrl);
      }

      // Fetch user orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      } else {
        setOrders(ordersData || []);
      }

    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Erro ao carregar dados da conta');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('users')
        .update({
          name: userData.name,
          phone: userData.phone
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Tem certeza que deseja excluir este pedido?')) {
      return;
    }

    try {
      setDeletingOrderId(orderId);
      
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove da lista local
      setOrders(orders.filter(order => order.id !== orderId));
      
      toast.success('Pedido excluído com sucesso!');
    } catch (error: any) {
      console.error('Error deleting order:', error);
      toast.error('Erro ao excluir pedido');
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast.success('Senha alterada com sucesso!');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error('Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfileImage(publicUrl);
      toast.success('Foto de perfil atualizada!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-900 text-white border-b border-gray-800">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Minha Conta</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileImage || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{userData.name || 'Usuário'}</h2>
                <p className="text-gray-400">{userData.email}</p>
                <p className="text-gray-400">{userData.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800">
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary">
              <User className="h-4 w-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-primary">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-primary">
              <Lock className="h-4 w-4 mr-2" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-primary">
              <CreditCard className="h-4 w-4 mr-2" />
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-primary">
              <Bell className="h-4 w-4 mr-2" />
              Notificações
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Informações Pessoais</CardTitle>
                <CardDescription className="text-gray-400">
                  Atualize suas informações de perfil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-200">Nome completo</Label>
                    <Input
                      id="name"
                      value={userData.name}
                      onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-200">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userData.email}
                      disabled
                      className="bg-gray-700 border-gray-600 text-gray-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-200">Telefone</Label>
                  <Input
                    id="phone"
                    value={userData.phone}
                    onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <Button 
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Meus Pedidos</CardTitle>
                <CardDescription className="text-gray-400">
                  Histórico de pedidos realizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Nenhum pedido encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div 
                        key={order.id}
                        className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-white font-semibold">
                              Pedido #{order.id.slice(0, 8)}
                            </p>
                            <p className="text-gray-400 text-sm">
                              Mesa {order.table_number}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold">
                              R$ {Number(order.total_amount).toFixed(2)}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded ${
                              order.order_status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              order.order_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              order.order_status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {order.order_status === 'completed' ? 'Concluído' :
                               order.order_status === 'pending' ? 'Pendente' :
                               order.order_status === 'rejected' ? 'Rejeitado' :
                               order.order_status}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {new Date(order.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-600"
                            onClick={() => navigate(`/order-tracking/${order.id}`)}
                          >
                            Ver Detalhes
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                            onClick={() => handleDeleteOrder(order.id)}
                            disabled={deletingOrderId === order.id}
                          >
                            {deletingOrderId === order.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Alterar Senha</CardTitle>
                <CardDescription className="text-gray-400">
                  Mantenha sua conta segura com uma senha forte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-gray-200">Senha atual</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-gray-200">Nova senha</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-gray-200">Confirmar nova senha</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={handleChangePassword}
                  disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Alterar Senha
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Métodos de Pagamento</CardTitle>
                <CardDescription className="text-gray-400">
                  Gerencie seus cartões e métodos de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">Nenhum método de pagamento cadastrado</p>
                  <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                    Adicionar Cartão
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Preferências de Notificação</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure como você deseja receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Configurações de notificação em breve</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Account;