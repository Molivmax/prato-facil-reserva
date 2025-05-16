
import React from 'react';

interface RestaurantAboutProps {
  description: string;
}

const RestaurantAbout = ({ description }: RestaurantAboutProps) => {
  return (
    <div className="mb-8 bg-white p-4 rounded-lg">
      <h2 className="text-xl font-semibold mb-3 text-black">Sobre</h2>
      <p className="text-gray-700 font-medium">{description}</p>
    </div>
  );
};

export default RestaurantAbout;
