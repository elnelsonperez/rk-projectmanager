import React, { useState, useRef, useEffect } from 'react';

interface ComboboxProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  id: string;
  error?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder,
  id,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update filtered options when input changes
  useEffect(() => {
    if (value.trim() === '') {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option =>
        option.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [value, options]);

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
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle option selection
  const handleSelectOption = (option: string) => {
    onChange(option);
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
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className={`w-full h-[44px] p-2 pr-8 border rounded-md ${error ? 'border-red-500' : ''}`}
          placeholder={placeholder}
          autoComplete="off"
        />
        
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
      </div>
      
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border"
        >
          {filteredOptions.length > 0 ? (
            // Show existing options
            filteredOptions.map((option, index) => (
              <div
                key={index}
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
                onClick={() => handleSelectOption(option)}
              >
                {option}
              </div>
            ))
          ) : value.trim() !== '' ? (
            // Show "add new" option when user is typing something new
            <div
              className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 text-blue-600"
              onClick={() => handleSelectOption(value.trim())}
            >
              Añadir "{value.trim()}"
            </div>
          ) : (
            // Only show this when empty input and no options
            <div className="py-2 px-3 text-gray-500 italic">
              No hay opciones disponibles
            </div>
          )}
        </div>
      )}
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};