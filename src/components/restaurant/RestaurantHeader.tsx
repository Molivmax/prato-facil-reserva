
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
        {/* Nome do bar sobreposto na imagem */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-4xl font-bold text-white bg-black bg-opacity-70 px-4 py-2 rounded-lg shadow-lg">
            {name}
          </h1>
        </div>
      </div>
      
      <p className="text-gray-700 mb-4 font-medium text-lg">{cuisine}</p>
    </>
  );
};

export default RestaurantHeader;
