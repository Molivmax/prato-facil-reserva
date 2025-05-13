
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, History } from 'lucide-react';
import Navbar from '@/components/Navbar';
import RestaurantCard from '@/components/RestaurantCard';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from 'react-router-dom';

const SearchRestaurants = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [establishments, setEstablishments] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEstablishments();
    checkNewUser();
  }, []);

  const checkNewUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profile) {
        setShowPaymentDialog(true);
      }
    }
  };

  const fetchEstablishments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('establishments')
        .select('*');
      
      if (error) throw error;
      
      setEstablishments(data || []);
    } catch (error) {
      console.error('Error fetching establishments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEstablishments = () => {
    let filtered = [...establishments];
    
    if (searchTerm) {
      filtered = filtered.filter(
        establishment => 
          establishment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          establishment.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const handleSetupPayment = () => {
    navigate('/payment-setup');
    setShowPaymentDialog(false);
  };

  return (
    <>
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Encontre um restaurante</h1>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou tipo de estabelecimento"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Tabs defaultValue="all" className="mb-8" onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="nearby" className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              Próximos
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center">
              <History className="h-4 w-4 mr-1" />
              Recentes
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {activeTab === 'nearby' 
              ? 'Estabelecimentos próximos' 
              : activeTab === 'recent'
                ? 'Suas últimas visitas'
                : 'Estabelecimentos disponíveis'}
          </h2>
          
          {isLoading ? (
            <div className="text-center py-10">
              <p className="text-gray-500">Carregando estabelecimentos...</p>
            </div>
          ) : filterEstablishments().length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filterEstablishments().map(establishment => (
                <RestaurantCard
                  key={establishment.id}
                  id={establishment.id}
                  name={establishment.name}
                  image={establishment.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'}
                  rating={4.5} // Default rating
                  cuisine={establishment.description || 'Variado'}
                  distance="1.2 km" // Default distance
                  address={establishment.address || establishment.city || 'Endereço não disponível'}
                  openingHours={establishment.working_hours || 'Horário não disponível'}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Nenhum estabelecimento encontrado.</p>
              <Button 
                variant="link" 
                className="text-restaurant-primary mt-2"
                onClick={() => {
                  setSearchTerm('');
                  setActiveTab('all');
                }}
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Forma de Pagamento</DialogTitle>
            <DialogDescription>
              Para uma melhor experiência, recomendamos configurar sua forma de pagamento agora.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button
              variant="default"
              onClick={handleSetupPayment}
              className="bg-restaurant-primary hover:bg-restaurant-dark"
            >
              Configurar Agora
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
            >
              Deixar para depois
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SearchRestaurants;
