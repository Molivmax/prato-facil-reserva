
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, Home, Search, ClipboardList, Zap, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Don't show navbar on landing page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav className="bg-blink-primary text-blink-text shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/search" className="flex-shrink-0 flex items-center cursor-pointer hover:opacity-80 transition-opacity">
              <Zap className="h-6 w-6 mr-2" />
              <span className="font-bold text-xl">Blink</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/search" 
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blink-secondary hover:text-white"
            >
              Buscar Restaurantes
            </Link>
            <Link 
              to="/my-orders" 
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blink-secondary hover:text-white"
            >
              Meus Pedidos
            </Link>
            <Link 
              to="/my-orders" 
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blink-secondary hover:text-white"
            >
              Meus Pedidos
            </Link>
            <Button 
              variant="secondary" 
              className="bg-blink-secondary text-white hover:bg-blink-secondary/90"
              asChild
            >
              <Link to="/account">
                <User className="mr-2 h-4 w-4" />
                Conta
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
          
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-blink-text hover:bg-blink-secondary hover:text-white focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-blink-primary">
            <Link
              to="/search"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blink-secondary hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <Search className="mr-2 h-4 w-4" />
                Buscar Restaurantes
              </div>
            </Link>
            <Link
              to="/my-orders"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blink-secondary hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <ClipboardList className="mr-2 h-4 w-4" />
                Meus Pedidos
              </div>
            </Link>
            <Link
              to="/my-orders"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blink-secondary hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <ClipboardList className="mr-2 h-4 w-4" />
                Meus Pedidos
              </div>
            </Link>
            <Link
              to="/account"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blink-secondary hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Minha Conta
              </div>
            </Link>
            <button
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-blink-secondary hover:text-white"
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
            >
              <div className="flex items-center">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </div>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
