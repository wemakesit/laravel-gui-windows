import { useState, useEffect } from 'react';
import { usePWA } from '../Hooks/usePWA';

interface InstallPromptProps {
  className?: string;
  variant?: 'banner' | 'button' | 'card';
  onInstalled?: () => void;
  onDismissed?: () => void;
}

export default function InstallPrompt({
  className = '',
  variant = 'banner',
  onInstalled,
  onDismissed
}: InstallPromptProps) {
  const { canInstall, isInstalling, installApp, isInstalled, serviceWorkerReady } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  // Show fallback prompt after 3 seconds if no install prompt is available
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!canInstall && !isInstalled && serviceWorkerReady) {
        setShowFallback(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [canInstall, isInstalled, serviceWorkerReady]);

  // Hide prompt if app gets installed
  useEffect(() => {
    if (isInstalled) {
      setDismissed(true);
    }
  }, [isInstalled]);

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed) {
    return null;
  }

  // Don't show if we can't install and fallback isn't ready
  if (!canInstall && !showFallback) {
    return null;
  }

  const handleInstall = async () => {
    if (canInstall) {
      const success = await installApp();
      if (success && onInstalled) {
        onInstalled();
      }
    } else {
      // Fallback: Show manual install instructions
      alert(
        'To install this app:\n\n' +
        '• Chrome: Click the menu (⋮) → "Install Window Estimate System"\n' +
        '• Edge: Click the menu (⋯) → "Apps" → "Install this site as an app"\n' +
        '• Safari: Click Share → "Add to Home Screen"\n' +
        '• Firefox: Click the address bar install icon'
      );
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismissed) {
      onDismissed();
    }
  };

  if (variant === 'button') {
    return (
      <button
        onClick={handleInstall}
        disabled={isInstalling}
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isInstalling ? (
          <>
            <svg
              className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
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
            Installing...
          </>
        ) : (
          <>
            <svg
              className='-ml-1 mr-2 h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
            Install App
          </>
        )}
      </button>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 ${className}`}>
        <div className='flex items-start'>
          <div className='flex-shrink-0'>
            <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
              <svg
                className='w-6 h-6 text-blue-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
            </div>
          </div>
          <div className='ml-4 flex-1'>
            <h3 className='text-lg font-medium text-gray-900'>
              Install Window Estimate System
            </h3>
            <p className='mt-1 text-sm text-gray-600'>
              Install this app on your Surface Pro for faster access and offline functionality. 
              Perfect for field work and on-site estimates.
            </p>
            <div className='mt-4 flex space-x-3'>
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isInstalling ? 'Installing...' : 'Install Now'}
              </button>
              <button
                onClick={handleDismiss}
                className='inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default banner variant
  return (
    <div className={`bg-blue-50 border-l-4 border-blue-400 p-4 ${className}`}>
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          <div className='flex-shrink-0'>
            <svg
              className='h-5 w-5 text-blue-400'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <div className='ml-3'>
            <p className='text-sm text-blue-700'>
              <strong>Install this app</strong> for faster access and offline functionality.
              Perfect for Surface Pro field work.
            </p>
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className='inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isInstalling ? 'Installing...' : 'Install'}
          </button>
          <button
            onClick={handleDismiss}
            className='text-blue-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            <span className='sr-only'>Dismiss</span>
            <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                clipRule='evenodd'
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
