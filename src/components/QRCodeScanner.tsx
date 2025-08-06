
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Camera, Check, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface QRCodeScannerProps {
  orderId: number;
  onScanSuccess: () => void;
  onScanError: () => void;
  onClose: () => void;
}

const QRCodeScanner = ({ orderId, onScanSuccess, onScanError, onClose }: QRCodeScannerProps) => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setResult] = useState<'success' | 'error' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanInterval = useRef<number | null>(null);

  // Start camera and scanning process
  const startScanning = async () => {
    setScanning(true);
    setResult(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // In a real app, we would use a QR code scanning library
        // For this demo, we'll simulate the scanning process
        simulateScan();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast({
        title: "Erro ao acessar câmera",
        description: "Verifique se você permitiu o acesso à câmera do dispositivo.",
      });
      setScanning(false);
    }
  };

  // Simulate QR code scanning
  const simulateScan = () => {
    // For demo purposes, we'll simulate scanning a code after a delay
    setTimeout(() => {
      // Check if the order has any pending issues (in a real app, this would check with the backend)
      const hasPendingIssues = Math.random() > 0.7; // 30% chance of having an issue for demonstration
      
      if (hasPendingIssues) {
        setResult('error');
        onScanError();
        toast({
          title: "Checkout não autorizado",
          description: "Existem pendências no seu pedido. Por favor, consulte um atendente.",
          variant: "destructive"
        });
      } else {
        setResult('success');
        onScanSuccess();
        toast({
          title: "Checkout autorizado!",
          description: "Saída liberada. Obrigado pela visita!",
        });
      }
      
      stopScanning();
    }, 2500);
  };

  // Stop camera and scanning
  const stopScanning = () => {
    setScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (scanInterval.current) {
      clearInterval(scanInterval.current);
      scanInterval.current = null;
    }
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <Card className="w-full bg-gray-800 border border-gray-700 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <QrCode className="h-5 w-5 text-blink-primary" />
          Escaneie o QR Code na saída
        </CardTitle>
        <CardDescription className="text-gray-300">
          Aponte a câmera para o QR code na porta do estabelecimento
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center">
        {!scanning && !scanResult && (
          <div className="flex flex-col items-center">
            <div className="w-64 h-64 flex items-center justify-center bg-gray-700 rounded-md mb-4">
              <QrCode className="w-32 h-32 text-gray-500" />
            </div>
            <p className="text-sm text-center text-gray-300 mb-6">
              Clique em "Iniciar Scanner" e aponte para o QR code na saída.
            </p>
          </div>
        )}
        
        {scanning && (
          <div className="relative w-64 h-64 bg-black rounded-md overflow-hidden mb-4">
            <video 
              ref={videoRef} 
              className="absolute inset-0 w-full h-full object-cover"
              muted
              playsInline
            />
            <canvas 
              ref={canvasRef} 
              className="absolute inset-0 w-full h-full opacity-0" 
              width={320}
              height={320}
            />
            <div className="absolute inset-0 border-2 border-blink-primary opacity-50 z-10">
              <div className="absolute top-1/2 left-0 w-full border-t-2 border-blink-primary"></div>
              <div className="absolute top-0 left-1/2 h-full border-l-2 border-blink-primary"></div>
            </div>
          </div>
        )}
        
        {scanResult === 'success' && (
          <div className="flex flex-col items-center my-6">
            <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-green-500 mb-1">Checkout Autorizado</h3>
            <p className="text-gray-300 text-center">
              Saída liberada. Obrigado pela visita!
            </p>
          </div>
        )}
        
        {scanResult === 'error' && (
          <div className="flex flex-col items-center my-6">
            <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-red-500 mb-1">Checkout Não Autorizado</h3>
            <p className="text-gray-300 text-center">
              Existem pendências no seu pedido. Por favor, consulte um atendente.
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-center gap-3">
        {!scanning && !scanResult && (
          <Button 
            onClick={startScanning} 
            className="bg-blink-primary hover:bg-blink-primary/90 text-black"
          >
            <Camera className="mr-2 h-4 w-4" />
            Iniciar Scanner
          </Button>
        )}
        
        {scanning && (
          <Button 
            onClick={stopScanning} 
            variant="outline" 
            className="border-gray-600 hover:bg-gray-700"
          >
            Cancelar
          </Button>
        )}
        
        {scanResult && (
          <Button 
            onClick={onClose} 
            className={scanResult === 'success' ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"}
          >
            {scanResult === 'success' ? "Concluir" : "Voltar"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default QRCodeScanner;
