
import React from 'react';

const TableStatusLegend = () => {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center">
        <div className="w-4 h-4 rounded-full bg-restaurant-light border border-restaurant-primary mr-2"></div>
        <span className="text-sm">Disponível</span>
      </div>
      
      <div className="flex items-center">
        <div className="w-4 h-4 rounded-full bg-gray-200 border border-gray-300 mr-2"></div>
        <span className="text-sm">Indisponível</span>
      </div>
    </div>
  );
};

export default TableStatusLegend;
