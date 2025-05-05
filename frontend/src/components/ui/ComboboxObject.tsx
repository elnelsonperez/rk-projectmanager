import React, { useState, useRef, useEffect } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

export interface ComboboxOption {
  value: number | string;
  label: string;
  description?: string;
}

interface ComboboxObjectProps {
  options: ComboboxOption[];
  registration?: UseFormRegisterReturn;
  label?: string;
  placeholder?: string;
  id: string;
  error?: string;
  defaultValue?: number | string;
  onSelect?: (value: number | string) => void;
  disabled?: boolean;
  emptyOption?: string;
}

export const ComboboxObject: React.FC<ComboboxObjectProps> = ({
  options,
  registration,
  label,
  placeholder,
  id,
  error,
  defaultValue,
  onSelect,
  disabled = false,
  emptyOption = "Sin selección"
}) => {
  // Find default label from value
  const getDefaultLabel = () => {
    if (defaultValue === undefined || defaultValue === null) return '';
    const option = options.find(opt => opt.value === defaultValue);
    return option ? option.label : '';
  };

  const [inputValue, setInputValue] = useState(getDefaultLabel());
  const [selectedValue, setSelectedValue] = useState<number | string | undefined>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<ComboboxOption[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update filtered options when input changes
  useEffect(() => {
    if (inputValue.trim() === '') {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option => 
        option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
        (option.description && option.description.toLowerCase().includes(inputValue.toLowerCase()))
      );
      setFilteredOptions(filtered);
    }
  }, [inputValue, options]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        
        // If user clicked outside and there's a selected value, reset the input to the selected label
        if (selectedValue !== undefined) {
          const selectedOption = options.find(opt => opt.value === selectedValue);
          if (selectedOption) {
            setInputValue(selectedOption.label);
          }
        } else if (inputValue.trim() !== '') {
          // Reset input if no selection was made but user typed something
          setInputValue('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [options, selectedValue, inputValue]);

  // Update options when options change
  useEffect(() => {
    if (defaultValue !== undefined) {
      const option = options.find(opt => opt.value === defaultValue);
      if (option) {
        setInputValue(option.label);
        setSelectedValue(option.value);
      }
    }
  }, [options, defaultValue]);

  // Handle option selection
  const handleSelectOption = (option: ComboboxOption | null) => {
    if (option) {
      setInputValue(option.label);
      setSelectedValue(option.value);
      
      // Call onSelect callback if provided
      if (onSelect) {
        onSelect(option.value);
      }
      
      // Manually trigger onChange for react-hook-form if registration is provided
      if (inputRef.current && registration) {
        const event = new Event('input', { bubbles: true });
        Object.defineProperty(event, 'target', {
          writable: false,
          value: { value: option.value, name: inputRef.current.name }
        });
        
        inputRef.current.value = String(option.value);
        registration.onChange(event as any);
      }
    } else {
      // Handle "clear" selection
      setInputValue('');
      setSelectedValue(undefined);
      
      if (onSelect) {
        onSelect('');
      }
      
      // Clear the form value if registration is provided
      if (inputRef.current && registration) {
        const event = new Event('input', { bubbles: true });
        Object.defineProperty(event, 'target', {
          writable: false,
          value: { value: '', name: inputRef.current.name }
        });
        
        inputRef.current.value = '';
        registration.onChange(event as any);
      }
    }
    
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {label && (
        <label htmlFor={id} className="block font-medium mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          id={id}
          type="text"
          {...(registration || {})}
          ref={(e) => {
            // Connect both the local ref and the form ref
            inputRef.current = e;
            if (registration && typeof registration.ref === 'function') {
              registration.ref(e);
            }
          }}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            // Don't clear selection immediately when typing
            if (e.target.value === '') {
              setSelectedValue(undefined);
              if (onSelect) onSelect('');
            }
            if (registration) registration.onChange(e);
          }}
          onFocus={() => !disabled && setIsOpen(true)}
          className={`w-full h-[44px] p-2 pr-8 border rounded-md ${error ? 'border-red-500' : ''} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          placeholder={placeholder}
          autoComplete="off"
          disabled={disabled}
        />
        
        {!disabled && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
      
      {isOpen && !disabled && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border"
        >
          {/* Empty option */}
          <div
            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
            onClick={() => handleSelectOption(null)}
          >
            <span className="text-gray-500">{emptyOption}</span>
          </div>
          
          {filteredOptions.length > 0 ? (
            // Show filtered options
            filteredOptions.map((option, index) => (
              <div
                key={index}
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
                onClick={() => handleSelectOption(option)}
              >
                <div className="font-medium">{option.label}</div>
                {option.description && (
                  <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                )}
              </div>
            ))
          ) : (
            // No matching options
            <div className="py-2 px-3 text-gray-500 italic">
              No se encontraron resultados
            </div>
          )}
        </div>
      )}
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};