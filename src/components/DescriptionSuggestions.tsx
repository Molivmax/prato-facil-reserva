import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DescriptionSuggestionsProps {
  onSelect: (description: string) => void;
}

const DescriptionSuggestions: React.FC<DescriptionSuggestionsProps> = ({ onSelect }) => {
  const [type, setType] = React.useState('');
  const [customType, setCustomType] = React.useState('');
  const [specialties, setSpecialties] = React.useState('');
  const [atmosphere, setAtmosphere] = React.useState('');

  const generateDescriptions = () => {
    const establishmentType = type === 'Outros' ? customType : type;
    if (!establishmentType || !specialties) return [];

    const shortDesc = `${establishmentType} especializado em ${specialties}. ${atmosphere}`;
    
    const mediumDesc = `${establishmentType} acolhedor com ${specialties}. Oferecemos uma experiência única com ${atmosphere.toLowerCase()}`;
    
    const longDesc = `Bem-vindo ao nosso ${establishmentType.toLowerCase()} onde nos especializamos em ${specialties}. ${atmosphere} Venha nos conhecer e desfrute de uma experiência gastronômica única.`;

    return [shortDesc, mediumDesc, longDesc];
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label className="text-white">Tipo de Estabelecimento</Label>
          <Select onValueChange={setType}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Restaurante">Restaurante</SelectItem>
              <SelectItem value="Bar">Bar</SelectItem>
              <SelectItem value="Café">Café</SelectItem>
              <SelectItem value="Lanchonete">Lanchonete</SelectItem>
              <SelectItem value="Pizzaria">Pizzaria</SelectItem>
              <SelectItem value="Outros">Outros</SelectItem>
            </SelectContent>
          </Select>
          {type === 'Outros' && (
            <Input
              placeholder="Especifique o tipo de estabelecimento"
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 mt-2"
              onChange={(e) => setCustomType(e.target.value)}
            />
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-white">Especialidades</Label>
          <Input
            placeholder="Ex: comida italiana, pizzas artesanais, cafés especiais"
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
            onChange={(e) => setSpecialties(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white">Ambiente</Label>
          <Select onValueChange={setAtmosphere}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Selecione o ambiente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ambiente familiar e acolhedor">Familiar</SelectItem>
              <SelectItem value="Ambiente moderno e descontraído">Moderno</SelectItem>
              <SelectItem value="Ambiente sofisticado e elegante">Sofisticado</SelectItem>
              <SelectItem value="Ambiente casual e despojado">Casual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {((type !== 'Outros' && type) || (type === 'Outros' && customType)) && specialties && atmosphere && (
          <div className="space-y-4">
            <Label className="text-white">Sugestões de Descrição</Label>
            {generateDescriptions().map((desc, index) => (
              <Card 
                key={index}
                className="p-4 bg-white/10 border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
                onClick={() => onSelect(desc)}
              >
                <p className="text-white">{desc}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {index === 0 ? "Descrição Curta" : index === 1 ? "Descrição Média" : "Descrição Longa"}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DescriptionSuggestions;
