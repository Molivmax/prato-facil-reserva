
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Store, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

const EstablishmentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Check if this user has an establishment
      const { data: establishment, error: establishmentError } = await supabase
        .from('establishments')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (establishmentError) {
        throw establishmentError;
      }

      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo de volta ao Blink!",
      });

      // If no establishment yet, go to partner registration
      if (!establishment) {
        navigate('/partner-registration');
      } else {
        // Check if establishment has products
        const { count, error: productsError } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('establishment_id', establishment.id);

        if (productsError) throw productsError;

        if (!count || count === 0) {
          // No products yet: go to product registration
          navigate('/product-registration', { state: { establishmentId: establishment.id } });
        } else {
          // Has products: go to dashboard
          navigate('/establishment-dashboard');
        }
      }
    } catch (error: any) {
      const raw = error?.message || '';
      const message =
        (typeof raw === 'string' && raw.toLowerCase().includes('invalid')) || error?.status === 400
          ? 'Email ou senha inválidos'
          : raw || 'Verifique suas credenciais e tente novamente';
      setErrorMessage(message);
      toast({
        title: 'Erro ao fazer login',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-black/70 p-4">
      <Card className="w-full max-w-md bg-black/50 backdrop-blur-md border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <div className="bg-blink-primary rounded-full p-3 inline-block shadow-[0_0_20px_rgba(255,255,0,0.3)]">
              <Store className="h-6 w-6 text-black" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Login de Estabelecimento</CardTitle>
          <CardDescription className="text-gray-400">
            Acesse sua conta de parceiro Blink
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro ao fazer login</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 placeholder:text-gray-500 text-white pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blink-primary hover:bg-blink-primary/80 text-black"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center w-full text-gray-300">
            Não tem uma conta?{" "}
            <Link to="/partner-registration" className="text-blink-primary hover:text-blink-secondary">
              Cadastre seu estabelecimento
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

export default EstablishmentLogin;
