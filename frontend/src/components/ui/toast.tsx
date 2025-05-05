import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

export interface ToastProps {
  message: string;
  type?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

export function Toast({ 
  message, 
  type = 'default', 
  duration = 3000, 
  onClose 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) setTimeout(onClose, 300); // Allow animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 max-w-md p-3 rounded-md shadow-md transition-all duration-300 flex items-center gap-2 z-50",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        {
          "bg-white text-foreground border": type === 'default',
          "bg-green-100 text-green-800 border-green-200": type === 'success',
          "bg-red-100 text-red-800 border-red-200": type === 'error',
          "bg-yellow-100 text-yellow-800 border-yellow-200": type === 'warning',
          "bg-blue-100 text-blue-800 border-blue-200": type === 'info',
        }
      )}
    >
      <div className="flex-1 text-sm">{message}</div>
      <button
        onClick={() => {
          setIsVisible(false);
          if (onClose) setTimeout(onClose, 300);
        }}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export type ToastOptions = Omit<ToastProps, 'onClose'>;

type ToastInstance = {
  id: string;
  props: ToastProps;
};

let toasts: ToastInstance[] = [];
let toastListeners: (() => void)[] = [];

function notifyToastListeners() {
  toastListeners.forEach(listener => listener());
}

export function toast(options: ToastOptions) {
  const id = Math.random().toString(36).substr(2, 9);
  
  const handleClose = () => {
    toasts = toasts.filter(t => t.id !== id);
    notifyToastListeners();
  };
  
  const toastInstance: ToastInstance = {
    id,
    props: {
      ...options,
      onClose: handleClose,
    },
  };
  
  toasts.push(toastInstance);
  notifyToastListeners();
  
  return id;
}

export function useToasts() {
  const [, setForceUpdate] = useState({});
  
  useEffect(() => {
    const listener = () => setForceUpdate({});
    toastListeners.push(listener);
    
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);
  
  return { toasts };
}

export function ToastContainer() {
  const { toasts } = useToasts();
  
  const toastContainer = (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast.props} />
      ))}
    </div>
  );
  
  return typeof document !== 'undefined' 
    ? createPortal(toastContainer, document.body) 
    : null;
}