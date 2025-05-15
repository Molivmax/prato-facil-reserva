import { useState, useRef } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

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
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [showAddedMessage, setShowAddedMessage] = useState(false);
  const [messagePosition, setMessagePosition] = useState({ x: 0, y: 0 });
  const itemRef = useRef<HTMLDivElement>(null);

  const handleIncrement = () => {
    setQuantity(quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    // If quantity selector is not shown, show it first
    if (!showQuantitySelector) {
      setShowQuantitySelector(true);
      setQuantity(1); // Start with quantity 1
      return;
    }

    // Otherwise add the item
    if (quantity > 0) {
      onAddToOrder(id, quantity);
      
      // Calculate position for the message
      const rect = itemRef.current?.getBoundingClientRect();
      if (rect) {
        setMessagePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
      
      // Show and then hide the message
      setShowAddedMessage(true);
      setTimeout(() => {
        setShowAddedMessage(false);
      }, 1500);
      
      // Reset UI state
      setShowQuantitySelector(false);
      setQuantity(0);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm bg-white" ref={itemRef}>
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
          {showQuantitySelector ? (
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
          ) : (
            <div className="h-8"></div> // Placeholder to maintain layout
          )}
          <Button 
            variant="default" 
            className="bg-restaurant-primary hover:bg-restaurant-dark"
            size="sm"
            onClick={handleAddClick}
          >
            {showQuantitySelector ? `Adicionar (${quantity})` : 'Adicionar'}
          </Button>
        </div>
        
        {/* Added to table message */}
        {showAddedMessage && (
          <div 
            className="absolute bg-black text-white px-3 py-1 rounded text-sm font-bangers animate-fadeOut z-10"
            style={{
              top: `${messagePosition.y - 30}px`,
              left: `${messagePosition.x - 50}px`,
            }}
          >
            Adicionado à mesa!
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuItem;
