
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Phone } from 'lucide-react';

interface RestaurantInfoCardsProps {
  address: string;
  openingHours: string;
  phoneNumber: string;
}

const RestaurantInfoCards = ({ address, openingHours, phoneNumber }: RestaurantInfoCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="bg-white">
        <CardContent className="p-4 flex items-center">
          <MapPin className="h-5 w-5 text-restaurant-primary mr-2" />
          <div>
            <p className="text-sm font-medium text-black">Endereço</p>
            <p className="text-sm text-gray-700">{address}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white">
        <CardContent className="p-4 flex items-center">
          <Clock className="h-5 w-5 text-restaurant-primary mr-2" />
          <div>
            <p className="text-sm font-medium text-black">Horário</p>
            <p className="text-sm text-gray-700">{openingHours}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white">
        <CardContent className="p-4 flex items-center">
          <Phone className="h-5 w-5 text-restaurant-primary mr-2" />
          <div>
            <p className="text-sm font-medium text-black">Telefone</p>
            <p className="text-sm text-gray-700">{phoneNumber}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RestaurantInfoCards;
