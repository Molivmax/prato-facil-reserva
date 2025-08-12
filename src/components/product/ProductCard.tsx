
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit } from 'lucide-react';
import { Product } from '@/utils/productUtils';
import AdvancedQuantitySelector from './AdvancedQuantitySelector';

interface ProductCardProps {
  product: Product;
  quantity: number;
  updateQuantity: (productId: string, increment: boolean) => void;
  handleAddToTable?: (product: Product) => void;
  handleDelete?: (id: string) => void;
  handleEdit?: (product: Product) => void;
  onAddToCart?: boolean;
  formatPrice: (price: number) => string;
}

const ProductCard = ({
  product,
  quantity,
  updateQuantity,
  handleAddToTable,
  handleDelete,
  handleEdit,
  onAddToCart,
  formatPrice
}: ProductCardProps) => {
  const handleAddToTableClick = () => {
    if (handleAddToTable && quantity > 0) {
      handleAddToTable(product);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
      {/* Product Image */}
      {product.image_url && (
        <div className="mb-3 rounded-lg overflow-hidden">
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-32 object-cover"
          />
        </div>
      )}
      
      {/* Product Info */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-start">
          <h4 className="text-white font-medium text-lg">{product.name}</h4>
          <Badge variant="secondary" className="bg-gray-700 text-gray-300">
            {product.category}
          </Badge>
        </div>
        
        {product.description && (
          <p className="text-gray-400 text-sm line-clamp-2">
            {product.description}
          </p>
        )}
        
        <div className="text-blink-primary font-bangers text-xl">
          {formatPrice(product.price)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-end">
        {/* Quantity Selector or Edit/Delete Buttons */}
        <div className="flex-1">
          {onAddToCart ? (
            <AdvancedQuantitySelector
              productId={product.id}
              quantity={quantity}
              price={product.price}
              updateQuantity={updateQuantity}
              onAddToTable={handleAddToTableClick}
              formatPrice={formatPrice}
              showAddButton={true}
            />
          ) : (
            <div className="flex gap-2">
              {handleEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(product)}
                  className="border-blue-500 text-blue-400 hover:bg-blue-900/20"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
              {handleDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(product.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
