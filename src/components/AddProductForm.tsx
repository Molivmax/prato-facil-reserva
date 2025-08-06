
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

// Zod schema for product validation
const productSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  description: z.string().optional(),
  price: z.coerce.number().positive("O preço deve ser maior que zero"),
  category: z.string().min(1, "Categoria é obrigatória"),
  image_url: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface AddProductFormProps {
  establishmentId: string;
  onSuccess?: () => void;
}

const AddProductForm = ({ establishmentId, onSuccess }: AddProductFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
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
          price: data.price,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Nome do Produto</FormLabel>
              <FormControl>
                <Input placeholder="Nome do produto" {...field} className="bg-gray-700 border-gray-600 text-white" />
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
              <FormLabel className="text-white">Descrição (opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva o produto..." 
                  className="resize-none bg-gray-700 border-gray-600 text-white" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Preço</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00" 
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Categoria</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="Entrada">Entrada</SelectItem>
                  <SelectItem value="Prato Principal">Prato Principal</SelectItem>
                  <SelectItem value="Sobremesa">Sobremesa</SelectItem>
                  <SelectItem value="Bebida">Bebida</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div>
          <FormLabel className="text-white">Imagem do Produto (opcional)</FormLabel>
          <div className="mt-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mb-3 bg-gray-700 border-gray-600 text-white"
            />
            {imageUrl && (
              <div className="mt-2 w-full max-w-xs">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-md border border-gray-600"
                />
              </div>
            )}
          </div>
        </div>
        
        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-blink-primary hover:bg-blink-primary/90 text-black"
        >
          {isLoading ? 'Salvando...' : 'Salvar Produto'}
        </Button>
      </form>
    </Form>
  );
};

export default AddProductForm;
