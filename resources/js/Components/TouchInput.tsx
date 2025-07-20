import { InputHTMLAttributes, forwardRef, useRef, useEffect } from 'react';
import { useTouch } from '../Hooks/useTouch';

interface TouchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  autoFocusOnKeyboard?: boolean;
}

const TouchInput = forwardRef<HTMLInputElement, TouchInputProps>(({
  label,
  error,
  helpText,
  icon,
  fullWidth = false,
  autoFocusOnKeyboard = true,
  className = '',
  onFocus,
  ...props
}, ref) => {
  const { capabilities, getTouchClasses, handleVirtualKeyboard, isVirtualKeyboardOpen } = useTouch();
  const inputRef = useRef<HTMLInputElement>(null);
  const combinedRef = ref || inputRef;

  // Handle virtual keyboard adjustments
  useEffect(() => {
    if (autoFocusOnKeyboard && isVirtualKeyboardOpen && inputRef.current) {
      handleVirtualKeyboard(inputRef.current);
    }
  }, [isVirtualKeyboardOpen, autoFocusOnKeyboard, handleVirtualKeyboard]);

  const baseClasses = 'input-touch focus-visible-touch transition-all duration-200 border-2 rounded-lg bg-white';
  const touchClasses = getTouchClasses();
  const widthClass = fullWidth ? 'w-full' : '';
  const errorClasses = error 
    ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200';
  
  const inputClasses = [
    baseClasses,
    touchClasses,
    widthClass,
    errorClasses,
    icon ? 'pl-12' : 'px-4',
    'py-3 text-lg',
    className
  ].filter(Boolean).join(' ');

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    // Handle virtual keyboard on touch devices
    if (capabilities.hasTouch && autoFocusOnKeyboard) {
      setTimeout(() => {
        handleVirtualKeyboard(event.target);
      }, 100);
    }

    onFocus?.(event);
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''} space-y-2`}>
      {label && (
        <label 
          htmlFor={props.id}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-6 w-6 text-gray-400">
              {icon}
            </div>
          </div>
        )}
        
        <input
          ref={combinedRef}
          className={inputClasses}
          onFocus={handleFocus}
          {...props}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600 mt-1 flex items-center">
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="text-sm text-gray-500 mt-1">
          {helpText}
        </p>
      )}
    </div>
  );
});

TouchInput.displayName = 'TouchInput';

export default TouchInput;
