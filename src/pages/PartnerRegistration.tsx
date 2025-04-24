
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Validation schema for user and establishment registration
const registrationSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
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
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  zipCode: z.string().min(8, "CEP é obrigatório"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  contact: z.string().optional(),
  workingHours: z.string().min(1, "Horário de funcionamento é obrigatório")
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

const PartnerRegistration: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Basic info, 2: Address info
  const navigate = useNavigate();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      documentType: "cpf",
      latitude: undefined,
      longitude: undefined,
    }
  });

  const onSubmit = async (data: RegistrationFormData) => {
    if (step === 1) {
      setStep(2);
      return;
    }
    
    setIsLoading(true);
    
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
        toast.error(authError.message || 'Erro ao cadastrar usuário');
        return;
      }

      // If user registration is successful, create establishment
      if (authData.user) {
        const { error: establishmentError } = await supabase
          .from('establishments')
          .insert({
            name: data.establishmentName,
            description: data.description,
            contact: data.contact,
            working_hours: data.workingHours,
            user_id: authData.user.id,
            address: data.address,
            city: data.city,
            state: data.state,
            zip_code: data.zipCode,
            latitude: data.latitude,
            longitude: data.longitude
          });

        if (establishmentError) {
          toast.error(establishmentError.message || 'Erro ao criar estabelecimento');
          return;
        }

        toast.success('Cadastro realizado com sucesso!');
        navigate('/establishment-dashboard'); // Redirect to dashboard where they can add menu items
      }
    } catch (error) {
      console.error('Registration error:', error);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Cadastro de Parceiro</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 ? (
            // Step 1: Basic Info
            <>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
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
                    <FormLabel>E-mail</FormLabel>
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
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Telefone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-4">
                <FormField
                  control={form.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem className="w-1/3">
                      <FormLabel>Tipo de documento</FormLabel>
                      <FormControl>
                        <select
                          className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md"
                          {...field}
                        >
                          <option value="cpf">CPF</option>
                          <option value="cnpj">CNPJ</option>
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
                    <FormItem className="w-2/3">
                      <FormLabel>Número do documento</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={form.watch('documentType') === 'cpf' ? "CPF" : "CNPJ"} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="establishmentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do estabelecimento</FormLabel>
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
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição do estabelecimento (opcional)" 
                        {...field} 
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
                    <FormLabel>Horário de funcionamento</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Seg-Sex: 8h às 18h, Sáb: 9h às 13h" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contato adicional (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Contato adicional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : (
            // Step 2: Address and Location Info
            <>
              <div className="bg-muted/50 p-4 rounded-md mb-4">
                <h2 className="font-medium mb-2">Localização do Estabelecimento</h2>
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
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, complemento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
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
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="Estado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input placeholder="00000-000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="mr-2">
                Voltar
              </Button>
            </>
          )}
          
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Processando..." : step === 1 ? "Continuar" : "Cadastrar"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default PartnerRegistration;
