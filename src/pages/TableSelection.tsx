
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { LoaderCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import TableItem from '@/components/TableItem';
import { Restaurant, Table } from '@/data/types';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

const TableSelection = () => {
  const { id: restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (restaurantId) {
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
            
            // Fetch or generate mock tables
            const mockTables: Table[] = [
              { id: "table-1", number: 1, seats: 2, status: "available" },
              { id: "table-2", number: 2, seats: 2, status: "available" },
              { id: "table-3", number: 3, seats: 4, status: "available" },
              { id: "table-4", number: 4, seats: 4, status: "available" },
              { id: "table-5", number: 5, seats: 6, status: "unavailable" },
              { id: "table-6", number: 6, seats: 6, status: "available" },
              { id: "table-7", number: 7, seats: 8, status: "available" },
              { id: "table-8", number: 8, seats: 8, status: "unavailable" },
            ];
            setTables(mockTables);
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
  }, [restaurantId, navigate, toast]);
  
  const handleTableSelect = (tableId: string) => {
    setSelectedTable(tableId);
  };
  
  const handleContinue = () => {
    if (!selectedTable) {
      toast({
        title: "Selecione uma mesa",
        description: "Por favor, selecione uma mesa para continuar",
        variant: "destructive",
      });
      return;
    }

    if (restaurantId) {
      navigate(`/restaurant/${restaurantId}/menu/${selectedTable}`);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container max-w-4xl mx-auto px-4 py-12 flex justify-center items-center min-h-[60vh]">
          <LoaderCircle className="h-8 w-8 text-restaurant-primary animate-spin" />
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
              onClick={() => navigate('/search')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a busca
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 py-8 pb-24">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{restaurant.name}</h1>
            <p className="text-gray-600">Selecione uma mesa disponível</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-restaurant-light border border-restaurant-primary mr-2"></div>
                <span className="text-sm">Disponível</span>
              </div>
              
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-gray-200 border border-gray-300 mr-2"></div>
                <span className="text-sm">Indisponível</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {tables.map((table) => (
            <TableItem 
              key={table.id}
              table={table}
              selected={selectedTable === table.id}
              onClick={() => table.status === 'available' ? handleTableSelect(table.id) : null}
            />
          ))}
        </div>
        
        <Button 
          className="w-full md:w-auto bg-restaurant-primary hover:bg-restaurant-dark font-bold"
          size="lg"
          disabled={!selectedTable}
          onClick={handleContinue}
        >
          Continuar
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </>
  );
};

export default TableSelection;
