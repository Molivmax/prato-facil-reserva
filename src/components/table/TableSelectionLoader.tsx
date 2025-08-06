
import React from 'react';
import { LoaderCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';

const TableSelectionLoader = () => {
  return (
    <>
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 py-12 flex justify-center items-center min-h-[60vh]">
        <LoaderCircle className="h-8 w-8 text-restaurant-primary animate-spin" />
      </div>
    </>
  );
};

export default TableSelectionLoader;
