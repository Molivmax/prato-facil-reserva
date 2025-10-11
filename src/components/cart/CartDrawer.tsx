import React from 'react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Minus, Plus, Trash2, X, ShoppingCart, Calendar } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totalAmount: number;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onReserve: () => void;
  onClearCart?: () => void;
}

const CartDrawer = ({
  isOpen,
  onClose,
  cartItems,
  totalAmount,
  onUpdateQuantity,
  onRemoveItem,
  onReserve,
  onClearCart
}: CartDrawerProps) => {
  const isMobile = useIsMobile();
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const CartContent = () => (
    <>
      {/* Items List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ShoppingCart className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Seu carrinho está vazio</p>
            <p className="text-sm">Adicione itens para começar seu pedido</p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.id} className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex gap-3">
                {item.image && (
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    R$ {item.price.toFixed(2)} cada
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer with Summary and Actions */}
      {cartItems.length > 0 && (
        <div className="border-t bg-background p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total de itens</span>
              <span className="font-medium">{totalItems}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold text-primary">
                R$ {totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Button 
              className="w-full bg-blink-primary text-black hover:bg-blink-secondary font-medium"
              onClick={() => {
                onReserve();
                onClose();
              }}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Reservar mesa
            </Button>
            {onClearCart && (
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (confirm('Deseja limpar todo o carrinho?')) {
                    onClearCart();
                    onClose();
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar carrinho
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DrawerTitle>Seu Pedido</DrawerTitle>
                {cartItems.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {totalItems}
                  </Badge>
                )}
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <CartContent />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle>Seu Pedido</SheetTitle>
              {cartItems.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {totalItems}
                </Badge>
              )}
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>
        <CartContent />
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;