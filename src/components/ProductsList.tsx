
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, PlusCircle, Menu, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';

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
    // This would connect to the order functionality in a real app
    toast({
      title: "Adicionado à mesa",
      description: `${product.name} adicionado ao pedido da mesa`,
      variant: "default",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
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

  if (products.length === 0) {
    return (
      <>
        <Button 
          variant="ghost" 
          className="mb-4 text-white"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Card className="bg-gray-900 border-dashed border-gray-700">
          <CardContent className="text-center p-8">
            <div className="mb-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
                <Menu className="h-6 w-6 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-white">Nenhum item no cardápio</h3>
            <p className="text-gray-400 mt-1 mb-3">
              Este estabelecimento ainda não cadastrou itens no cardápio.
            </p>
          </CardContent>
        </Card>
      </>
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
    <div>
      <Button 
        variant="ghost" 
        className="mb-4 text-white hover:bg-gray-800"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>
      
      <div className="space-y-8">
        {Object.entries(groupedProducts).map(([category, products]) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-medium text-white">{category}</h3>
              <div className="h-px bg-gray-700 flex-grow"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product) => (
                <div key={product.id} className="relative rounded-lg overflow-hidden gradient-border">
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
                            <Button 
                              variant="blink" 
                              size="sm" 
                              className="flex items-center bg-blink-primary text-black hover:bg-blink-secondary font-medium"
                              onClick={() => handleAddToTable(product)}
                            >
                              <PlusCircle className="h-4 w-4 mr-1" />
                              Adicionar à Mesa
                            </Button>
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
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsList;
