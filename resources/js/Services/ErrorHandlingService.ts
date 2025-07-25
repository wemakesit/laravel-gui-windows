/**
 * Error Handling Service
 * Provides consistent error handling and user-friendly error messages
 */

// Custom error types
export class WatermelonDBError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'WatermelonDBError';
  }
}

export class SyncError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = true,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'SyncError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public status?: number,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Error codes
export const ERROR_CODES = {
  // Database errors
  DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
  DB_QUERY_FAILED: 'DB_QUERY_FAILED',
  DB_WRITE_FAILED: 'DB_WRITE_FAILED',
  DB_RECORD_NOT_FOUND: 'DB_RECORD_NOT_FOUND',
  DB_CONSTRAINT_VIOLATION: 'DB_CONSTRAINT_VIOLATION',

  // Sync errors
  SYNC_FAILED: 'SYNC_FAILED',
  SYNC_CONFLICT: 'SYNC_CONFLICT',
  SYNC_TIMEOUT: 'SYNC_TIMEOUT',
  SYNC_UNAUTHORIZED: 'SYNC_UNAUTHORIZED',

  // Network errors
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_SERVER_ERROR: 'NETWORK_SERVER_ERROR',
  NETWORK_UNAUTHORIZED: 'NETWORK_UNAUTHORIZED',

  // Validation errors
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_RANGE: 'VALIDATION_OUT_OF_RANGE',

  // Business logic errors
  ESTIMATE_CREATION_FAILED: 'ESTIMATE_CREATION_FAILED',
  CUSTOMER_CREATION_FAILED: 'CUSTOMER_CREATION_FAILED',
  WINDOW_CREATION_FAILED: 'WINDOW_CREATION_FAILED',
} as const;

export class ErrorHandlingService {
  /**
   * Convert generic errors to specific error types
   */
  static categorizeError(error: any, context?: string): Error {
    if (error instanceof WatermelonDBError || 
        error instanceof SyncError || 
        error instanceof ValidationError || 
        error instanceof NetworkError) {
      return error;
    }

    // Network-related errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new NetworkError(
        'Network connection failed. Please check your internet connection.',
        0,
        true
      );
    }

    // HTTP errors
    if (error.status) {
      const status = parseInt(error.status);
      if (status >= 400 && status < 500) {
        return new NetworkError(
          status === 401 ? 'Authentication required' : 
          status === 403 ? 'Access denied' :
          status === 404 ? 'Resource not found' :
          'Client error occurred',
          status,
          false
        );
      } else if (status >= 500) {
        return new NetworkError(
          'Server error occurred. Please try again later.',
          status,
          true
        );
      }
    }

    // Database-related errors
    if (error.message?.includes('database') || 
        error.message?.includes('IndexedDB') ||
        error.message?.includes('LokiJS')) {
      return new WatermelonDBError(
        'Database operation failed. Please try again.',
        ERROR_CODES.DB_QUERY_FAILED,
        error
      );
    }

    // Sync-related errors
    if (context?.includes('sync') || error.message?.includes('sync')) {
      return new SyncError(
        'Synchronisation failed. Will retry automatically.',
        ERROR_CODES.SYNC_FAILED,
        true,
        error
      );
    }

    // Default to generic error
    return new Error(error.message || 'An unexpected error occurred');
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: Error): string {
    if (error instanceof NetworkError) {
      if (!navigator.onLine) {
        return 'You appear to be offline. Some features may not be available.';
      }
      return error.message;
    }

    if (error instanceof SyncError) {
      return error.retryable 
        ? 'Synchronisation failed but will retry automatically.'
        : 'Synchronisation failed. Please check your connection and try again.';
    }

    if (error instanceof ValidationError) {
      return `${error.field}: ${error.message}`;
    }

    if (error instanceof WatermelonDBError) {
      switch (error.code) {
        case ERROR_CODES.DB_RECORD_NOT_FOUND:
          return 'The requested item could not be found.';
        case ERROR_CODES.DB_WRITE_FAILED:
          return 'Failed to save data. Please try again.';
        default:
          return 'A database error occurred. Please try again.';
      }
    }

    // Default message
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Log error with context
   */
  static logError(error: Error, context?: string, additionalData?: any): void {
    const errorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      online: navigator.onLine,
      ...additionalData,
    };

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.error('Error occurred:', errorInfo);
    }

    // In production, you might want to send to error tracking service
    // Example: Sentry, LogRocket, etc.
  }

  /**
   * Handle error with user notification
   */
  static handleError(
    error: any, 
    context?: string, 
    showToUser: boolean = true,
    additionalData?: any
  ): Error {
    const categorizedError = this.categorizeError(error, context);
    
    // Log the error
    this.logError(categorizedError, context, additionalData);

    // Show user-friendly message if requested
    if (showToUser) {
      const userMessage = this.getUserMessage(categorizedError);
      
      // You can integrate with your notification system here
      // For now, we'll use a simple alert (replace with your toast/notification system)
      if (typeof window !== 'undefined' && window.alert) {
        // Only show alert for critical errors, not warnings
        if (categorizedError instanceof NetworkError && !categorizedError.retryable) {
          window.alert(userMessage);
        }
      }
    }

    return categorizedError;
  }

  /**
   * Retry wrapper for operations that might fail
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    context?: string
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.categorizeError(error, context);
        
        // Don't retry non-retryable errors
        if (lastError instanceof NetworkError && !lastError.retryable) {
          throw lastError;
        }
        
        if (lastError instanceof SyncError && !lastError.retryable) {
          throw lastError;
        }

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    throw lastError!;
  }

  /**
   * Validate required fields
   */
  static validateRequired(data: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        throw new ValidationError(
          'This field is required',
          field,
          data[field]
        );
      }
    }
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError(
        'Please enter a valid email address',
        'email',
        email
      );
    }
  }

  /**
   * Validate phone number format (UK)
   */
  static validatePhoneUK(phone: string): void {
    const phoneRegex = /^(\+44|0)[1-9]\d{8,9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      throw new ValidationError(
        'Please enter a valid UK phone number',
        'phone',
        phone
      );
    }
  }

  /**
   * Validate postcode format (UK)
   */
  static validatePostcodeUK(postcode: string): void {
    const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
    if (!postcodeRegex.test(postcode.trim())) {
      throw new ValidationError(
        'Please enter a valid UK postcode',
        'postcode',
        postcode
      );
    }
  }
}

export default ErrorHandlingService;
