import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CreditCardFormProps {
  amount: number;
  orderId: string;
  restaurantId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const CreditCardForm = ({ amount, orderId, restaurantId, onSuccess, onCancel }: CreditCardFormProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [mp, setMp] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cardToken, setCardToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardholderName: '',
    expirationMonth: '',
    expirationYear: '',
    securityCode: '',
    cpf: '',
  });
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    // Timeout de segurança de 10 segundos
    const timeout = setTimeout(() => {
      if (!publicKey || publicKey === null) {
        console.error('⏰ Timeout ao carregar SDK do Mercado Pago');
        setErrors({ general: 'Tempo esgotado ao carregar pagamento. Tente novamente.' });
        setPublicKey('ERROR');
        setIsLoading(false);
      }
    }, 10000);

    const loadMercadoPago = async () => {
      try {
        // Validar restaurantId antes de continuar
        if (!restaurantId) {
          console.error('❌ restaurantId não fornecido ao CreditCardForm');
          setErrors({ general: 'Erro: ID do restaurante não encontrado' });
          setPublicKey('ERROR');
          setIsLoading(false);
          return;
        }

        console.log('🔐 Buscando credenciais do Mercado Pago...');
        console.log('📍 Restaurant ID:', restaurantId);
        
        // Buscar credenciais do MP usando o restaurantId diretamente
        const { data: credentials, error: credentialsError } = await supabase
          .from('establishment_mp_credentials')
          .select('public_key')
          .eq('establishment_id', restaurantId)
          .single();

        if (credentialsError) {
          console.error('❌ Erro ao buscar credenciais:', credentialsError);
          setErrors({ general: 'Erro ao buscar credenciais de pagamento' });
          setPublicKey('ERROR');
          setIsLoading(false);
          return;
        }

        if (!credentials?.public_key) {
          console.error('❌ Credenciais do MP não encontradas para este restaurante');
          setErrors({ general: 'Restaurante não configurou pagamentos ainda' });
          setPublicKey('ERROR');
          setIsLoading(false);
          return;
        }

        const publicKeyToUse = credentials.public_key;
        console.log('✅ Public Key obtida:', publicKeyToUse);
        setPublicKey(publicKeyToUse);
        
        // Carregar o SDK do MercadoPago
        const existingScript = document.querySelector('script[src="https://sdk.mercadopago.com/js/v2"]');
        if (existingScript) {
          existingScript.remove();
        }

        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.async = true;
        script.onload = () => {
          console.log('✅ MercadoPago SDK carregado');
          try {
            const mpInstance = new (window as any).MercadoPago(publicKeyToUse, {
              locale: 'pt-BR'
            });
            console.log('✅ Instância do MercadoPago criada');
            setMp(mpInstance);
            setIsLoading(false);
          } catch (error) {
            console.error('❌ Erro ao criar instância do MercadoPago:', error);
            setErrors({ general: 'Erro ao inicializar pagamento' });
            setPublicKey('ERROR');
            setIsLoading(false);
          }
        };
        script.onerror = () => {
          console.error('❌ Falha ao carregar SDK do MercadoPago');
          setErrors({ general: 'Falha ao carregar sistema de pagamento' });
          setPublicKey('ERROR');
          setIsLoading(false);
        };
        document.body.appendChild(script);
      } catch (error) {
        console.error('❌ Erro ao carregar credenciais do MP:', error);
        setErrors({ general: 'Erro ao carregar configurações de pagamento' });
        setPublicKey('ERROR');
        setIsLoading(false);
      }
    };
    
    loadMercadoPago();
    
    return () => clearTimeout(timeout);
  }, [restaurantId]);

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (field === 'expirationMonth' || field === 'expirationYear') {
      formattedValue = value.replace(/\D/g, '');
    } else if (field === 'securityCode') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    setErrors((prev: any) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (formData.cardNumber.replace(/\D/g, '').length < 13) {
      newErrors.cardNumber = 'Número do cartão inválido';
    }

    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Nome do titular é obrigatório';
    }

    if (!formData.expirationMonth || parseInt(formData.expirationMonth) < 1 || parseInt(formData.expirationMonth) > 12) {
      newErrors.expirationMonth = 'Mês inválido';
    }

    const currentYear = new Date().getFullYear() % 100;
    if (!formData.expirationYear || parseInt(formData.expirationYear) < currentYear) {
      newErrors.expirationYear = 'Ano inválido';
    }

    if (formData.securityCode.length < 3) {
      newErrors.securityCode = 'CVV inválido';
    }

    if (formData.cpf.replace(/\D/g, '').length !== 11) {
      newErrors.cpf = 'CPF inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !mp) {
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Starting payment process...');
      
      // Em vez de criar token no frontend, vamos enviar os dados do cartão diretamente
      // para o backend processar (apenas em ambiente de teste)
      const { data: session } = await supabase.auth.getSession();

      const paymentData = {
        amount,
        orderId,
        restaurantId,
        paymentMethod: 'credit',
        cardData: {
          cardNumber: formData.cardNumber.replace(/\D/g, ''),
          cardholderName: formData.cardholderName,
          cardExpirationMonth: formData.expirationMonth,
          cardExpirationYear: formData.expirationYear,
          securityCode: formData.securityCode,
          cpf: formData.cpf.replace(/\D/g, ''),
        },
        payer: {
          email: session.session?.user.email || 'customer@email.com',
          first_name: formData.cardholderName.split(' ')[0],
          last_name: formData.cardholderName.split(' ').slice(1).join(' ') || 'Card',
          identification: {
            type: 'CPF',
            number: formData.cpf.replace(/\D/g, ''),
          },
        },
      };

      console.log('Calling process-payment function...');

      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: paymentData,
      });

      console.log('Payment response:', data);

      if (error) {
        console.error('Error calling function:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // Tentar pegar a resposta de erro
        const errorData = (error as any).context?.body;
        if (errorData) {
          console.error('Error data from server:', errorData);
          throw new Error(errorData.message || 'Erro ao processar pagamento');
        }
        
        throw new Error('Erro ao conectar com o servidor de pagamento');
      }

      if (data?.error) {
        console.error('Payment error:', data);
        let errorMessage = data.message || 'Erro ao processar pagamento';
        
        if (errorMessage.includes('API') || errorMessage.includes('recursos')) {
          errorMessage = 'Erro ao processar pagamento. Verifique os dados do cartão.';
        }
        
        throw new Error(errorMessage);
      }

      if (!data?.success) {
        throw new Error('Pagamento não foi aprovado');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Erro no pagamento:', error);
      
      let userMessage = error.message || 'Erro ao processar pagamento. Tente novamente.';
      
      // Mensagens mais amigáveis para erros comuns
      if (userMessage.includes('Token') || userMessage.includes('token')) {
        userMessage = 'Dados do cartão inválidos. Verifique e tente novamente.';
      } else if (userMessage.includes('API') || userMessage.includes('recursos')) {
        userMessage = 'Erro ao processar pagamento. Tente novamente em alguns instantes.';
      }
      
      setErrors({ general: userMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading || !publicKey || publicKey === 'ERROR') {
    return (
      <Card className="bg-black/50 backdrop-blur-md border border-white/10">
        <CardContent className="p-6">
          {errors.general ? (
            <div className="space-y-4">
              <div className="p-3 bg-red-900/50 border border-red-500/50 rounded-md">
                <p className="text-white text-sm">{errors.general}</p>
              </div>
              <Button
                onClick={onCancel}
                className="w-full bg-white/10 hover:bg-white/20 text-white"
                variant="outline"
              >
                Voltar
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blink-primary mr-2" />
              <p className="text-white">Carregando formulário de pagamento...</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/50 backdrop-blur-md border border-white/10">
      <CardContent className="p-6">
        <div className="flex items-center mb-6">
          <CreditCard className="h-6 w-6 text-blink-primary mr-2" />
          <h3 className="text-lg font-semibold text-white">Dados do Cartão</h3>
        </div>

        <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 mb-6">
          <p className="text-green-300 text-sm font-semibold mb-2">🔒 Pagamento Seguro</p>
          <p className="text-green-200 text-xs">
            Seus dados de cartão são processados de forma segura pelo Mercado Pago.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cardNumber" className="text-white">Número do Cartão</Label>
            <input
              id="cardNumber"
              type="text"
              value={formData.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', e.target.value)}
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blink-primary"
            />
            {errors.cardNumber && <p className="text-red-400 text-sm mt-1">{errors.cardNumber}</p>}
          </div>

          <div>
            <Label htmlFor="cardholderName" className="text-white">Nome no Cartão</Label>
            <input
              id="cardholderName"
              type="text"
              value={formData.cardholderName}
              onChange={(e) => handleInputChange('cardholderName', e.target.value.toUpperCase())}
              placeholder="NOME COMO NO CARTÃO"
              className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blink-primary"
            />
            {errors.cardholderName && <p className="text-red-400 text-sm mt-1">{errors.cardholderName}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="expirationMonth" className="text-white">Mês</Label>
              <input
                id="expirationMonth"
                type="text"
                value={formData.expirationMonth}
                onChange={(e) => handleInputChange('expirationMonth', e.target.value)}
                placeholder="MM"
                maxLength={2}
                className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blink-primary"
              />
              {errors.expirationMonth && <p className="text-red-400 text-sm mt-1">{errors.expirationMonth}</p>}
            </div>

            <div>
              <Label htmlFor="expirationYear" className="text-white">Ano</Label>
              <input
                id="expirationYear"
                type="text"
                value={formData.expirationYear}
                onChange={(e) => handleInputChange('expirationYear', e.target.value)}
                placeholder="AA"
                maxLength={2}
                className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blink-primary"
              />
              {errors.expirationYear && <p className="text-red-400 text-sm mt-1">{errors.expirationYear}</p>}
            </div>

            <div>
              <Label htmlFor="securityCode" className="text-white">CVV</Label>
              <input
                id="securityCode"
                type="text"
                value={formData.securityCode}
                onChange={(e) => handleInputChange('securityCode', e.target.value)}
                placeholder="123"
                maxLength={4}
                className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blink-primary"
              />
              {errors.securityCode && <p className="text-red-400 text-sm mt-1">{errors.securityCode}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="cpf" className="text-white">CPF do Titular</Label>
            <input
              id="cpf"
              type="text"
              value={formData.cpf}
              onChange={(e) => handleInputChange('cpf', e.target.value)}
              placeholder="000.000.000-00"
              maxLength={14}
              className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blink-primary"
            />
            {errors.cpf && <p className="text-red-400 text-sm mt-1">{errors.cpf}</p>}
          </div>

          {errors.general && (
            <div className="p-3 bg-red-900/50 border border-red-500/50 rounded-md">
              <p className="text-white text-sm">{errors.general}</p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={onCancel}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blink-primary text-black hover:bg-blink-primary/90 font-semibold"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-semibold">Processando pagamento</span>
                    <span className="text-[10px] opacity-80">Aguarde...</span>
                  </div>
                </div>
              ) : (
                `Pagar R$ ${amount.toFixed(2)}`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreditCardForm;
