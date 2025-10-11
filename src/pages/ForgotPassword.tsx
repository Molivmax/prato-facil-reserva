import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setIsEmailSent(true);
        toast({
          title: "Email enviado",
          description: "Verifique sua caixa de entrada para redefinir sua senha.",
        });
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
            <Link 
              to="/login" 
              className="absolute left-6 top-6 text-white hover:text-blink-primary transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="w-16 h-16 rounded-full bg-blink-primary/20 flex items-center justify-center">
              <Mail className="w-8 h-8 text-blink-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">
              {isEmailSent ? "Email Enviado" : "Esqueceu a Senha?"}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {isEmailSent 
                ? (
                  <>
                    Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                    <br />
                    <strong className="text-yellow-400">⏱️ O link expira em 1 hora - clique imediatamente!</strong>
                  </>
                )
                : (
                  <>
                    Digite seu email para receber um link de redefinição de senha.
                    <br />
                    <strong className="text-yellow-400">⏱️ O link é válido por 1 hora</strong>
                  </>
                )
              }
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!isEmailSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 placeholder:text-gray-500 text-white"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blink-primary hover:bg-blink-secondary" 
                disabled={isLoading}
              >
                {isLoading ? "Enviando..." : "Enviar Link de Redefinição"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <Button 
                onClick={() => setIsEmailSent(false)}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                Enviar Novamente
              </Button>
            </div>
          )}
          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="text-sm text-blink-primary hover:text-blink-secondary transition-colors"
            >
              Voltar ao Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;