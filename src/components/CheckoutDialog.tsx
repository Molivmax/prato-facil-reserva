
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import QrCodeCheckout from './QrCodeCheckout';

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  tableNumber: number;
}

const CheckoutDialog = ({ isOpen, onClose, orderId, tableNumber }: CheckoutDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-transparent border-0 p-0">
        <QrCodeCheckout 
          orderId={orderId} 
          tableNumber={tableNumber} 
          onClose={onClose} 
        />
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;
