
import React from 'react';

interface ExtendedTable {
  id: string;
  number: number;
  seats: number;
  status: 'available' | 'unavailable';
}

interface TableGridProps {
  tables: ExtendedTable[];
  selectedTable: string | null;
  onTableSelect: (tableId: string) => void;
}

const TableGrid = ({ tables, selectedTable, onTableSelect }: TableGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {tables.map((table) => (
        <div 
          key={table.id}
          className={`table-item ${
            table.status === 'available' 
              ? selectedTable === table.id 
                ? 'table-selected' 
                : 'table-available' 
              : 'table-unavailable'
          }`}
          onClick={() => table.status === 'available' ? onTableSelect(table.id) : null}
        >
          <div className="text-center">
            <div className="text-xl font-bold">Mesa {table.number}</div>
            <div className="text-sm">{table.seats} lugares</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TableGrid;
