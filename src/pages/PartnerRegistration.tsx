
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Image, Store } from 'lucide-react';

const PartnerRegistration = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast({
            title: "Localização obtida com sucesso",
            description: "Suas coordenadas foram salvas.",
          });
        },
        (error) => {
          toast({
            title: "Erro ao obter localização",
            description: "Por favor, permita o acesso à sua localização.",
            variant: "destructive",
          });
        }
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-black/70 p-4">
      <Card className="w-full max-w-2xl bg-black/50 backdrop-blur-md border border-white/10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Cadastro de Parceiro</CardTitle>
          <CardDescription className="text-gray-400">
            Cadastre seu estabelecimento no Blink
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Nome do Estabelecimento</Label>
              <div className="relative">
                <Store className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input 
                  placeholder="Digite o nome do seu estabelecimento"
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Localização</Label>
              <div className="flex gap-2">
                <Button 
                  onClick={requestLocation}
                  className="flex-1 bg-blink-primary hover:bg-blink-secondary text-blink-text"
                >
                  <MapPin className="mr-2" />
                  {location ? "Atualizar Localização" : "Obter Localização"}
                </Button>
              </div>
              {location && (
                <p className="text-sm text-gray-400">
                  Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-white">Descrição</Label>
              <Textarea 
                placeholder="Descreva seu estabelecimento..."
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Horário de Funcionamento</Label>
              <Input 
                placeholder="Ex: Segunda a Sexta, 09:00 - 18:00"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Contato</Label>
              <Input 
                type="tel"
                placeholder="(00) 00000-0000"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <Button className="w-full bg-blink-primary hover:bg-blink-secondary text-blink-text">
            Cadastrar Estabelecimento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerRegistration;
