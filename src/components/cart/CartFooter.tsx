import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart, Calendar, ChevronUp } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import CartDrawer from './CartDrawer';

interface CartFooterProps {
  cartItems: {id: string, name: string, price: number, quantity: number, image?: string}[];
  totalAmount: number;
  onReserve: () => void;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart?: () => void;
}

const CartFooter = ({ 
  cartItems, 
  totalAmount, 
  onReserve, 
  onUpdateQuantity,
  onRemoveItem,
  onClearCart 
}: CartFooterProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const safeTotal = Number(totalAmount) || 0;
  
  console.log('🎯 CartFooter Render:', {
    itemCount: cartItems.length,
    totalItems,
    totalAmount,
    safeTotal,
    cartItems
  });

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg py-2 z-40">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="relative">
                <ShoppingCart className="h-5 w-5 text-primary" />
                {totalItems > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {totalItems}
                  </Badge>
                )}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xs text-muted-foreground">Ver carrinho</span>
                <span className="text-base font-bold">R$ {safeTotal.toFixed(2)}</span>
              </div>
              <ChevronUp className="h-4 w-4 text-muted-foreground ml-1" />
            </button>
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

      <CartDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        cartItems={cartItems}
        totalAmount={safeTotal}
        onUpdateQuantity={onUpdateQuantity}
        onRemoveItem={onRemoveItem}
        onReserve={onReserve}
        onClearCart={onClearCart}
      />
    </>
  );
};

export default CartFooter;
