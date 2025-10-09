
import React from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart, Calendar, Trash2 } from 'lucide-react';

interface CartFooterProps {
  cartItems: {id: string, name: string, price: number, quantity: number}[];
  totalAmount: number;
  onReserve: () => void;
  onClearCart?: () => void;
}

const CartFooter = ({ cartItems, totalAmount, onReserve, onClearCart }: CartFooterProps) => {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg py-2">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
            <span className="text-base font-bold">R$ {totalAmount.toFixed(2)}</span>
          </div>
          <Button 
            size="default"
            className="bg-blink-primary text-black hover:bg-blink-secondary font-medium"
            onClick={onReserve}
            disabled={cartItems.length === 0}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Reservar mesa
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartFooter;
