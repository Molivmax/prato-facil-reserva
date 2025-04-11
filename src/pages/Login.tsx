
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulação de login
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo de volta ao Blink!",
      });
      navigate('/search');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-black/70 p-4">
      <Card className="w-full max-w-md bg-black/50 backdrop-blur-md border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <div className="bg-blink-primary rounded-full p-3 inline-block shadow-[0_0_20px_rgba(250,255,0,0.3)]">
              <Zap className="h-6 w-6 text-blink-text" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Login</CardTitle>
          <CardDescription className="text-gray-400">
            Acesse sua conta para fazer reservas e pedidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-white/20 placeholder:text-gray-500 text-white"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-200">Senha</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blink-primary hover:text-blink-secondary"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/10 border-white/20 placeholder:text-gray-500 text-white"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blink-primary hover:bg-blink-secondary text-blink-text"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center w-full text-gray-300">
            Não tem uma conta?{" "}
            <Link to="/register" className="text-blink-primary hover:text-blink-secondary">
              Cadastre-se agora
            </Link>
          </div>
          <Button variant="ghost" size="sm" className="mx-auto text-gray-300 hover:bg-white/10" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para a página inicial
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
