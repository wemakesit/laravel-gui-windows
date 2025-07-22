import { ButtonHTMLAttributes, forwardRef } from 'react';
import { useTouch } from '../Hooks/useTouch';

interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  hapticFeedback?: boolean;
  rippleEffect?: boolean;
  children: React.ReactNode;
}

const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      hapticFeedback = true,
      rippleEffect = true,
      className = '',
      children,
      onClick,
      disabled,
      ...props
    },
    ref
  ) => {
    const {
      capabilities,
      getTouchClasses,
      hapticFeedback: triggerHaptic,
    } = useTouch();

    const baseClasses =
      'btn-touch focus-visible-touch transition-all duration-200 font-medium rounded-lg border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500',
      secondary:
        'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 focus:ring-gray-500',
      danger:
        'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500',
      success:
        'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus:ring-green-500',
      warning:
        'bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-700 focus:ring-yellow-500',
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm min-h-[36px] min-w-[36px]',
      md: 'px-4 py-3 text-base min-h-[44px] min-w-[44px]',
      lg: 'px-6 py-4 text-lg min-h-[52px] min-w-[52px]',
      xl: 'px-8 py-5 text-xl min-h-[60px] min-w-[60px]',
    };

    const touchClasses = getTouchClasses();
    const widthClass = fullWidth ? 'w-full' : '';
    const rippleClass = rippleEffect ? 'touch-ripple' : '';

    const buttonClasses = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      touchClasses,
      widthClass,
      rippleClass,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;

      // Trigger haptic feedback on touch devices
      if (capabilities.hasTouch && hapticFeedback) {
        triggerHaptic('light');
      }

      // Call the original onClick handler
      onClick?.(event);
    };

    return (
      <button
        ref={ref}
        className={buttonClasses}
        onClick={handleClick}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <div className='flex items-center justify-center'>
            <svg
              className='animate-spin -ml-1 mr-3 h-5 w-5 text-current'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              />
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              />
            </svg>
            Loading...
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
);

TouchButton.displayName = 'TouchButton';

export default TouchButton;
