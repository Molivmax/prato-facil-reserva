
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UtensilsCrossed, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import InputMask from 'react-input-mask';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreditAnalysisLoading, setIsCreditAnalysisLoading] = useState(false);
  const [creditStatus, setCreditStatus] = useState<null | {
    approved: boolean;
    limit: number;
    message: string;
  }>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const analyzeCreditScore = async () => {
    // Validação básica de CPF - apenas verificar se tem o formato correto
    const cpfOnlyNumbers = cpf.replace(/\D/g, '');
    if (cpfOnlyNumbers.length !== 11) {
      toast({
        title: "CPF inválido",
        description: "Por favor, informe um CPF válido com 11 dígitos",
        variant: "destructive",
      });
      return false;
    }

    setIsCreditAnalysisLoading(true);
    
    try {
      // Simulação de análise de crédito
      // Em um cenário real, aqui chamaríamos a API do fornecedor de crédito
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulando aprovação de crédito baseado no último dígito do CPF para teste
      // Em um ambiente real, isto seria substituído pela resposta da API do fornecedor
      const lastDigit = parseInt(cpfOnlyNumbers.charAt(10));
      const isApproved = lastDigit >= 5; // Apenas para simulação
      const creditLimit = isApproved ? (lastDigit * 100 + 300) : 0;
      
      setCreditStatus({
        approved: isApproved,
        limit: creditLimit,
        message: isApproved 
          ? `Parabéns! Você foi aprovado com limite de R$ ${creditLimit.toFixed(2)}` 
          : "No momento não conseguimos aprovar seu crédito"
      });
      
      toast({
        title: isApproved ? "Crédito aprovado!" : "Crédito não aprovado",
        description: isApproved 
          ? `Você tem um limite de R$ ${creditLimit.toFixed(2)} para usar em restaurantes` 
          : "No momento não podemos oferecer crédito, mas você pode usar outras formas de pagamento",
        variant: isApproved ? "default" : "destructive",
      });
      
      return isApproved;
    } catch (error: any) {
      toast({
        title: "Erro na análise de crédito",
        description: error.message || "Falha ao analisar seu CPF, tente novamente mais tarde",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsCreditAnalysisLoading(false);
    }
  };

  const handleCreditAnalysis = async (e: React.MouseEvent) => {
    e.preventDefault();
    await analyzeCreditScore();
  };

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
    
    // Se a análise de crédito ainda não foi feita, fazer agora
    if (!creditStatus) {
      const creditApproved = await analyzeCreditScore();
      if (!creditApproved) {
        // Permitir o cadastro mesmo sem aprovação de crédito
        // Apenas notifica o usuário que ele não terá a opção de crédito
        toast({
          title: "Você ainda pode prosseguir",
          description: "Você pode se cadastrar e usar outras formas de pagamento",
        });
      }
    }
    
    setIsLoading(true);

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            cpf,
            credit_limit: creditStatus?.limit || 0,
            has_credit: creditStatus?.approved || false
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      toast({
        title: "Cadastro realizado com sucesso",
        description: "Bem-vindo ao Prato Fácil!",
      });
      
      navigate('/search');
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro ao realizar o cadastro",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-restaurant-light to-white p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <div className="bg-restaurant-primary rounded-full p-3 inline-block">
              <UtensilsCrossed className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Cadastro</CardTitle>
          <CardDescription>
            Crie sua conta para começar a usar o Prato Fácil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <InputMask
                mask="(99) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              >
                {(inputProps: any) => (
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    required
                    {...inputProps}
                  />
                )}
              </InputMask>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <div className="flex space-x-2">
                <InputMask
                  mask="999.999.999-99"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                >
                  {(inputProps: any) => (
                    <Input
                      id="cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      required
                      className="flex-1"
                      {...inputProps}
                    />
                  )}
                </InputMask>
                <Button 
                  onClick={handleCreditAnalysis}
                  disabled={isCreditAnalysisLoading || cpf.replace(/\D/g, '').length !== 11}
                  type="button"
                  variant="outline"
                >
                  {isCreditAnalysisLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Analisar Crédito"
                  )}
                </Button>
              </div>
              {creditStatus && (
                <div className={`mt-2 p-2 rounded text-sm ${creditStatus.approved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                  {creditStatus.message}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-restaurant-primary hover:bg-restaurant-dark"
              disabled={isLoading}
            >
              {isLoading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center w-full">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-restaurant-primary hover:underline">
              Faça login
            </Link>
          </div>
          <Button variant="ghost" size="sm" className="mx-auto" asChild>
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

export default Register;
