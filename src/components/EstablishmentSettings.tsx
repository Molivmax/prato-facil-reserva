import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Save, Building, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EstablishmentSettingsProps {
  establishment: any;
  onEstablishmentUpdate: (updatedEstablishment: any) => void;
}

const EstablishmentSettings: React.FC<EstablishmentSettingsProps> = ({ 
  establishment, 
  onEstablishmentUpdate 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    description: '',
    working_hours: '',
    contact: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (establishment) {
      setFormData({
        name: establishment.name || '',
        email: establishment.email || '',
        description: establishment.description || '',
        working_hours: establishment.working_hours || '',
        contact: establishment.contact || '',
        address: establishment.address || '',
        city: establishment.city || '',
        state: establishment.state || '',
        zip_code: establishment.zip_code || '',
      });
    }
  }, [establishment]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('establishments')
        .update(formData)
        .eq('id', establishment.id)
        .select()
        .single();

      if (error) throw error;

      onEstablishmentUpdate(data);
      toast.success('Dados do estabelecimento atualizados com sucesso!');
    } catch (error: any) {
      console.error('Error updating establishment:', error);
      toast.error(error.message || 'Erro ao atualizar dados do estabelecimento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <CardTitle className="flex items-center text-blink-primary">
            <Building className="h-5 w-5 mr-2" />
            Configurações do Estabelecimento
          </CardTitle>
          <CardDescription className="text-gray-300">
            Gerencie as informações do seu estabelecimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Building className="h-4 w-4 mr-2 text-blink-primary" />
                Informações Básicas
              </h3>
              <Separator className="bg-gray-600" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-200">Nome do Estabelecimento</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="Nome do seu estabelecimento"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="contato@estabelecimento.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-200">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  placeholder="Descreva seu estabelecimento..."
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Phone className="h-4 w-4 mr-2 text-blink-primary" />
                Contato e Horários
              </h3>
              <Separator className="bg-gray-600" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact" className="text-gray-200">Telefone</Label>
                  <Input
                    id="contact"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="working_hours" className="text-gray-200">Horário de Funcionamento</Label>
                  <Input
                    id="working_hours"
                    name="working_hours"
                    value={formData.working_hours}
                    onChange={handleInputChange}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="Seg-Sex: 08:00-18:00"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-blink-primary" />
                Endereço
              </h3>
              <Separator className="bg-gray-600" />
              
              <div className="space-y-2">
                <Label htmlFor="address" className="text-gray-200">Endereço</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  placeholder="Rua, número, bairro"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-gray-200">Cidade</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="São Paulo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-gray-200">Estado</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="SP"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip_code" className="text-gray-200">CEP</Label>
                  <Input
                    id="zip_code"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-blink-primary hover:bg-blink-primary/80 text-black"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstablishmentSettings;