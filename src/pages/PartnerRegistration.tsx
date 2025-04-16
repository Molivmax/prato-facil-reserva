import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Store, Upload, Image, Trash2 } from 'lucide-react';
import DishImageSelector from '@/components/DishImageSelector';
import DescriptionSuggestions from '@/components/DescriptionSuggestions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CurrencyInput from '@/components/CurrencyInput';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

interface Dish {
  name: string;
  description: string;
  price: string;
  imageUrl?: string;
  category: 'Prato' | 'Bebida' | 'Sobremesa';
}

const PartnerRegistration = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [currentDish, setCurrentDish] = useState<Dish>({
    name: '',
    description: '',
    price: '',
    category: 'Prato'
  });
  const { toast } = useToast();
  const [description, setDescription] = useState('');
  const [customHours, setCustomHours] = useState('');
  const [selectedHours, setSelectedHours] = useState('');
  
  // New state for establishment photo
  const [establishmentPhoto, setEstablishmentPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [establishmentName, setEstablishmentName] = useState('');
  const [user, setUser] = useState<any>(null);

  // Check if user is logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUser(data.session.user);
      } else {
        toast({
          title: "Login necessário",
          description: "Você precisa estar logado para cadastrar um estabelecimento.",
          variant: "destructive",
        });
        navigate('/login');
      }
    };
    
    checkUser();
  }, [navigate, toast]);

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

  const predefinedHours = [
    "Segunda a Sexta, 09:00 - 18:00",
    "Segunda a Sábado, 11:00 - 23:00",
    "Todos os dias, 11:00 - 23:00",
    "Terça a Domingo, 18:00 - 00:00",
    "Outros"
  ];

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
        category: 'Prato',
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

  // Handle establishment photo selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEstablishmentPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected photo
  const handleRemovePhoto = () => {
    setEstablishmentPhoto(null);
    setPhotoPreview(null);
  };

  const uploadEstablishmentPhoto = async (): Promise<string | null> => {
    if (!establishmentPhoto) return null;
    
    setUploadingPhoto(true);
    try {
      const fileExt = establishmentPhoto.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `establishments/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, establishmentPhoto);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('public').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erro ao enviar imagem",
        description: "Não foi possível enviar a imagem do estabelecimento.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async () => {
    if (!establishmentName || !location || !selectedHours || !description) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload photo if selected
      const photoUrl = await uploadEstablishmentPhoto();
      
      // Insert establishment
      const { data: establishment, error: establishmentError } = await supabase
        .from('establishments')
        .insert([{
          name: establishmentName,
          description: description,
          latitude: location.lat,
          longitude: location.lng,
          working_hours: selectedHours === 'Outros' ? customHours : selectedHours,
          contact: document.querySelector<HTMLInputElement>('input[type="tel"]')?.value || '',
          user_id: user?.id,
          photo_url: photoUrl // Add the photo URL to the establishment record
        }])
        .select()
        .single();

      if (establishmentError) throw establishmentError;

      // Insert products
      if (dishes.length > 0 && establishment) {
        const productsToInsert = dishes.map(dish => ({
          establishment_id: establishment.id,
          name: dish.name,
          description: dish.description,
          price: parseFloat(dish.price) / 100, // Convert from cents to reais
          category: dish.category,
          image_url: dish.imageUrl,
        }));

        const { error: productsError } = await supabase
          .from('products')
          .insert(productsToInsert);

        if (productsError) throw productsError;
      }

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Seu estabelecimento foi cadastrado.",
      });

      // Redirect to a success page or home
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro ao cadastrar o estabelecimento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
                  value={establishmentName}
                  onChange={(e) => setEstablishmentName(e.target.value)}
                  placeholder="Digite o nome do seu estabelecimento"
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* New Photo/Logo Upload Field */}
            <div className="space-y-2">
              <Label className="text-white">Logo ou Foto do Estabelecimento</Label>
              {!photoPreview ? (
                <div className="relative">
                  <Input
                    type="file"
                    id="establishmentPhoto"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="sr-only"
                  />
                  <Label 
                    htmlFor="establishmentPhoto" 
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-md border-white/20 cursor-pointer bg-white/5 hover:bg-white/10"
                  >
                    <Image className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="text-sm text-gray-400">Clique para selecionar uma imagem</p>
                    <p className="mt-1 text-xs text-gray-500">PNG, JPG ou GIF até 5MB</p>
                  </Label>
                </div>
              ) : (
                <div className="relative w-full h-48 rounded-md overflow-hidden">
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemovePhoto}
                    className="absolute top-2 right-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
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
            <Select onValueChange={setSelectedHours}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Selecione o horário" />
              </SelectTrigger>
              <SelectContent>
                {predefinedHours.map((hour) => (
                  <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedHours === 'Outros' && (
              <Input 
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
                placeholder="Ex: Segunda a Sexta, 09:00 - 18:00"
                className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
            )}
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
            <h3 className="text-lg font-semibold text-white">Cadastro de Produto</h3>
            
            <div className="space-y-2">
              <Label className="text-white">Categoria</Label>
              <Select 
                value={currentDish.category}
                onValueChange={(value: 'Prato' | 'Bebida' | 'Sobremesa') => 
                  setCurrentDish(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Prato">Prato</SelectItem>
                  <SelectItem value="Bebida">Bebida</SelectItem>
                  <SelectItem value="Sobremesa">Sobremesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
              <CurrencyInput 
                value={currentDish.price}
                onChange={(value) => setCurrentDish(prev => ({ ...prev, price: value }))}
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
                <h4 className="text-white font-semibold">Produtos Cadastrados</h4>
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
                        <p className="text-sm text-gray-400">{dish.category}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || uploadingPhoto}
            className="w-full bg-blink-primary hover:bg-blink-secondary text-blink-text"
          >
            {isSubmitting || uploadingPhoto ? 'Cadastrando...' : 'Cadastrar Estabelecimento'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerRegistration;
