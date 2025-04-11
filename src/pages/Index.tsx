
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-black/70 p-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="bg-blink-primary rounded-full p-4 inline-block shadow-[0_0_30px_rgba(250,255,0,0.3)]">
            <Zap className="h-12 w-12 text-blink-text" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-3 text-white">Blink</h1>
        <p className="text-xl text-gray-300 mb-8">
          Num piscar de olhos você está atendido! Reserve, escolha seu prato e pague antes de chegar.
        </p>
        
        <div className="space-y-4">
          <Button 
            className="w-full bg-blink-primary hover:bg-blink-secondary hover:text-white text-blink-text shadow-lg"
            size="lg"
            asChild
          >
            <Link to="/register">
              Cadastre-se
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full border-blink-primary text-white hover:bg-blink-light hover:text-blink-text"
            size="lg"
            asChild
          >
            <Link to="/login">
              Login
            </Link>
          </Button>
          
          <Button 
            variant="link" 
            className="w-full text-blink-secondary hover:text-blink-primary"
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
