
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-restaurant-light to-white p-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="bg-restaurant-primary rounded-full p-4 inline-block">
            <UtensilsCrossed className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-3 text-restaurant-primary">Prato Fácil</h1>
        <p className="text-xl text-gray-700 mb-8">
          Reserve, escolha seu prato e pague antes mesmo de chegar ao restaurante!
        </p>
        
        <div className="space-y-4">
          <Button 
            className="w-full bg-restaurant-primary hover:bg-restaurant-dark"
            size="lg"
            asChild
          >
            <Link to="/register">
              Cadastre-se
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full border-restaurant-primary text-restaurant-primary hover:bg-restaurant-light"
            size="lg"
            asChild
          >
            <Link to="/login">
              Login
            </Link>
          </Button>
          
          <Button 
            variant="link" 
            className="w-full text-restaurant-primary"
            asChild
          >
            <Link to="/search">
              Explorar sem login
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
