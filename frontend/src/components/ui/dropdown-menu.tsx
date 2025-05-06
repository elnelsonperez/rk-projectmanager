import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { MoreVertical } from 'lucide-react';

export interface DropdownMenuItem {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  icon?: React.ReactNode;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  className?: string;
  align?: 'left' | 'right';
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  items,
  className,
  align = 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = (onClick: () => void) => {
    onClick();
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        className="flex items-center justify-center p-1 rounded-md text-muted-foreground hover:bg-muted"
        onClick={handleToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      
      {isOpen && (
        <div 
          ref={menuRef}
          className={cn(
            "absolute z-50 mt-1 bg-background shadow-lg rounded-md py-1 text-sm overflow-hidden border border-border min-w-[160px]",
            align === 'right' ? "right-0" : "left-0"
          )}
        >
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              className={cn(
                "w-full text-left flex items-center px-3 py-2 hover:bg-muted",
                item.variant === 'destructive' && "text-destructive hover:bg-destructive/10"
              )}
              onClick={() => handleItemClick(item.onClick)}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};