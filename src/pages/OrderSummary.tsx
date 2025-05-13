import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Clock, CreditCard, Check, 
  ShoppingBag, MapPin, Utensils, ClipboardList, DoorOpen, QrCode 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useToast } from '@/components/ui/use-toast';
import CheckoutDialog from '@/components/CheckoutDialog';
import QRCodeScanner from '@/components/QRCodeScanner';

const OrderSummary = () => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Dados simulados do pedido - em uma aplicação real, estes viriam de um banco de dados
  const orderItems = [
    { id: '1', name: 'Isca de Tilápia', price: 45.90, quantity: 1 },
    { id: '2', name: 'Chopp Artesanal', price: 14.90, quantity: 2 }
  ];
  
  const orderTotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const orderTip = orderTotal * 0.10; // 10% de gorjeta
  const orderGrandTotal = orderTotal + orderTip;
  
  // Método de pagamento usado - em uma aplicação real, viria do banco de dados
  const paymentMethod = "Cartão de Crédito (Pré-pago)";
  const isPrepaid = true; // Indicador de que o pagamento foi feito antecipadamente
  
  const handleCompleteOrder = () => {
    setIsCompleting(true);
    
    // Simula a finalização do pedido
    setTimeout(() => {
      setIsCompleting(false);
      setOrderCompleted(true);
      
      toast({
        title: "Pedido finalizado com sucesso!",
        description: "Você já pode sair do estabelecimento usando o QR code.",
      });
    }, 1500);
  };

  const handleCheckout = () => {
    // Open scanner instead of checkout dialog
    setScannerOpen(true);
  };

  const handleCloseCheckoutDialog = () => {
    setCheckoutDialogOpen(false);
    
    // Simula o cliente saindo do estabelecimento
    toast({
      title: "Checkout realizado!",
      description: "Obrigado por sua visita. Volte sempre!",
    });
    
    // Em uma aplicação real, aqui seria registrado o checkout e o cliente seria redirecionado
    navigate('/completed-order/latest');
  };
  
  const handleScanSuccess = () => {
    // In a real app, we would send this information to the backend
    setTimeout(() => {
      navigate('/completed-order/latest');
    }, 3000);
  };
  
  const handleScanError = () => {
    // Nothing special needs to happen here, the scanner component already shows an error message
  };
  
  const handleCloseScanner = () => {
    setScannerOpen(false);
  };

  return (
    <>
      <Navbar />
      <div className="container max-w-md mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <h1 className="text-2xl font-bold mb-2">Resumo do Pedido</h1>
        <p className="text-gray-600 mb-6">
          Boteco Tal • Mesa 2 • 4 pessoas
        </p>
        
        <div className="space-y-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Status do Pedido</CardTitle>
                <Badge className={orderCompleted ? "bg-blue-600" : "bg-green-600"}>
                  {orderCompleted ? "Finalizado" : "Confirmado"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="bg-green-100 p-1 rounded-full mr-3">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Pedido confirmado</p>
                    <p className="text-sm text-gray-500">Hoje, 19:30</p>
                  </div>
                </li>
                <li className="flex items-center">
                  <div className="bg-green-100 p-1 rounded-full mr-3">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Pagamento aprovado</p>
                    <p className="text-sm text-gray-500">Hoje, 19:30</p>
                    {isPrepaid && (
                      <p className="text-xs text-green-600 font-semibold">Pago antecipadamente</p>
                    )}
                  </div>
                </li>
                <li className="flex items-center">
                  <div className="bg-green-100 p-1 rounded-full mr-3">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Check-in realizado</p>
                    <p className="text-sm text-gray-500">Hoje, 19:45</p>
                  </div>
                </li>
                <li className="flex items-center">
                  <div className={`${orderCompleted ? "bg-green-100" : "bg-blink-light"} p-1 rounded-full mr-3`}>
                    {orderCompleted ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-blink-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{orderCompleted ? "Pedido finalizado" : "Preparando pedido"}</p>
                    <p className="text-sm text-gray-500">{orderCompleted ? "Hoje, 20:15" : "Em andamento"}</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Informações do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-blink-primary mt-0.5 mr-2" />
                <div>
                  <p className="font-medium">Boteco Tal</p>
                  <p className="text-sm text-gray-500">Rua das Flores, 123</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Utensils className="h-5 w-5 text-blink-primary mt-0.5 mr-2" />
                <div>
                  <p className="font-medium">Mesa 2</p>
                  <p className="text-sm text-gray-500">4 pessoas</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CreditCard className="h-5 w-5 text-blink-primary mt-0.5 mr-2" />
                <div>
                  <p className="font-medium">{paymentMethod}</p>
                  <p className="text-sm text-green-500 font-semibold">
                    {isPrepaid ? "Pago antecipadamente" : "Aprovado"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <ClipboardList className="h-5 w-5 text-blink-primary mt-0.5 mr-2" />
                <div>
                  <p className="font-medium">Pedido #12345</p>
                  <p className="text-sm text-gray-500">Hoje, 19:30</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Itens do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {orderItems.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} {item.quantity === 1 ? 'unidade' : 'unidades'} x R$ {item.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-medium">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-gray-600">Subtotal</p>
                  <p>R$ {orderTotal.toFixed(2)}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-600">Gorjeta sugerida (10%)</p>
                  <p>R$ {orderTip.toFixed(2)}</p>
                </div>
                <div className="flex justify-between font-bold">
                  <p>Total</p>
                  <p>R$ {orderGrandTotal.toFixed(2)}</p>
                </div>
                {isPrepaid && (
                  <div className="mt-2 p-2 bg-green-100 text-green-800 rounded text-sm text-center">
                    Pagamento realizado antecipadamente
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          {!orderCompleted ? (
            <Button 
              className="w-full bg-blink-primary hover:bg-blink-secondary hover:text-white text-blink-text"
              size="lg"
              onClick={handleCompleteOrder}
              disabled={isCompleting}
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              {isCompleting ? "Finalizando..." : "Finalizar Pedido"}
            </Button>
          ) : (
            <Button 
              className="w-full bg-blink-primary hover:bg-blink-secondary hover:text-white text-blink-text"
              size="lg"
              onClick={handleCheckout}
            >
              <QrCode className="mr-2 h-5 w-5" />
              Escanear QR Code da Saída
            </Button>
          )}
          
          <p className="text-center text-sm text-gray-500">
            {!orderCompleted ? 
              "Finalize seu pedido quando terminar sua refeição. Isso liberará a mesa para outros clientes." :
              "Escaneie o QR Code na porta para sair do estabelecimento."
            }
          </p>
        </div>
      </div>

      {/* QR Code Scanner */}
      {scannerOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <QRCodeScanner 
              orderId={12345}
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
              onClose={handleCloseScanner}
            />
          </div>
        </div>
      )}

      {/* Checkout Dialog */}
      <CheckoutDialog
        isOpen={checkoutDialogOpen}
        onClose={handleCloseCheckoutDialog}
        orderId={12345}
        tableNumber={2}
      />
    </>
  );
};

export default OrderSummary;
