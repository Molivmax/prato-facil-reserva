import { QrCode, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface PixPaymentProgressProps {
  status: 'waiting' | 'detected' | 'confirming' | 'confirmed';
  progress: number;
}

const PixPaymentProgress = ({ status, progress }: PixPaymentProgressProps) => {
  const statusConfig = {
    waiting: {
      icon: QrCode,
      text: 'Aguardando pagamento...',
      subtext: 'Escaneie o QR Code ou cole o código PIX',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
    },
    detected: {
      icon: Loader2,
      text: 'Pagamento detectado!',
      subtext: 'Processando confirmação...',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    confirming: {
      icon: Loader2,
      text: 'Confirmando pagamento...',
      subtext: 'Aguarde alguns instantes',
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
    },
    confirmed: {
      icon: CheckCircle2,
      text: 'Pagamento confirmado!',
      subtext: 'Redirecionando...',
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;
  const isAnimated = status === 'detected' || status === 'confirming';

  return (
    <div className="space-y-3">
      <Progress value={progress} className="h-2" />
      
      <div className={cn(
        'flex items-center gap-3 p-4 rounded-lg border transition-all',
        config.bgColor,
        status === 'confirmed' ? 'border-green-400/30' : 'border-white/10'
      )}>
        <div className="flex-shrink-0">
          <Icon 
            className={cn(
              'h-6 w-6',
              config.color,
              isAnimated && 'animate-spin'
            )} 
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={cn('font-semibold text-sm', config.color)}>
            {config.text}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {config.subtext}
          </p>
        </div>

        {status !== 'confirmed' && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{Math.round(progress)}%</span>
          </div>
        )}
      </div>

      {status === 'waiting' && (
        <p className="text-xs text-center text-gray-400">
          O pagamento é confirmado automaticamente após o PIX ser processado
        </p>
      )}
    </div>
  );
};

export default PixPaymentProgress;
