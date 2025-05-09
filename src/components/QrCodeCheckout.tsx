
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, DoorOpen } from 'lucide-react';

interface QrCodeCheckoutProps {
  orderId: number;
  tableNumber: number;
  onClose: () => void;
}

const QrCodeCheckout = ({ orderId, tableNumber, onClose }: QrCodeCheckoutProps) => {
  // In a real application, this would generate a unique QR code for checkout
  const checkoutCode = `CHECKOUT-${orderId}-${tableNumber}-${Date.now()}`;
  
  return (
    <Card className="w-full bg-gray-800 border border-gray-700 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <DoorOpen className="h-5 w-5 text-blink-primary" />
          Checkout - Mesa #{tableNumber}
        </CardTitle>
        <CardDescription className="text-gray-300">
          O cliente pode sair escaneando o QR code abaixo na porta
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="bg-white p-6 rounded-md mb-4">
          {/* This would be a real QR code in production */}
          <div className="w-40 h-40 flex items-center justify-center">
            <QrCode className="w-full h-full text-black" />
            <p className="absolute text-xs text-black font-bold">{checkoutCode}</p>
          </div>
        </div>
        <p className="text-sm text-center text-gray-300 mb-6">
          Este QR code permite que o cliente libere a saída do estabelecimento.
          <br />
          Após a leitura, a mesa será liberada para novos clientes.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button 
          variant="outline" 
          className="border-gray-600 hover:bg-gray-700"
          onClick={onClose}
        >
          Fechar
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QrCodeCheckout;
