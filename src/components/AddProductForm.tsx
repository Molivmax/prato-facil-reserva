
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CurrencyInput from '@/components/CurrencyInput';

// Zod schema for product validation
const productSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  description: z.string().optional(),
  price: z.string().min(1, "Preço é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  image_url: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface AddProductFormProps {
  establishmentId: string;
  onSuccess?: () => void;
  onFinishRegistration?: () => void;
  onToggleSuccessView?: (visible: boolean) => void;
}

const AddProductForm = ({ establishmentId, onSuccess, onFinishRegistration, onToggleSuccessView }: AddProductFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showSuccessActions, setShowSuccessActions] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '0',
      category: '',
      image_url: '',
    }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      // Create a preview URL for the uploaded image
      const previewUrl = URL.createObjectURL(file);
      setImageUrl(previewUrl);
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const filename = `${Math.random()}.${fileExt}`;
    const filePath = `${filename}`;

    const { error: uploadError, data } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setIsLoading(true);
      
      let finalImageUrl = '';
      
      // If there's an image to upload
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }
      
      const { error } = await supabase
        .from('products')
        .insert({
          name: data.name,
          description: data.description || null,
          price: parseFloat(data.price) / 100, // Convert from cents to reais
          category: data.category,
          establishment_id: establishmentId,
          image_url: finalImageUrl || null,
        });
      
      if (error) {
        throw error;
      }
      
      form.reset();
      setImageUrl(null);
      setImageFile(null);
      setShowSuccessActions(true);
      onToggleSuccessView?.(true);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast.error(error.message || 'Erro ao adicionar produto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAnother = () => {
    setShowSuccessActions(false);
    onToggleSuccessView?.(false);
  };

  const handleFinishRegistration = () => {
    if (onFinishRegistration) {
      onFinishRegistration();
    }
  };

  if (showSuccessActions) {
    return (
      <div className="text-center space-y-4 p-6 bg-muted/30 rounded-lg">
        <h3 className="text-lg font-semibold text-primary">Produto salvo com sucesso!</h3>
        <p className="text-muted-foreground">O que deseja fazer agora?</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleAddAnother}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Adicionar Outro Produto
          </Button>
          <Button 
            onClick={handleFinishRegistration}
            variant="outline"
            className="flex-1"
          >
            Finalizar e ir para pedidos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Categoria - Primeiro campo */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-primary">Categoria</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-background border-border z-50">
                  <SelectItem value="Entrada">Entrada</SelectItem>
                  <SelectItem value="Prato Principal">Prato Principal</SelectItem>
                  <SelectItem value="Sobremesa">Sobremesa</SelectItem>
                  <SelectItem value="Bebida">Bebida</SelectItem>
                  <SelectItem value="Combo">Combo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nome do Produto - Segundo campo */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-primary">Nome do Produto</FormLabel>
              <FormControl>
                <Input placeholder="Nome do produto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Descrição - Terceiro campo */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-primary">Descrição (opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva o produto..." 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Preço - Quarto campo */}
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-primary">Preço</FormLabel>
              <FormControl>
                <CurrencyInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="R$ 0,00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Imagem - Quinto campo */}
        <div>
          <FormLabel className="text-primary">Imagem do Produto (opcional)</FormLabel>
          <div className="mt-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mb-3"
            />
            {imageUrl && (
              <div className="mt-2 w-full max-w-xs">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-md border"
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Botão Salvar */}
        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isLoading ? 'Salvando...' : 'Salvar Produto'}
        </Button>
      </form>
    </Form>
  );
};

export default AddProductForm;
