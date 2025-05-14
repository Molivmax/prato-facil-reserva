
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category: string;
  image_url: string | null;
}

interface ProductsListProps {
  establishmentId: string;
}

const ProductsList = ({ establishmentId }: ProductsListProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return <p>Carregando produtos...</p>;
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhum produto cadastrado ainda.</p>
        <p className="text-gray-500 text-sm mt-1">
          Clique em "Adicionar Produto" para começar a criar seu cardápio.
        </p>
      </div>
    );
  }

  // Group products by category
  const groupedProducts = products.reduce((acc: Record<string, Product[]>, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(groupedProducts).map(([category, products]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((product) => (
              <div key={product.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="flex">
                  {product.image_url && (
                    <div className="w-24 h-24 flex-shrink-0">
                      <img 
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4 flex-grow">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="font-medium text-restaurant-primary">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                    {product.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="flex justify-end mt-4 space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-gray-600"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductsList;
