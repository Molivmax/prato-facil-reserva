import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check } from 'lucide-react';

interface AssignTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | number;
  partySize: number;
  currentTableNumber: number;
}

const AssignTableDialog = ({ 
  open, 
  onOpenChange, 
  orderId, 
  partySize,
  currentTableNumber 
}: AssignTableDialogProps) => {
  const [tableNumber, setTableNumber] = useState<string>(currentTableNumber.toString());
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssignTable = async () => {
    if (!tableNumber || tableNumber === '0') {
      toast.error('Por favor, informe o número da mesa');
      return;
    }

    setIsAssigning(true);
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ assigned_table: parseInt(tableNumber) })
        .eq('id', orderId.toString());

      if (error) throw error;

      toast.success(`Mesa ${tableNumber} atribuída com sucesso!`, {
        description: `Cliente será notificado sobre a mesa ${tableNumber}`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atribuir mesa:', error);
      toast.error('Não foi possível atribuir a mesa');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Atribuir Mesa ao Pedido</DialogTitle>
          <DialogDescription className="text-gray-400">
            Este pedido é para {partySize} {partySize === 1 ? 'pessoa' : 'pessoas'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tableNumber">Número da Mesa</Label>
            <Input
              id="tableNumber"
              type="number"
              min="1"
              placeholder="Ex: 5"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <p className="text-sm text-gray-400">
              💡 Sugestão: Mesa com {partySize} ou mais lugares
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={() => onOpenChange(false)}
            disabled={isAssigning}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-blink-primary hover:bg-blink-primary/90 text-black font-semibold"
            onClick={handleAssignTable}
            disabled={isAssigning}
          >
            {isAssigning ? (
              "Atribuindo..."
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Atribuir Mesa
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignTableDialog;
