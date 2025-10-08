
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, Home, Search, ClipboardList, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
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
            <Link to="/" className="flex-shrink-0 flex items-center">
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
              to="/check-in/latest" 
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blink-secondary hover:text-white"
            >
              Check-in
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
              to="/check-in/latest"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blink-secondary hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <ClipboardList className="mr-2 h-4 w-4" />
                Check-in
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
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
