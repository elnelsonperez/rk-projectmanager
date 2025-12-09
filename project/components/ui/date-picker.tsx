import React from 'react';

interface DatePickerProps {
  id: string;
  label?: string;
  placeholder?: string;
  value?: Date;
  onChange: (date: Date | undefined) => void;
  disabled?: boolean;
  error?: string;
}

export function DatePicker({
  id,
  label,
  placeholder = 'Select date...',
  value,
  onChange,
  disabled = false,
  error
}: DatePickerProps) {

  // Format date for input, converting to YYYY-MM-DD
  const formatDateForInput = (date?: Date): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  // Handle date change, converting string to Date
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (!value) {
      onChange(undefined);
    } else {
      onChange(new Date(value));
    }
  };

  // Handle clearing the date
  const handleClear = () => {
    onChange(undefined);
  };

  return (
    <div className="flex flex-col space-y-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="date"
          id={id}
          value={formatDateForInput(value)}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full p-2 border rounded-md ${error ? 'border-red-500' : 'border-input'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear date"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18"></path>
              <path d="M6 6l12 12"></path>
            </svg>
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}