
import React from 'react';
import TableStatusLegend from './TableStatusLegend';

interface TableSelectionHeaderProps {
  restaurantName: string;
}

const TableSelectionHeader = ({ restaurantName }: TableSelectionHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">{restaurantName}</h1>
        <p className="text-gray-600">Selecione uma mesa disponível</p>
      </div>
      
      <div className="mt-4 md:mt-0">
        <TableStatusLegend />
      </div>
    </div>
  );
};

export default TableSelectionHeader;
