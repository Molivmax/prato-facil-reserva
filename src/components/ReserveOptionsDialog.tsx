import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, CreditCard, Cake, Clock } from 'lucide-react';

interface ReserveOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hasDesserts: boolean;
  onChooseDessert: () => void;
  onPayNow: () => void;
  onPayLater: () => void;
}

const ReserveOptionsDialog = ({ 
  isOpen, 
  onClose, 
  hasDesserts, 
  onChooseDessert, 
  onPayNow, 
  onPayLater 
}: ReserveOptionsDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Finalizar Reserva</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {hasDesserts ? (
            <>
              <p className="text-center text-muted-foreground">
                Escolha uma opção para finalizar sua reserva:
              </p>
              
              <div className="grid gap-3">
                <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={onChooseDessert}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary rounded-full p-2">
                        <Cake className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">Escolher Sobremesa</h3>
                        <p className="text-sm text-muted-foreground">
                          Explore nossas deliciosas sobremesas
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={onPayNow}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary rounded-full p-2">
                        <CreditCard className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">Pagar Agora</h3>
                        <p className="text-sm text-muted-foreground">
                          Finalizar pagamento e confirmar reserva
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <>
              <p className="text-center text-muted-foreground">
                Como deseja finalizar o pagamento?
              </p>
              
              <div className="grid gap-3">
                <Button 
                  onClick={onPayNow}
                  className="h-auto p-4 justify-start bg-primary hover:bg-primary/90"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-foreground rounded-full p-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-primary-foreground">Pagar Agora</div>
                      <div className="text-sm text-primary-foreground/80">
                        Finalizar pagamento e confirmar reserva
                      </div>
                    </div>
                  </div>
                </Button>

                <Button 
                  onClick={onPayLater}
                  variant="outline"
                  className="h-auto p-4 justify-start"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-muted rounded-full p-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Pagar Depois</div>
                      <div className="text-sm text-muted-foreground">
                        Pagar no estabelecimento
                      </div>
                    </div>
                  </div>
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReserveOptionsDialog;