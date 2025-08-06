
import { useState } from 'react';
import { Users } from 'lucide-react';

interface TableItemProps {
  id: string;
  number: number;
  seats: number;
  available: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
}

const TableItem = ({
  id,
  number,
  seats,
  available,
  selected,
  onSelect
}: TableItemProps) => {
  let tableClass = "table-item";
  
  if (selected) {
    tableClass += " table-selected";
  } else if (available) {
    tableClass += " table-available";
  } else {
    tableClass += " table-unavailable";
  }

  const handleClick = () => {
    if (available && !selected) {
      onSelect(id);
    }
  };

  return (
    <div 
      className={tableClass}
      onClick={handleClick}
    >
      <div className="text-center">
        <div className="font-bold">{number}</div>
        <div className="flex items-center justify-center text-xs">
          <Users className="h-3 w-3 mr-1" />
          <span>{seats}</span>
        </div>
      </div>
    </div>
  );
};

export default TableItem;
