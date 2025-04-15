
import React, { useState } from 'react';
import { Camera, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface DishImageSelectorProps {
  dishName: string;
  onImageSelected: (imageUrl: string) => void;
}

const DishImageSelector: React.FC<DishImageSelectorProps> = ({ dishName, onImageSelected }) => {
  const { toast } = useToast();
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        onImageSelected(imageUrl);
        toast({
          title: "Imagem carregada",
          description: "A imagem foi selecionada com sucesso.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Updated suggestedImages with more relevant food images
  const suggestedImages = [
    "https://images.unsplash.com/photo-1544025162-d76694265947", // Picanha na tábua
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836", // Prato gourmet
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb", // Drinks coloridos
    "https://images.unsplash.com/photo-1551024506-0bccd828d307", // Sobremesa elaborada
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="dish-image" className="text-white">Imagem do Prato</Label>
          <div className="mt-2">
            <Input
              id="dish-image"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => document.getElementById('dish-image')?.click()}
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Camera className="mr-2" />
              Fazer Upload
            </Button>
          </div>
        </div>
        <div className="flex-1">
          <Label className="text-white">Sugestões</Label>
          <Button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="w-full mt-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Search className="mr-2" />
            Ver Sugestões
          </Button>
        </div>
      </div>

      {showSuggestions && (
        <div className="grid grid-cols-2 gap-4">
          {suggestedImages.map((image, index) => (
            <div
              key={index}
              onClick={() => {
                onImageSelected(image);
                setShowSuggestions(false);
                toast({
                  title: "Imagem selecionada",
                  description: "A imagem sugerida foi selecionada com sucesso.",
                });
              }}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img
                src={image}
                alt={`Sugestão ${index + 1}`}
                className="w-full h-48 object-cover rounded-md"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DishImageSelector;
