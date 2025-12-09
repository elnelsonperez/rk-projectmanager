import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface CurrencyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  registration: UseFormRegisterReturn;
  label?: string;
  error?: string;
  prefix?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  registration,
  label,
  error,
  prefix = 'RD$',
  ...props
}) => {
  return (
    <div className="relative">
      {label && (
        <label htmlFor={props.id} className="block font-medium mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">
          {prefix}
        </span>
        
        <input
          type="number"
          step="0.01"
          {...props}
          {...registration}
          className={`w-full p-2 pl-10 border rounded-md ${error ? 'border-red-500' : ''}`}
        />
      </div>
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};