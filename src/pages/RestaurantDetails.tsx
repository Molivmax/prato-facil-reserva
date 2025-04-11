
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Clock, Phone, Calendar, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { getRestaurantById } from '@/data/mockData';
import { Restaurant } from '@/data/types';
import { useToast } from '@/hooks/use-toast';

const RestaurantDetails = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      // Simulando uma chamada de API
      setTimeout(() => {
        const restaurantData = getRestaurantById(id);
        if (restaurantData) {
          setRestaurant(restaurantData);
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
  }, [id, navigate, toast]);

  const handleReserve = () => {
    if (id) {
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
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <div className="relative h-64 rounded-lg overflow-hidden mb-6">
          <img 
            src={restaurant.image} 
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md">
            <div className="flex items-center">
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <span className="ml-1 font-bold">{restaurant.rating}</span>
            </div>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
        <p className="text-gray-600 mb-4">{restaurant.cuisine}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center">
              <MapPin className="h-5 w-5 text-restaurant-primary mr-2" />
              <div>
                <p className="text-sm font-medium">Endereço</p>
                <p className="text-sm text-gray-600">{restaurant.address}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center">
              <Clock className="h-5 w-5 text-restaurant-primary mr-2" />
              <div>
                <p className="text-sm font-medium">Horário</p>
                <p className="text-sm text-gray-600">{restaurant.openingHours}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center">
              <Phone className="h-5 w-5 text-restaurant-primary mr-2" />
              <div>
                <p className="text-sm font-medium">Telefone</p>
                <p className="text-sm text-gray-600">{restaurant.phoneNumber}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Sobre</h2>
          <p className="text-gray-700">{restaurant.description}</p>
        </div>
        
        <div className="flex justify-center">
          <Button 
            size="lg" 
            className="bg-restaurant-primary hover:bg-restaurant-dark"
            onClick={handleReserve}
          >
            <Calendar className="mr-2 h-5 w-5" />
            Reservar mesa
          </Button>
        </div>
      </div>
    </>
  );
};

export default RestaurantDetails;
