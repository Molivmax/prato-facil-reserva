import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const MPOAuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const establishment = searchParams.get('establishment');
    
    // Redirect to payment setup with success flag
    setTimeout(() => {
      navigate('/payment-setup?success=true');
    }, 1500);
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto" />
        <h2 className="text-2xl font-bold">Conexão realizada com sucesso!</h2>
        <p className="text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
};

export default MPOAuthSuccess;
