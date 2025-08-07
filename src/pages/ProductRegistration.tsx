import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AddProductForm from '@/components/AddProductForm';
import { toast } from 'sonner';

const ProductRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    // Get establishment ID from navigation state
    const state = location.state as { establishmentId?: string };
    if (state?.establishmentId) {
      setEstablishmentId(state.establishmentId);
    } else {
      // If no establishment ID, redirect to registration
      navigate('/partner-registration');
    }
  }, [location, navigate]);

  const handleProductAdded = () => {
    setProductCount(prev => prev + 1);
    toast.success('Produto adicionado com sucesso!');
  };

  const handleFinishRegistration = () => {
    if (productCount === 0) {
      toast.error('Adicione pelo menos um produto antes de finalizar');
      return;
    }
    navigate('/establishment-dashboard');
  };

  const handleFinishFromForm = () => {
    navigate('/establishment-dashboard');
  };

  const handleSkipProducts = () => {
    navigate('/establishment-login');
  };

  if (!establishmentId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            Cadastro de Produtos
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Adicione produtos ao seu estabelecimento. Você pode adicionar mais produtos depois no painel de controle.
          </CardDescription>
          {productCount > 0 && (
            <p className="text-sm text-primary">
              {productCount} produto(s) adicionado(s)
            </p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          <AddProductForm
            establishmentId={establishmentId}
            onSuccess={handleProductAdded}
            onFinishRegistration={handleFinishFromForm}
          />
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleFinishRegistration}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={productCount === 0}
            >
              Finalizar Cadastro ({productCount} produtos)
            </Button>
            
            <Button
              onClick={handleSkipProducts}
              variant="outline"
              className="flex-1"
            >
              Pular por Agora
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Após finalizar, você será direcionado para a página de login do estabelecimento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductRegistration;