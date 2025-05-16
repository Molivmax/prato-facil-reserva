
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatPrice, groupProductsByCategory, Product } from '@/utils/productUtils';
import ProductCategorySection from './product/ProductCategorySection';
import EmptyProductsList from './product/EmptyProductsList';

interface ProductsListProps {
  establishmentId: string;
  onAddToCart?: (item: {id: string, name: string, price: number, quantity: number}) => void;
}

const ProductsList = ({ establishmentId, onAddToCart }: ProductsListProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, [establishmentId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('establishment_id', establishmentId);

      if (error) {
        throw error;
      }

      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: "Erro",
        description: error.message || 'Erro ao carregar produtos',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }

        toast({
          title: "Sucesso",
          description: 'Produto excluído com sucesso',
          variant: "default",
        });
        fetchProducts();
      } catch (error: any) {
        console.error('Error deleting product:', error);
        toast({
          title: "Erro",
          description: error.message || 'Erro ao excluir produto',
          variant: "destructive",
        });
      }
    }
  };

  const handleAddToTable = (product: Product) => {
    if (onAddToCart) {
      const quantity = quantities[product.id] || 1;
      onAddToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity
      });
      
      // Reset quantity
      setQuantities(prev => ({...prev, [product.id]: 0}));
      
      toast({
        title: "Adicionado à mesa",
        description: `${product.name} adicionado ao pedido da mesa`,
        variant: "default",
      });
    }
  };

  const updateQuantity = (productId: string, increment: boolean) => {
    setQuantities(prev => {
      const currentQuantity = prev[productId] || 0;
      const newQuantity = increment ? currentQuantity + 1 : Math.max(0, currentQuantity - 1);
      return {...prev, [productId]: newQuantity};
    });
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-700 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Button 
        variant="ghost" 
        className="mb-4 text-white hover:bg-gray-800"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>
      
      {products.length === 0 ? (
        <EmptyProductsList />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupProductsByCategory(products)).map(([category, categoryProducts]) => (
            <ProductCategorySection
              key={category}
              category={category}
              products={categoryProducts}
              quantities={quantities}
              updateQuantity={updateQuantity}
              handleAddToTable={onAddToCart ? handleAddToTable : undefined}
              handleDelete={!onAddToCart ? handleDelete : undefined}
              onAddToCart={!!onAddToCart}
              formatPrice={formatPrice}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsList;
