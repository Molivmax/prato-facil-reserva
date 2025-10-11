import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Detectar erros de recuperação de senha na URL
    const hash = window.location.hash;
    if (hash.includes('error=') || hash.includes('error_code=')) {
      const params = new URLSearchParams(hash.substring(1));
      const errorCode = params.get('error_code');
      const error = params.get('error');
      
      if (errorCode === 'otp_expired' || error === 'access_denied') {
        setHasError(true);
        toast({
          title: "⚠️ Link de recuperação expirado ou inválido",
          description: "Este link já foi usado ou expirou (válido por 1 hora).",
          variant: "destructive",
        });
        
        // Limpar os parâmetros da URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    // Verificar se há um token de recuperação na URL
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasError(false);
      }
    });
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Senha redefinida",
          description: "Sua senha foi redefinida com sucesso!",
        });
        
        // Redirecionar para a página de login após 2 segundos
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blink-primary via-blink-secondary to-blink-tertiary p-4">
      <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-blink-primary/20 flex items-center justify-center">
              <Lock className="w-8 h-8 text-blink-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">
              Redefinir Senha
            </CardTitle>
            <CardDescription className="text-gray-300">
              Digite sua nova senha abaixo
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {hasError ? (
            <div className="space-y-4">
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <AlertDescription className="text-gray-200">
                  <strong className="block mb-2">⚠️ Link de recuperação expirado ou inválido</strong>
                  Este link já foi usado ou expirou. Os links de recuperação são válidos por apenas 1 hora.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => navigate('/forgot-password')}
                className="w-full bg-blink-primary hover:bg-blink-secondary text-black font-semibold"
              >
                Solicitar Novo Link
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/login')}
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                Voltar ao Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-white/10 border-white/20 placeholder:text-gray-500 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-200">
                Confirmar Nova Senha
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="bg-white/10 border-white/20 placeholder:text-gray-500 text-white"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blink-primary hover:bg-blink-secondary text-black font-semibold" 
              disabled={isLoading}
            >
              {isLoading ? "Redefinindo..." : "Redefinir Senha"}
            </Button>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
