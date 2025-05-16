
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Menu } from 'lucide-react';

const EmptyProductsList = () => {
  return (
    <Card className="bg-gray-900 border-dashed border-gray-700">
      <CardContent className="text-center p-8">
        <div className="mb-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
            <Menu className="h-6 w-6 text-gray-400" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-white">Nenhum item no cardápio</h3>
        <p className="text-gray-400 mt-1 mb-3">
          Este estabelecimento ainda não cadastrou itens no cardápio.
        </p>
      </CardContent>
    </Card>
  );
};

export default EmptyProductsList;
