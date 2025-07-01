
import React from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart, Calendar } from 'lucide-react';

interface CartFooterProps {
  cartItems: {id: string, name: string, price: number, quantity: number}[];
  totalAmount: number;
  onReserve: () => void;
}

const CartFooter = ({ cartItems, totalAmount, onReserve }: CartFooterProps) => {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg py-4">
      <div className="container max-w-4xl mx-auto px-4">
        {cartItems.length > 0 ? (
          <div className="space-y-3">
            {/* Items Summary */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <ShoppingCart className="h-4 w-4 text-restaurant-primary mr-2" />
                <span className="font-medium">
                  {totalItems} {totalItems === 1 ? 'item' : 'itens'} no carrinho
                </span>
              </div>
              <div className="text-lg font-bold text-restaurant-primary">
                Total: R$ {totalAmount.toFixed(2)}
              </div>
            </div>

            {/* Items Details */}
            <div className="max-h-20 overflow-y-auto space-y-1">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm text-gray-600">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Reserve Button */}
            <Button 
              size="lg" 
              className="w-full bg-blink-primary text-black hover:bg-blink-secondary font-medium"
              onClick={onReserve}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Reservar mesa
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Carrinho vazio</span>
            <Button 
              size="lg" 
              className="bg-blink-primary text-black hover:bg-blink-secondary font-medium"
              onClick={onReserve}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Reservar mesa
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartFooter;
