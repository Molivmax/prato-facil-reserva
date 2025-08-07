import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { formatCEP, formatDocument, formatPhone } from '@/utils/AddressUtils';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Validation schema for user and establishment registration
const registrationSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação de senha é obrigatória"),
  documentType: z.enum(["cpf", "cnpj"]),
  documentNumber: z.string()
    .refine(val => {
      // Basic validation for CPF (11 digits) or CNPJ (14 digits)
      const digitsOnly = val.replace(/[^\d]/g, '');
      return (digitsOnly.length === 11 || digitsOnly.length === 14);
    }, "CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos"),
  establishmentName: z.string().min(2, "Nome do estabelecimento é obrigatório"),
  description: z.string().optional(),
  address: z.string().min(5, "Endereço é obrigatório"),
  addressNumber: z.string().min(1, "Número é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  zipCode: z.string().min(8, "CEP é obrigatório"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  contact: z.string().optional(),
  workingHours: z.string().min(1, "Horário de funcionamento é obrigatório")
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

const PartnerRegistration: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const navigate = useNavigate();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      documentType: "cpf",
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      documentNumber: "",
      establishmentName: "",
      description: "",
      address: "",
      addressNumber: "",
      city: "",
      state: "",
      zipCode: "",
      contact: "",
      workingHours: "",
    }
  });

  const onSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true);
    setRegistrationStatus('idle');
    
    try {
      // Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            phone: data.phone,
            documentType: data.documentType,
            documentNumber: data.documentNumber
          }
        }
      });

      if (authError) {
        setRegistrationStatus('error');
        setStatusMessage(authError.message || 'Erro ao cadastrar usuário');
        toast.error(authError.message || 'Erro ao cadastrar usuário');
        setIsLoading(false);
        return;
      }

      // If user registration is successful, create establishment
      if (authData.user) {
        // Create the full address string from components
        const fullAddress = `${data.address}, ${data.addressNumber}, ${data.city}, ${data.state}, ${data.zipCode}`;
        
        const { error: establishmentError } = await supabase
          .from('establishments')
          .insert({
            name: data.establishmentName,
            description: data.description,
            contact: data.contact || data.phone, // Use the provided contact or default to phone
            working_hours: data.workingHours,
            user_id: authData.user.id,
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address,
            city: data.city,
            state: data.state,
            zip_code: data.zipCode
          });

        if (establishmentError) {
          console.error('Establishment error:', establishmentError);
          setRegistrationStatus('error');
          setStatusMessage(establishmentError.message || 'Erro ao criar estabelecimento');
          toast.error(establishmentError.message || 'Erro ao criar estabelecimento');
          setIsLoading(false);
          return;
        }

        // Check if email confirmation is required (always true by default in Supabase)
        const needsEmailConfirmation = authData.session === null;
        
        setRegistrationStatus('success');
        setStatusMessage('Cadastro realizado com sucesso! Agora você pode cadastrar seus produtos.');
        
        toast.success('Cadastro realizado com sucesso!');
        
        // Get the establishment data to pass the ID
        const { data: establishmentData } = await supabase
          .from('establishments')
          .select('id')
          .eq('user_id', authData.user.id)
          .single();

        // Always redirect to product registration after establishment creation
        setTimeout(() => {
          navigate('/product-registration', { 
            state: { establishmentId: establishmentData?.id } 
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setRegistrationStatus('error');
      setStatusMessage('Erro no cadastro. Tente novamente.');
      toast.error('Erro no cadastro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get current location if browser supports it
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue('latitude', position.coords.latitude);
          form.setValue('longitude', position.coords.longitude);
          toast.success('Localização obtida com sucesso!');
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Não foi possível obter sua localização. Por favor, insira o endereço manualmente.');
          setIsLoading(false);
        }
      );
    } else {
      toast.error('Seu navegador não suporta geolocalização. Por favor, insira o endereço manualmente.');
    }
  };

  // Buscar endereço pelo CEP
  const fetchAddressByCEP = async (cep: string) => {
    // Remove caracteres não numéricos
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length !== 8) {
      return;
    }

    setCepLoading(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        form.setValue('address', data.logradouro || '');
        form.setValue('city', data.localidade || '');
        form.setValue('state', data.uf || '');
        // Foca no campo de número após preencher o endereço
        document.getElementById('addressNumber')?.focus();
      } else {
        toast.error('CEP não encontrado. Por favor, verifique e tente novamente.');
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      toast.error('Erro ao buscar endereço. Por favor, tente novamente.');
    } finally {
      setCepLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6 text-primary">Cadastro de Parceiro</h1>
      
      {registrationStatus === 'success' && (
        <Alert className="mb-6 bg-green-900/20 border-green-600">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <AlertTitle className="text-green-300">Cadastro realizado com sucesso!</AlertTitle>
          <AlertDescription className="text-green-200">
            {statusMessage}
          </AlertDescription>
        </Alert>
      )}
      
      {registrationStatus === 'error' && (
        <Alert className="mb-6 bg-red-900/20 border-red-600" variant="destructive">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <AlertTitle className="text-red-300">Erro no cadastro</AlertTitle>
          <AlertDescription className="text-red-200">
            {statusMessage}
          </AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-muted/30 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4 text-primary">Dados do Estabelecimento</h2>
            
            <FormField
              control={form.control}
              name="establishmentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium">Nome do estabelecimento</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do estabelecimento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium">Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição do estabelecimento (opcional)" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workingHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium">Horário de funcionamento</FormLabel>
                  <FormControl>
                    <select
                      className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md text-foreground"
                      {...field}
                    >
                      <option value="">Selecione o horário</option>
                      <optgroup label="Café da Manhã e Almoço">
                        <option value="Todos os dias: 06h às 22h">Todos os dias: 06h às 22h</option>
                        <option value="Segunda a Sábado: 07h às 15h, Domingo: 08h às 14h">Segunda a Sábado: 07h às 15h, Domingo: 08h às 14h</option>
                        <option value="Todos os dias: 06h às 14h">Todos os dias: 06h às 14h</option>
                        <option value="Segunda a Sexta: 07h às 16h">Segunda a Sexta: 07h às 16h</option>
                      </optgroup>
                      <optgroup label="Almoço e Jantar">
                        <option value="Todos os dias: 11h às 22h">Todos os dias: 11h às 22h</option>
                        <option value="Segunda a Domingo: 11h às 23h">Segunda a Domingo: 11h às 23h</option>
                        <option value="Terça a Domingo: 12h às 22h">Terça a Domingo: 12h às 22h</option>
                      </optgroup>
                      <optgroup label="Bares e Vida Noturna">
                        <option value="Segunda a Quinta: 17h às 01h, Sexta e Sábado: 17h às 02h">Segunda a Quinta: 17h às 01h, Sexta e Sábado: 17h às 02h</option>
                        <option value="Terça a Domingo: 18h às 02h">Terça a Domingo: 18h às 02h</option>
                        <option value="Quinta a Sábado: 19h às 03h, Domingo: 19h às 00h">Quinta a Sábado: 19h às 03h, Domingo: 19h às 00h</option>
                        <option value="Segunda a Sábado: 16h às 01h">Segunda a Sábado: 16h às 01h</option>
                        <option value="Todos os dias: 18h às 02h">Todos os dias: 18h às 02h</option>
                        <option value="Todos os dias: 11h às 00h">Todos os dias: 11h às 00h</option>
                      </optgroup>
                      <option value="custom">Personalizado</option>
                    </select>
                  </FormControl>
                  {field.value === 'custom' && (
                    <Input 
                      placeholder="Digite o horário personalizado" 
                      onChange={(e) => field.onChange(e.target.value)}
                      className="mt-2"
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium">Contato adicional (opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Contato adicional" 
                      {...field} 
                      value={field.value || ""}
                      onChange={(e) => {
                        const formattedValue = formatPhone(e.target.value);
                        field.onChange(formattedValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="bg-muted/30 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4 text-primary">Dados Pessoais</h2>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium">Nome completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium">E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="E-mail" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium">Telefone</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="(00) 00000-0000" 
                      {...field} 
                      onChange={(e) => {
                        const formattedValue = formatPhone(e.target.value);
                        field.onChange(formattedValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary font-medium">Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary font-medium">Confirmar senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirmar senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem className="md:w-1/3">
                    <FormLabel className="text-primary font-medium">Tipo de documento</FormLabel>
                    <FormControl>
                      <select
                        className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md text-foreground"
                        {...field}
                      >
                        <option value="cpf">CPF (Pessoa Física)</option>
                        <option value="cnpj">CNPJ (Pessoa Jurídica)</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="documentNumber"
                render={({ field }) => (
                  <FormItem className="md:w-2/3">
                    <FormLabel className="text-primary font-medium">Número do documento</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={form.watch('documentType') === 'cpf' ? "000.000.000-00" : "00.000.000/0000-00"}
                        {...field}
                        onChange={(e) => {
                          const type = form.watch('documentType');
                          const formattedValue = formatDocument(e.target.value, type);
                          field.onChange(formattedValue);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="bg-muted/30 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4 text-primary">Endereço e Localização</h2>
            
            <div className="bg-muted/50 p-4 rounded-md mb-4">
              <h3 className="font-medium mb-2 text-primary">Localização do Estabelecimento</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Por favor, forneça o endereço completo do seu estabelecimento ou use a geolocalização automática.
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={getCurrentLocation}
                disabled={isLoading}
                className="w-full mb-4"
              >
                {isLoading ? "Obtendo localização..." : "Usar minha localização atual"}
              </Button>
              
              <div className="flex space-x-2 text-sm mb-2">
                <div>Latitude: {form.watch('latitude') || 'Não definida'}</div>
                <div>Longitude: {form.watch('longitude') || 'Não definida'}</div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium">CEP</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        placeholder="00000-000" 
                        {...field} 
                        onChange={(e) => {
                          const formattedValue = formatCEP(e.target.value);
                          field.onChange(formattedValue);
                        }}
                        onBlur={(e) => {
                          field.onBlur();
                          fetchAddressByCEP(e.target.value);
                        }}
                      />
                    </FormControl>
                    <Button 
                      type="button" 
                      onClick={() => fetchAddressByCEP(form.getValues('zipCode'))}
                      disabled={cepLoading}
                    >
                      {cepLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium">Logradouro</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, Avenida, etc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="addressNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary font-medium">Número</FormLabel>
                    <FormControl>
                      <Input id="addressNumber" placeholder="Número" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary font-medium">Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary font-medium">Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="Estado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading || registrationStatus === 'success'}
            className="w-full bg-blink-primary hover:bg-blink-primary/80 text-black"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Cadastrar Estabelecimento"
            )}
          </Button>
          
          {registrationStatus === 'success' && (
            <p className="text-center text-sm text-muted-foreground">
              Redirecionando para página de login...
            </p>
          )}
        </form>
      </Form>
    </div>
  );
};

export default PartnerRegistration;
