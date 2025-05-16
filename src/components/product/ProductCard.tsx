
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Edit, Trash2, PlusCircle, Menu } from 'lucide-react';
import ProductQuantitySelector from './ProductQuantitySelector';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category: string;
  image_url: string | null;
}

interface ProductCardProps {
  product: Product;
  quantity: number;
  updateQuantity: (productId: string, increment: boolean) => void;
  handleDelete?: (id: string) => void;
  handleAddToTable?: (product: Product) => void;
  onAddToCart?: boolean;
  formatPrice: (price: number) => string;
}

const ProductCard = ({
  product,
  quantity,
  updateQuantity,
  handleDelete,
  handleAddToTable,
  onAddToCart,
  formatPrice
}: ProductCardProps) => {
  return (
    <div className="relative rounded-lg overflow-hidden gradient-border">
      <div className="absolute inset-0 rounded-lg" style={{
        background: 'linear-gradient(90deg, #faff00, #F97316)',
        padding: '2px',
        content: '""',
        zIndex: 0,
      }}></div>
      
      <Card className="bg-black relative z-10 m-0.5 h-full overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            {product.image_url ? (
              <div className="w-28 h-28 flex-shrink-0">
                <img 
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-28 h-28 bg-gray-800 flex items-center justify-center flex-shrink-0">
                <Menu className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div className="p-4 flex-grow">
              <div className="flex justify-between items-start">
                <h4 className="font-bangers text-xl text-white">{product.name}</h4>
                <Badge variant="outline" className="bg-blink-primary text-black border-blink-primary font-bold">
                  {formatPrice(product.price)}
                </Badge>
              </div>
              {product.description && (
                <p className="text-sm text-gray-300 mt-1 mb-3 line-clamp-2 font-medium">
                  {product.description}
                </p>
              )}
              <div className="flex justify-between mt-2">
                {onAddToCart && (
                  <div className="flex items-center">
                    {quantity ? (
                      <ProductQuantitySelector
                        productId={product.id}
                        quantity={quantity}
                        updateQuantity={updateQuantity}
                        formatPrice={formatPrice}
                        price={product.price}
                      />
                    ) : (
                      <Button 
                        variant="blink" 
                        size="sm" 
                        className="flex items-center bg-blink-primary text-black hover:bg-blink-secondary font-bangers"
                        onClick={() => updateQuantity(product.id, true)}
                      >
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Adicionar à Mesa
                      </Button>
                    )}
                  </div>
                )}
                
                {quantity > 0 && onAddToCart && handleAddToTable && (
                  <Button 
                    variant="blink" 
                    size="sm" 
                    className="flex items-center bg-blink-primary text-black hover:bg-blink-secondary font-bangers"
                    onClick={() => handleAddToTable(product)}
                  >
                    Confirmar ({formatPrice(product.price * quantity)})
                  </Button>
                )}
                
                {!onAddToCart && handleDelete && (
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 rounded-full text-gray-300 border-gray-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleDelete(product.id)}
                      className="h-8 w-8 rounded-full text-red-400 hover:bg-red-900/30 border-gray-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductCard;
