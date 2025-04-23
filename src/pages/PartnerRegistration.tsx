
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Validation schema for user and establishment registration
const registrationSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  establishmentName: z.string().min(2, "Nome do estabelecimento é obrigatório"),
  description: z.string().optional(),
  contact: z.string().optional(),
  workingHours: z.string().min(1, "Horário de funcionamento é obrigatório")
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

const PartnerRegistration: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema)
  });

  const onSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true);
    
    try {
      // Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            phone: data.phone
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
            user_id: authData.user.id
          });

        if (establishmentError) {
          toast.error(establishmentError.message || 'Erro ao criar estabelecimento');
          return;
        }

        toast.success('Cadastro realizado com sucesso!');
        navigate('/search'); // Redirect to search page after successful registration
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Erro no cadastro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Cadastro de Parceiro</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* User Information */}
        <div>
          <Input 
            {...register('name')}
            placeholder="Nome completo" 
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>
        
        <div>
          <Input 
            type="email"
            {...register('email')}
            placeholder="E-mail" 
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <Input 
            type="tel"
            {...register('phone')}
            placeholder="Telefone" 
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <Input 
            type="password"
            {...register('password')}
            placeholder="Senha" 
            className={errors.password ? 'border-red-500' : ''}
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        </div>

        {/* Establishment Information */}
        <div>
          <Input 
            {...register('establishmentName')}
            placeholder="Nome do estabelecimento" 
            className={errors.establishmentName ? 'border-red-500' : ''}
          />
          {errors.establishmentName && <p className="text-red-500 text-sm mt-1">{errors.establishmentName.message}</p>}
        </div>

        <div>
          <Input 
            {...register('description')}
            placeholder="Descrição (opcional)" 
          />
        </div>

        <div>
          <Input 
            {...register('contact')}
            placeholder="Contato (opcional)" 
          />
        </div>

        <div>
          <Input 
            {...register('workingHours')}
            placeholder="Horário de funcionamento" 
            className={errors.workingHours ? 'border-red-500' : ''}
          />
          {errors.workingHours && <p className="text-red-500 text-sm mt-1">{errors.workingHours.message}</p>}
        </div>

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Cadastrando...' : 'Cadastrar'}
        </Button>
      </form>
    </div>
  );
};

export default PartnerRegistration;
