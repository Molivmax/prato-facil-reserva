import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Store } from 'lucide-react';
import DishImageSelector from '@/components/DishImageSelector';
import DescriptionSuggestions from '@/components/DescriptionSuggestions';

interface Dish {
  name: string;
  description: string;
  price: string;
  imageUrl?: string;
}

const PartnerRegistration = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [currentDish, setCurrentDish] = useState<Dish>({
    name: '',
    description: '',
    price: '',
  });
  const { toast } = useToast();
	const [description, setDescription] = useState('');

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast({
            title: "Localização obtida com sucesso",
            description: "Suas coordenadas foram salvas.",
          });
        },
        (error) => {
          toast({
            title: "Erro ao obter localização",
            description: "Por favor, permita o acesso à sua localização.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleDishImageSelected = (imageUrl: string) => {
    setCurrentDish(prev => ({ ...prev, imageUrl }));
  };

  const handleAddDish = () => {
    if (currentDish.name && currentDish.price) {
      setDishes(prev => [...prev, currentDish]);
      setCurrentDish({
        name: '',
        description: '',
        price: '',
        imageUrl: undefined
      });
      toast({
        title: "Prato adicionado",
        description: "O prato foi adicionado com sucesso.",
      });
    }
  };

	const handleDescriptionSelect = (selectedDescription: string) => {
    setDescription(selectedDescription);
    toast({
      title: "Descrição selecionada",
      description: "A descrição foi atualizada com sucesso.",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-black/70 p-4">
      <Card className="w-full max-w-2xl bg-black/50 backdrop-blur-md border border-white/10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Cadastro de Parceiro</CardTitle>
          <CardDescription className="text-gray-400">
            Cadastre seu estabelecimento no Blink
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Nome do Estabelecimento</Label>
              <div className="relative">
                <Store className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input 
                  placeholder="Digite o nome do seu estabelecimento"
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Localização</Label>
              <div className="flex gap-2">
                <Button 
                  onClick={requestLocation}
                  className="flex-1 bg-blink-primary hover:bg-blink-secondary text-blink-text"
                >
                  <MapPin className="mr-2" />
                  {location ? "Atualizar Localização" : "Obter Localização"}
                </Button>
              </div>
              {location && (
                <p className="text-sm text-gray-400">
                  Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                </p>
              )}
            </div>
					</div>

          <div className="space-y-4">
            <Label className="text-white">Descrição do Estabelecimento</Label>
            <DescriptionSuggestions onSelect={handleDescriptionSelect} />
            <Textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do seu estabelecimento..."
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 mt-4"
            />
          </div>

            <div className="space-y-2">
              <Label className="text-white">Horário de Funcionamento</Label>
              <Input 
                placeholder="Ex: Segunda a Sexta, 09:00 - 18:00"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Contato</Label>
              <Input 
                type="tel"
                placeholder="(00) 00000-0000"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>
          

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Cadastro de Pratos</h3>
            
            <div className="space-y-2">
              <Label className="text-white">Nome do Prato</Label>
              <Input 
                value={currentDish.name}
                onChange={(e) => setCurrentDish(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome do prato"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Descrição do Prato</Label>
              <Textarea 
                value={currentDish.description}
                onChange={(e) => setCurrentDish(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o prato..."
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Preço</Label>
              <Input 
                value={currentDish.price}
                onChange={(e) => setCurrentDish(prev => ({ ...prev, price: e.target.value }))}
                placeholder="R$ 0,00"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>

            <DishImageSelector 
              dishName={currentDish.name}
              onImageSelected={handleDishImageSelected}
            />

            {currentDish.imageUrl && (
              <div className="mt-4">
                <Label className="text-white">Imagem Selecionada</Label>
                <img 
                  src={currentDish.imageUrl} 
                  alt={currentDish.name}
                  className="mt-2 w-full h-48 object-cover rounded-md"
                />
              </div>
            )}

            <Button 
              onClick={handleAddDish}
              className="w-full bg-blink-primary hover:bg-blink-secondary text-blink-text"
            >
              Adicionar Prato
            </Button>

            {dishes.length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className="text-white font-semibold">Pratos Cadastrados</h4>
                <div className="grid grid-cols-2 gap-4">
                  {dishes.map((dish, index) => (
                    <Card key={index} className="bg-white/10 border-white/20">
                      <CardContent className="p-4">
                        {dish.imageUrl && (
                          <img 
                            src={dish.imageUrl} 
                            alt={dish.name}
                            className="w-full h-32 object-cover rounded-md mb-3"
                          />
                        )}
                        <h5 className="text-white font-semibold">{dish.name}</h5>
                        <p className="text-gray-400 text-sm">{dish.description}</p>
                        <p className="text-white mt-2">R$ {dish.price}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button className="w-full bg-blink-primary hover:bg-blink-secondary text-blink-text">
            Cadastrar Estabelecimento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerRegistration;
