
import React from 'react';
import { Input } from '@/components/ui/input';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onChange, className, ...props }) => {
  const formatCurrency = (value: string) => {
    // Remove non-digit characters
    let number = value.replace(/\D/g, '');
    
    // Convert to number and divide by 100 to get decimal places
    const amount = parseFloat(number) / 100;
    
    // Format as Brazilian currency
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    onChange(rawValue ? rawValue : '0');
  };

  return (
    <Input
      {...props}
      value={formatCurrency(value)}
      onChange={handleChange}
      className={className}
    />
  );
};

export default CurrencyInput;
