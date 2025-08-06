
import React from 'react';
import { Button } from "@/components/ui/button";
import { Menu, Star } from 'lucide-react';

interface RestaurantTabsProps {
  showProducts: boolean;
  setShowProducts: (show: boolean) => void;
}

const RestaurantTabs = ({ showProducts, setShowProducts }: RestaurantTabsProps) => {
  return (
    <div className="flex space-x-4 mb-6">
      <Button
        variant={showProducts ? "default" : "outline"}
        className={showProducts ? "bg-blink-primary text-black hover:bg-blink-secondary font-medium" : "text-black font-medium"}
        onClick={() => setShowProducts(true)}
      >
        <Menu className="mr-2 h-5 w-5" />
        Cardápio
      </Button>
      
      <Button
        variant={!showProducts ? "default" : "outline"}
        className={!showProducts ? "bg-blink-primary text-black hover:bg-blink-secondary font-medium" : "text-black font-medium"}
        onClick={() => setShowProducts(false)}
      >
        <Star className="mr-2 h-5 w-5" />
        Sobre
      </Button>
    </div>
  );
};

export default RestaurantTabs;
