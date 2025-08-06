
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { 
  Star, StarHalf, Home, FileText, Utensils, 
  ThumbsUp, QrCode 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';

const CompletedOrder = () => {
  const [rating, setRating] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRating = (value: number) => {
    setRating(value);
    
    toast({
      title: "Obrigado pela avaliação!",
      description: "Seu feedback é muito importante para nós.",
    });
  };

  return (
    <>
      <Navbar />
      <div className="container max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-2 text-center">Pedido Finalizado</h1>
        <p className="text-gray-600 mb-8 text-center">
          Obrigado por utilizar o Prato Fácil!
        </p>
        
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <QrCode className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-green-800">
              Pedido #12345 Concluído
            </h2>
            <p className="text-green-700 mb-4">
              Sua experiência no Boteco Tal foi finalizada com sucesso.
            </p>
            <div className="bg-white p-3 rounded-lg inline-block">
              <span className="font-medium">Código de Saída:</span> 123456
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Como foi sua experiência?</CardTitle>
            <CardDescription>
              Avalie o Boteco Tal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center space-x-2 mb-6">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => handleRating(value)}
                  className={`text-2xl transition-colors ${
                    rating && value <= rating 
                      ? 'text-yellow-500' 
                      : 'text-gray-300 hover:text-yellow-500'
                  }`}
                >
                  <Star className="h-8 w-8" />
                </button>
              ))}
            </div>
            
            {rating && (
              <p className="text-center text-green-600 font-medium">
                <ThumbsUp className="inline-block h-5 w-5 mr-1" />
                Obrigado pela sua avaliação!
              </p>
            )}
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="border-restaurant-primary text-restaurant-primary hover:bg-restaurant-light"
              onClick={() => navigate('/search')}
            >
              <Utensils className="mr-2 h-4 w-4" />
              Novos Restaurantes
            </Button>
            
            <Button 
              className="bg-restaurant-primary hover:bg-restaurant-dark"
              onClick={() => navigate('/')}
            >
              <Home className="mr-2 h-4 w-4" />
              Página Inicial
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full" 
            onClick={() => {
              toast({
                title: "Recibo enviado",
                description: "O recibo foi enviado para o seu e-mail.",
              });
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Enviar recibo por email
          </Button>
        </div>
      </div>
    </>
  );
};

export default CompletedOrder;
