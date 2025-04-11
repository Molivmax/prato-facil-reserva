
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MenuItemProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  onAddToOrder: (id: string, quantity: number) => void;
}

const MenuItem = ({
  id,
  name,
  description,
  price,
  image,
  category,
  onAddToOrder
}: MenuItemProps) => {
  const [quantity, setQuantity] = useState(0);

  const handleIncrement = () => {
    setQuantity(quantity + 1);
    onAddToOrder(id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      setQuantity(quantity - 1);
      onAddToOrder(id, quantity - 1);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
      <div className="relative">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-40 object-cover"
        />
        <Badge className="absolute top-2 right-2 bg-restaurant-secondary text-black">
          {category}
        </Badge>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-restaurant-text">{name}</h3>
          <span className="font-bold text-restaurant-primary">
            R$ {price.toFixed(2)}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleDecrement}
              disabled={quantity === 0}
              className="h-8 w-8 rounded-full"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="mx-3 font-medium">{quantity}</span>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleIncrement}
              className="h-8 w-8 rounded-full"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            variant="default" 
            className="bg-restaurant-primary hover:bg-restaurant-dark"
            size="sm"
            onClick={handleIncrement}
            disabled={quantity > 0}
          >
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MenuItem;
