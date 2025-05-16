
import React from 'react';
import { Star } from 'lucide-react';

interface RestaurantHeaderProps {
  name: string;
  image: string;
  rating: number;
  cuisine: string;
}

const RestaurantHeader = ({ name, image, rating, cuisine }: RestaurantHeaderProps) => {
  return (
    <>
      <div className="relative h-64 rounded-lg overflow-hidden mb-6">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md">
          <div className="flex items-center">
            <Star className="h-5 w-5 text-yellow-500 fill-current" />
            <span className="ml-1 font-bold">{rating}</span>
          </div>
        </div>
      </div>
      
      <h1 className="text-3xl font-bold mb-2 text-black">{name}</h1>
      <p className="text-gray-700 mb-4 font-medium">{cuisine}</p>
    </>
  );
};

export default RestaurantHeader;
