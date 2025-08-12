
import React from 'react';
import ProductCard from './ProductCard';
import { Product } from '@/utils/productUtils';

interface ProductCategorySectionProps {
  category: string;
  products: Product[];
  quantities: Record<string, number>;
  updateQuantity: (productId: string, increment: boolean) => void;
  handleAddToTable?: (product: Product) => void;
  handleDelete?: (id: string) => void;
  handleEdit?: (product: Product) => void;
  onAddToCart?: boolean;
  formatPrice: (price: number) => string;
}

const ProductCategorySection = ({
  category,
  products,
  quantities,
  updateQuantity,
  handleAddToTable,
  handleDelete,
  handleEdit,
  onAddToCart,
  formatPrice
}: ProductCategorySectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <h3 className="text-lg font-medium text-white">{category}</h3>
        <div className="h-px bg-gray-700 flex-grow"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            quantity={quantities[product.id] || 0}
            updateQuantity={updateQuantity}
            handleAddToTable={handleAddToTable}
            handleDelete={handleDelete}
            handleEdit={handleEdit}
            onAddToCart={onAddToCart}
            formatPrice={formatPrice}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductCategorySection;
