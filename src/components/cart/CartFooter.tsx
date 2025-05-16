
import React from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart, Calendar } from 'lucide-react';

interface CartFooterProps {
  cartItems: {id: string, name: string, price: number, quantity: number}[];
  totalAmount: number;
  onReserve: () => void;
}

const CartFooter = ({ cartItems, totalAmount, onReserve }: CartFooterProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md py-3">
      <div className="container max-w-4xl mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          {cartItems.length > 0 ? (
            <div>
              <div className="flex items-center">
                <ShoppingCart className="h-5 w-5 text-restaurant-primary mr-2" />
                <span className="font-medium">{cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}</span>
              </div>
              <div className="text-lg font-bold">
                Total: R$ {totalAmount.toFixed(2)}
              </div>
            </div>
          ) : (
            <span className="text-gray-500">Carrinho vazio</span>
          )}
        </div>
        
        <Button 
          size="lg" 
          className="bg-blink-primary text-black hover:bg-blink-secondary font-medium"
          onClick={onReserve}
        >
          <Calendar className="mr-2 h-5 w-5" />
          Reservar mesa
        </Button>
      </div>
    </div>
  );
};

export default CartFooter;
