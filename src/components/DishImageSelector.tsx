
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

  const getSuggestedImages = (name: string) => {
    const cleanName = name.toLowerCase().trim();
    if (cleanName.includes('picanha')) {
      return [
        "https://images.unsplash.com/photo-1594041680534-e8c8cdebd659",
        "https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1",
        "https://images.unsplash.com/photo-1607116176195-b81b1f41f536",
        "https://images.unsplash.com/photo-1588168333785-2425f7b99956"
      ];
    } else if (cleanName.includes('cerveja') || cleanName.includes('chopp')) {
      return [
        "https://images.unsplash.com/photo-1608270586620-248524c67de9",
        "https://images.unsplash.com/photo-1571600097834-45bdaa288f53",
        "https://images.unsplash.com/photo-1608270586620-248524c67de9",
        "https://images.unsplash.com/photo-1525034687081-c702010cb70d"
      ];
    } else if (cleanName.includes('sobremesa') || cleanName.includes('doce')) {
      return [
        "https://images.unsplash.com/photo-1551024506-0bccd828d307",
        "https://images.unsplash.com/photo-1587314168485-3236d6710814",
        "https://images.unsplash.com/photo-1488477181946-6428a0291777",
        "https://images.unsplash.com/photo-1516715094483-75da7dee9758"
      ];
    }
    // Default food images if no specific match
    return [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
      "https://images.unsplash.com/photo-1557499305-87bd9049ec2d"
    ];
  };

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
          {getSuggestedImages(dishName).map((image, index) => (
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
