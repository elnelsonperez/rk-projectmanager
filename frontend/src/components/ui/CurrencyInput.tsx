import React, { useState, useEffect } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface CurrencyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  registration: UseFormRegisterReturn;
  label?: string;
  error?: string;
  prefix?: string;
  onFieldBlur?: (value: number | undefined) => void;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  registration,
  label,
  error,
  prefix = 'RD$',
  onFieldBlur,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState('');
  
  // Format number as currency - using useCallback to prevent infinite effect loops
  const formatAsCurrency = React.useCallback((value: string | number) => {
    if (!value && value !== 0) return '';
    
    // Convert to number and format
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '';
    
    // Format with 2 decimal places and thousands separator
    return numValue.toLocaleString('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);
  
  // Handle input focus
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Extract just the numeric value for editing
    const numericValue = e.target.value.replace(/[^\d.-]/g, '');
    e.target.value = numericValue;
    setDisplayValue(numericValue);
  };
  
  // Handle input blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.trim();
    let numericValue: number | undefined;
    
    // Handle empty input
    if (inputValue === '') {
      setDisplayValue('');
      numericValue = undefined;
      
      // Set form value to undefined for empty input
      if (registration.onChange) {
        const event = { ...e, target: { ...e.target, value: undefined as any } };
        registration.onChange(event as any);
      }
    } else {
      // Convert to formatted currency on blur for non-empty values
      const parsed = parseFloat(inputValue);
      numericValue = !isNaN(parsed) ? parsed : undefined;
      const formattedValue = formatAsCurrency(inputValue);
      setDisplayValue(formattedValue);
    }
    
    // Call the onFieldBlur callback if provided
    if (onFieldBlur) {
      onFieldBlur(numericValue);
    }
    
    // Also trigger the registered blur event
    if (registration.onBlur) {
      registration.onBlur(e);
    }
  };
  
  // Watch for changes in form value via the registration.value
  useEffect(() => {
    // If the registration has a value property (from React Hook Form)
    const formValue = registration.value;
    if (formValue !== undefined && formValue !== null) {
      setDisplayValue(formatAsCurrency(formValue));
    }
  }, [registration.value, formatAsCurrency]);
  
  // Handle initial value and updates
  useEffect(() => {
    if (props.defaultValue !== undefined && props.defaultValue !== null) {
      const value = typeof props.defaultValue === 'string' || typeof props.defaultValue === 'number' 
        ? props.defaultValue 
        : '';
      setDisplayValue(formatAsCurrency(value));
    }
  }, [props.defaultValue, formatAsCurrency]);
  
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
          type="text"
          {...props}
          {...registration}
          className={`w-full p-2 pl-10 border rounded-md ${error ? 'border-red-500' : ''}`}
          value={displayValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={(e) => {
            // Allow only numbers and decimal point
            const value = e.target.value.replace(/[^\d.]/g, '');
            setDisplayValue(value);
            
            // Calculate numeric value for form
            const numValue = value === '' ? undefined : parseFloat(value) || 0;
            
            // Trigger the registered onChange event
            if (registration.onChange) {
              e.target.value = numValue as any;
              registration.onChange(e);
            }
          }}
        />
      </div>
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};