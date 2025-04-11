
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, History } from 'lucide-react';
import Navbar from '@/components/Navbar';
import RestaurantCard from '@/components/RestaurantCard';
import { restaurants } from '@/data/mockData';
import { Restaurant } from '@/data/types';

const SearchRestaurants = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(restaurants);
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    handleSearch();
  }, [searchTerm, activeTab]);
  
  const handleSearch = () => {
    let results = restaurants;
    
    if (searchTerm) {
      results = results.filter(
        restaurant => 
          restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase()) ||
          restaurant.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (activeTab !== 'all') {
      // Simulando filtros por categoria
      switch (activeTab) {
        case 'nearby':
          results = results.filter(r => parseFloat(r.distance.split(' ')[0]) < 1.5);
          break;
        case 'popular':
          results = results.filter(r => r.rating >= 4.7);
          break;
        case 'recent':
          // Simulando restaurantes visitados recentemente
          results = [results[0], results[2]];
          break;
      }
    }
    
    setFilteredRestaurants(results);
  };

  return (
    <>
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Encontre um restaurante</h1>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar por nome, tipo de cozinha ou localização"
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
            <TabsTrigger value="popular">Populares</TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center">
              <History className="h-4 w-4 mr-1" />
              Recentes
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {activeTab === 'nearby' 
              ? 'Restaurantes próximos' 
              : activeTab === 'popular'
                ? 'Restaurantes populares'
                : activeTab === 'recent'
                  ? 'Suas últimas visitas'
                  : 'Restaurantes disponíveis'}
          </h2>
          
          {filteredRestaurants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRestaurants.map(restaurant => (
                <RestaurantCard
                  key={restaurant.id}
                  id={restaurant.id}
                  name={restaurant.name}
                  image={restaurant.image}
                  rating={restaurant.rating}
                  cuisine={restaurant.cuisine}
                  distance={restaurant.distance}
                  address={restaurant.address}
                  openingHours={restaurant.openingHours}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Nenhum restaurante encontrado.</p>
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
    </>
  );
};

export default SearchRestaurants;
