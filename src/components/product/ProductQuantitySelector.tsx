
import React from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

interface ProductQuantitySelectorProps {
  productId: string;
  quantity: number;
  updateQuantity: (productId: string, increment: boolean) => void;
  formatPrice?: (price: number) => string;
  price?: number;
}

const ProductQuantitySelector = ({ 
  productId, 
  quantity, 
  updateQuantity, 
  formatPrice, 
  price 
}: ProductQuantitySelectorProps) => {
  return (
    <div className="flex items-center">
      <Button 
        variant="outline" 
        size="icon" 
        className="h-8 w-8 rounded-full bg-gray-800 border-gray-700 text-white"
        onClick={() => updateQuantity(productId, false)}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="mx-2 text-white font-bangers">{quantity}</span>
      <Button 
        variant="outline" 
        size="icon" 
        className="h-8 w-8 rounded-full bg-gray-800 border-gray-700 text-white"
        onClick={() => updateQuantity(productId, true)}
      >
        <Plus className="h-4 w-4" />
      </Button>
      {price !== undefined && formatPrice && quantity > 0 && (
        <span className="ml-2 text-white font-bangers">
          ({formatPrice(price * quantity)})
        </span>
      )}
    </div>
  );
};

export default ProductQuantitySelector;
