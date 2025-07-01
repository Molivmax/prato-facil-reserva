
import React from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

interface AdvancedQuantitySelectorProps {
  productId: string;
  quantity: number;
  price: number;
  updateQuantity: (productId: string, increment: boolean) => void;
  onAddToTable?: (productId: string) => void;
  formatPrice: (price: number) => string;
  showAddButton?: boolean;
}

const AdvancedQuantitySelector = ({ 
  productId, 
  quantity, 
  price,
  updateQuantity, 
  onAddToTable,
  formatPrice,
  showAddButton = true
}: AdvancedQuantitySelectorProps) => {
  const totalPrice = price * quantity;

  const handleAddToTable = () => {
    if (onAddToTable && quantity > 0) {
      onAddToTable(productId);
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      {/* Quantity Selector */}
      <div className="flex items-center justify-center space-x-3">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 rounded-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
          onClick={() => updateQuantity(productId, false)}
          disabled={quantity === 0}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center justify-center w-12">
          <span className="text-white font-bangers text-lg">{quantity}</span>
        </div>
        
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 rounded-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
          onClick={() => updateQuantity(productId, true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Price Display */}
      {quantity > 0 && (
        <div className="text-center space-y-1">
          <div className="text-white font-bangers text-sm">
            {quantity} x {formatPrice(price)}
          </div>
          <div className="text-blink-primary font-bangers text-lg">
            Total: {formatPrice(totalPrice)}
          </div>
        </div>
      )}

      {/* Add to Table Button */}
      {showAddButton && quantity > 0 && onAddToTable && (
        <Button
          onClick={handleAddToTable}
          className="bg-blink-primary hover:bg-blink-secondary text-black font-bangers text-sm py-2"
          size="sm"
        >
          Adicionar à Mesa ({quantity})
        </Button>
      )}
    </div>
  );
};

export default AdvancedQuantitySelector;
