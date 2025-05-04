import { cn } from "../../lib/utils";
import * as React from "react";

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-100" 
               onClick={() => onOpenChange?.(false)} />
          {children}
        </div>
      )}
    </>
  );
}

interface SheetContentProps {
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export function SheetContent({ side = "right", className, children, onClose }: SheetContentProps) {
  const sideClasses = {
    top: "animate-in slide-in-from-top duration-300 w-full h-auto border-b",
    bottom: "animate-in slide-in-from-bottom duration-300 w-full h-auto border-t",
    left: "animate-in slide-in-from-left duration-300 h-full border-r",
    right: "animate-in slide-in-from-right duration-300 h-full border-l",
  };
  
  return (
    <div
      className={cn(
        "fixed z-50 bg-background p-6 shadow-lg",
        sideClasses[side],
        className
      )}
    >
      {children}
      <button
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent"
        onClick={onClose}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        <span className="sr-only">Close</span>
      </button>
    </div>
  );
}