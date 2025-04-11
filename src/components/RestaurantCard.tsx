
import { Link } from 'react-router-dom';
import { Star, MapPin, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RestaurantCardProps {
  id: string;
  name: string;
  image: string;
  rating: number;
  cuisine: string;
  distance: string;
  address: string;
  openingHours: string;
}

const RestaurantCard = ({
  id,
  name,
  image,
  rating,
  cuisine,
  distance,
  address,
  openingHours
}: RestaurantCardProps) => {
  return (
    <Link to={`/restaurant/${id}`} className="restaurant-card block">
      <div className="relative">
        <img 
          src={image} 
          alt={name} 
          className="restaurant-logo"
        />
        <Badge className="absolute top-2 right-2 bg-restaurant-primary">
          {rating} <Star className="ml-1 h-3 w-3 fill-current" />
        </Badge>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-restaurant-text">{name}</h3>
        <p className="text-gray-600 text-sm mb-2">{cuisine}</p>
        <div className="flex items-center text-sm text-gray-500 mb-1">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{address} • {distance}</span>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-1" />
          <span>{openingHours}</span>
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;
