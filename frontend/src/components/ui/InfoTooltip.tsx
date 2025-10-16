import { useState } from 'react';

interface InfoTooltipProps {
  text: string;
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground hover:text-background transition-colors text-xs font-bold"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={(e) => {
          e.preventDefault();
          setIsVisible(!isVisible);
        }}
      >
        ?
      </button>
      {isVisible && (
        <div className="absolute z-50 w-64 p-2 text-xs bg-popover text-popover-foreground border border-border rounded-md shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-1">
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-border"></div>
          {text}
        </div>
      )}
    </div>
  );
}
