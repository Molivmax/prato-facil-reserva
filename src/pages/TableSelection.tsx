
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Users, Clock, Navigation } from 'lucide-react';
import Navbar from '@/components/Navbar';
import TableItem from '@/components/TableItem';
import { getRestaurantById, getTablesByRestaurantId } from '@/data/mockData';
import { Restaurant, Table } from '@/data/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const TableSelection = () => {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [estimatedArrival, setEstimatedArrival] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          
          // Simulate estimated arrival time (5-15 minutes)
          setEstimatedArrival(Math.floor(Math.random() * 10) + 5);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default estimated time if location access is denied
          setEstimatedArrival(10);
        }
      );
    }
    
    if (restaurantId) {
      const fetchData = async () => {
        setLoading(true);
        
        try {
          // Fetch from Supabase
          const { data: establishmentData, error } = await supabase
            .from('establishments')
            .select('*')
            .eq('id', restaurantId)
            .single();

          if (error || !establishmentData) {
            throw error;
          }

          // Convert Supabase data to Restaurant type
          const restaurantData: Restaurant = {
            id: establishmentData.id,
            name: establishmentData.name,
            image: establishmentData.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            rating: 4.5, // Default rating
            cuisine: establishmentData.description || 'Variado',
            distance: '1.2 km', // Default distance
            address: establishmentData.address || 'Endereço não disponível',
            openingHours: establishmentData.working_hours || 'Horário não disponível',
            description: establishmentData.description || 'Sem descrição disponível',
            phoneNumber: establishmentData.contact || 'Telefone não disponível'
          };
          
          setRestaurant(restaurantData);
          
          // Get tables (still from mock data for now, would be from Supabase in production)
          const tableData = getTablesByRestaurantId(restaurantId);
          setTables(tableData);
        } catch (error) {
          console.error("Error fetching restaurant data:", error);
          toast({
            title: "Erro",
            description: "Restaurante não encontrado",
            variant: "destructive",
          });
          navigate('/search');
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [restaurantId, navigate, toast]);

  const handleTableSelect = (tableId: string) => {
    setSelectedTable(tableId);
  };

  const handleContinue = () => {
    if (selectedTable && restaurantId) {
      // Simulate notifying the restaurant about the reservation
      notifyRestaurant();
      
      navigate(`/menu-selection/${restaurantId}/${selectedTable}`);
    } else {
      toast({
        title: "Selecione uma mesa",
        description: "Por favor, selecione uma mesa para continuar",
        variant: "destructive",
      });
    }
  };
  
  const notifyRestaurant = () => {
    // In a real app, this would send data to a backend service
    console.log("Notifying restaurant about reservation:", {
      restaurantId,
      tableId: selectedTable,
      estimatedArrival,
      userLocation
    });
    
    // Show confirmation toast to user
    toast({
      title: "Restaurante notificado",
      description: `${restaurant?.name} foi notificado sobre sua reserva. Tempo estimado de chegada: ${estimatedArrival} minutos.`,
      variant: "default",
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container max-w-4xl mx-auto px-4 py-12 flex justify-center">
          <div className="animate-pulse w-full">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-10 bg-gray-200 rounded w-full max-w-xs mx-auto"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <h1 className="text-2xl font-bold mb-2">Escolha sua mesa</h1>
        <p className="text-gray-600 mb-6">
          {restaurant?.name} • Selecione uma mesa disponível
        </p>
        
        {estimatedArrival && (
          <Card className="mb-4 bg-restaurant-light border-restaurant-primary">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Navigation className="h-5 w-5 text-restaurant-primary mr-2" />
                <div>
                  <p className="font-medium">Tempo estimado de chegada:</p>
                  <p className="text-restaurant-primary font-bold">{estimatedArrival} minutos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Mapa de mesas</h2>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-restaurant-light border border-restaurant-primary rounded-sm mr-2"></div>
                  <span className="text-sm">Disponível</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded-sm mr-2"></div>
                  <span className="text-sm">Indisponível</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-restaurant-primary rounded-sm mr-2"></div>
                  <span className="text-sm">Selecionada</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {tables.map(table => (
                <TableItem
                  key={table.id}
                  id={table.id}
                  number={table.number}
                  seats={table.seats}
                  available={table.available}
                  selected={selectedTable === table.id}
                  onSelect={handleTableSelect}
                />
              ))}
            </div>
            
            {selectedTable && (
              <div className="mt-6 bg-restaurant-light p-4 rounded-lg">
                <h3 className="font-medium">Mesa selecionada:</h3>
                <div className="flex items-center mt-2">
                  <div className="w-12 h-12 bg-restaurant-primary text-white rounded-lg flex items-center justify-center mr-3">
                    {tables.find(t => t.id === selectedTable)?.number}
                  </div>
                  <div>
                    <p className="font-medium">Mesa {tables.find(t => t.id === selectedTable)?.number}</p>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{tables.find(t => t.id === selectedTable)?.seats} pessoas</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="flex justify-center">
          <Button 
            size="lg" 
            className="bg-restaurant-primary hover:bg-restaurant-dark"
            onClick={handleContinue}
            disabled={!selectedTable}
          >
            Continuar
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default TableSelection;
