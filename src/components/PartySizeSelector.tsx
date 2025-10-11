import { Users } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface PartySizeSelectorProps {
  partySize: number;
  onPartySizeChange: (size: number) => void;
}

const PartySizeSelector = ({ partySize, onPartySizeChange }: PartySizeSelectorProps) => {
  const sizes = [1, 2, 3, 4, 5, 6, 8, 10];

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
        <Users className="h-5 w-5" />
        Quantas pessoas vão?
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Isso nos ajuda a preparar a mesa ideal para você
      </p>
      <div className="grid grid-cols-4 gap-3">
        {sizes.map((size) => (
          <Button
            key={size}
            variant={partySize === size ? "default" : "outline"}
            className={`h-16 ${
              partySize === size 
                ? "bg-restaurant-primary hover:bg-restaurant-dark" 
                : "hover:border-restaurant-primary"
            }`}
            onClick={() => onPartySizeChange(size)}
          >
            <div className="flex flex-col items-center">
              <Users className="h-5 w-5 mb-1" />
              <span className="font-semibold">{size}</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default PartySizeSelector;
