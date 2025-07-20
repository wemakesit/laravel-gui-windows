/**
 * Touch Interaction Hook
 * Provides touch-optimised interactions for Surface Pro tablets
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface TouchCapabilities {
  hasTouch: boolean;
  maxTouchPoints: number;
  isTablet: boolean;
  isSurfacePro: boolean;
  orientation: 'portrait' | 'landscape';
  screenSize: {
    width: number;
    height: number;
  };
}

export interface TouchGesture {
  type: 'tap' | 'double-tap' | 'long-press' | 'swipe' | 'pinch' | 'pan';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  distance: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export interface SwipeGesture {
  direction: 'up' | 'down' | 'left' | 'right';
  distance: number;
  velocity: number;
  duration: number;
}

export function useTouch() {
  const [capabilities, setCapabilities] = useState<TouchCapabilities>({
    hasTouch: false,
    maxTouchPoints: 0,
    isTablet: false,
    isSurfacePro: false,
    orientation: 'portrait',
    screenSize: { width: 0, height: 0 }
  });

  const [isVirtualKeyboardOpen, setIsVirtualKeyboardOpen] = useState(false);
  const initialViewportHeight = useRef<number>(0);

  // Detect touch capabilities
  useEffect(() => {
    const detectCapabilities = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const maxTouchPoints = navigator.maxTouchPoints || 0;
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Detect if it's likely a tablet
      const isTablet = hasTouch && (
        maxTouchPoints > 1 ||
        /tablet|ipad|android(?!.*mobile)/i.test(userAgent) ||
        (window.innerWidth >= 768 && window.innerWidth <= 1366)
      );

      // Detect Surface Pro specifically
      const isSurfacePro = /surface/i.test(userAgent) || 
        (window.innerWidth === 1366 && window.innerHeight === 768) ||
        (window.innerWidth === 1920 && window.innerHeight === 1080);

      const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';

      setCapabilities({
        hasTouch,
        maxTouchPoints,
        isTablet,
        isSurfacePro,
        orientation,
        screenSize: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      });
    };

    detectCapabilities();
    initialViewportHeight.current = window.innerHeight;

    // Listen for orientation and resize changes
    const handleResize = () => {
      detectCapabilities();
      
      // Detect virtual keyboard
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight.current - currentHeight;
      const isKeyboardOpen = heightDifference > 150; // Threshold for keyboard detection
      
      setIsVirtualKeyboardOpen(isKeyboardOpen);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  /**
   * Create touch-optimised event handlers
   */
  const createTouchHandlers = useCallback((
    onTap?: (event: TouchEvent) => void,
    onDoubleTap?: (event: TouchEvent) => void,
    onLongPress?: (event: TouchEvent) => void,
    onSwipe?: (gesture: SwipeGesture) => void
  ) => {
    let touchStart: { x: number; y: number; time: number } | null = null;
    let touchTimeout: NodeJS.Timeout | null = null;
    let lastTap = 0;

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      touchStart = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };

      // Set up long press detection
      if (onLongPress) {
        touchTimeout = setTimeout(() => {
          if (touchStart) {
            onLongPress(event);
            touchStart = null;
          }
        }, 500); // 500ms for long press
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (touchTimeout) {
        clearTimeout(touchTimeout);
        touchTimeout = null;
      }

      if (!touchStart) return;

      const touch = event.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      const duration = Date.now() - touchStart.time;
      const distance = Math.sqrt(
        Math.pow(endX - touchStart.x, 2) + Math.pow(endY - touchStart.y, 2)
      );

      // Check for swipe gesture
      if (distance > 50 && duration < 300 && onSwipe) {
        const deltaX = endX - touchStart.x;
        const deltaY = endY - touchStart.y;
        const velocity = distance / duration;

        let direction: 'up' | 'down' | 'left' | 'right';
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }

        onSwipe({
          direction,
          distance,
          velocity,
          duration
        });
      }
      // Check for tap gesture
      else if (distance < 10 && duration < 300) {
        const now = Date.now();
        const timeSinceLastTap = now - lastTap;

        if (timeSinceLastTap < 300 && onDoubleTap) {
          // Double tap
          onDoubleTap(event);
          lastTap = 0; // Reset to prevent triple tap
        } else if (onTap) {
          // Single tap
          setTimeout(() => {
            if (Date.now() - lastTap > 300) {
              onTap(event);
            }
          }, 300);
        }

        lastTap = now;
      }

      touchStart = null;
    };

    const handleTouchCancel = () => {
      if (touchTimeout) {
        clearTimeout(touchTimeout);
        touchTimeout = null;
      }
      touchStart = null;
    };

    return {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel
    };
  }, []);

  /**
   * Create swipe handlers for navigation
   */
  const createSwipeHandlers = useCallback((
    onSwipeLeft?: () => void,
    onSwipeRight?: () => void,
    onSwipeUp?: () => void,
    onSwipeDown?: () => void
  ) => {
    return createTouchHandlers(
      undefined,
      undefined,
      undefined,
      (gesture) => {
        switch (gesture.direction) {
          case 'left':
            onSwipeLeft?.();
            break;
          case 'right':
            onSwipeRight?.();
            break;
          case 'up':
            onSwipeUp?.();
            break;
          case 'down':
            onSwipeDown?.();
            break;
        }
      }
    );
  }, [createTouchHandlers]);

  /**
   * Get touch-optimised class names
   */
  const getTouchClasses = useCallback((baseClasses: string = '') => {
    const touchClasses = [];

    if (capabilities.hasTouch) {
      touchClasses.push('touch-target');
    }

    if (capabilities.isTablet) {
      touchClasses.push('tablet-optimised');
    }

    if (capabilities.isSurfacePro) {
      touchClasses.push('surface-pro-touch');
    }

    if (capabilities.orientation === 'landscape') {
      touchClasses.push('landscape-touch');
    } else {
      touchClasses.push('portrait-touch');
    }

    return `${baseClasses} ${touchClasses.join(' ')}`.trim();
  }, [capabilities]);

  /**
   * Handle virtual keyboard adjustments
   */
  const handleVirtualKeyboard = useCallback((inputElement: HTMLElement) => {
    if (!capabilities.hasTouch || !isVirtualKeyboardOpen) return;

    // Scroll input into view when virtual keyboard opens
    setTimeout(() => {
      inputElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 300);
  }, [capabilities.hasTouch, isVirtualKeyboardOpen]);

  /**
   * Prevent zoom on double tap for specific elements
   */
  const preventZoom = useCallback((event: TouchEvent) => {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  }, []);

  /**
   * Add haptic feedback (if supported)
   */
  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  return {
    capabilities,
    isVirtualKeyboardOpen,
    createTouchHandlers,
    createSwipeHandlers,
    getTouchClasses,
    handleVirtualKeyboard,
    preventZoom,
    hapticFeedback
  };
}
