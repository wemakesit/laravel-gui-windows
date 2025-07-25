import React, { useState, useEffect, useRef } from 'react';
import { CustomerInfoStepProps } from '@/types/wizard';

interface CustomerInfo {
  title?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  additional_info?: string;
  [key: string]: any;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  [key: string]: string | undefined;
}

export default function CustomerInfoStep({
  customerInfo,
  updateCustomerInfo,
  validateStep,
}: CustomerInfoStepProps) {
  const [formData, setFormData] = useState<CustomerInfo>(customerInfo);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isValid, setIsValid] = useState(false);


  // Use ref to track previous validation state to prevent unnecessary updates
  const prevValidRef = useRef(false);

  // Use ref to track if initial validation has run
  const initialValidationDoneRef = useRef(false);

  // Add a ref to track if an update is coming from the parent
  const isParentUpdateRef = useRef(false);

  // Function to validate form data - defined outside useEffect to avoid duplication
  const validateFormData = () => {
    const newErrors: FormErrors = {};

    // Required fields validation
    if (!formData.first_name?.trim())
      newErrors.first_name = 'First name is required';
    if (!formData.last_name?.trim())
      newErrors.last_name = 'Last name is required';
    if (!formData.email?.trim()) newErrors.email = 'Email is required';
    if (!formData.phone?.trim()) newErrors.phone = 'Phone is required';
    if (!formData.address?.trim()) newErrors.address = 'Address is required';

    // Email validation
    if (
      formData.email?.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (basic)
    if (
      formData.phone?.trim() &&
      !/^[0-9+\s()-]{10,15}$/.test(formData.phone)
    ) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    return newErrors;
  };

  // Run initial validation when component mounts
  useEffect(() => {
    console.log(
      'CustomerInfoStep: Initial mount with customerInfo',
      customerInfo
    );

    // Validate the form data
    const newErrors = validateFormData();
    setErrors(newErrors);

    // Check if the form is valid
    const valid = Object.keys(newErrors).length === 0;
    setIsValid(valid);

    // Set initial validation state
    if (validateStep) {
      validateStep(1, valid);
      prevValidRef.current = valid;
    }

    // Mark initial validation as done
    initialValidationDoneRef.current = true;
  }, []); // Empty dependency array means this runs once on mount

  // Validate form data when fields change
  useEffect(() => {
    // Skip validation if initial validation hasn't run yet
    if (!initialValidationDoneRef.current) {
      return;
    }

    // Validate the form data
    const newErrors = validateFormData();
    setErrors(newErrors);

    // Check if the form is valid
    const valid = Object.keys(newErrors).length === 0;
    setIsValid(valid);

    // Only update parent component if validation status has changed
    if (validateStep && valid !== prevValidRef.current) {
      // Force immediate save of customer data when validation changes
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateCustomerInfo(formData);

      validateStep(1, valid);
      // Update the ref with current validation state
      prevValidRef.current = valid;
    }
  }, [
    formData.first_name,
    formData.last_name,
    formData.email,
    formData.phone,
    formData.address,
    // Remove updateCustomerInfo from dependencies to avoid infinite loops
  ]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Immediately update local state to prevent disappearing text
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);

    // Skip parent update if this is a parent-initiated update
    if (isParentUpdateRef.current) {
      isParentUpdateRef.current = false;
      return;
    }

    // Debounce parent updates to prevent excessive calls
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      updateCustomerInfo(updatedData);
    }, 300); // 300ms debounce
  };

  // Add timeout ref for debouncing
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Store latest formData in a ref to avoid stale closure
  const latestFormDataRef = useRef(formData);
  latestFormDataRef.current = formData;

  // Cleanup timeout on unmount and ensure final update
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        // Ensure final update is sent immediately on unmount
        updateCustomerInfo(latestFormDataRef.current);
      }
    };
  }, []); // Empty dependency array to avoid infinite loops





  // Update local state when customerInfo changes (e.g., when a saved quotation is loaded)
  // Only update if customerInfo has meaningful data and is different from current formData
  useEffect(() => {
    if (customerInfo && Object.keys(customerInfo).length > 0) {
      // Create a normalized copy of customerInfo
      const normalizedCustomerInfo = {
        title: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        additional_info: '',
        ...customerInfo,
      };

      // Only update if there's a significant difference (not just empty vs undefined)
      const hasSignificantData = Object.values(normalizedCustomerInfo).some(
        value => value && value.toString().trim().length > 0
      );

      // Check if current formData is empty or significantly different
      const currentHasData = Object.values(formData).some(
        value => value && value.toString().trim().length > 0
      );

      // Only update if customerInfo has data and current form is empty, or if it's a load operation
      if (
        hasSignificantData &&
        (!currentHasData ||
          JSON.stringify(customerInfo) !== JSON.stringify(formData))
      ) {
        console.log('CustomerInfoStep: Loading customer data from parent');
        isParentUpdateRef.current = true;
        setFormData(normalizedCustomerInfo);
      }
    }
  }, [customerInfo]); // Remove formData dependency to prevent loops







  return (
    <div className='space-y-6'>
      <h2 className='text-xl font-semibold'>Customer Information</h2>
      <p className='text-gray-600'>
        Please enter the customer's details for the quotation.
      </p>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <label
            htmlFor='title'
            className='block text-sm font-medium text-gray-700'
          >
            Title
          </label>
          <select
            id='title'
            name='title'
            value={formData.title || ''} // Ensure title is defaulted to empty string
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              console.log('Title changed to:', e.target.value);
              handleChange(e);
            }}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
          >
            <option value=''>Select a title</option>
            <option value='Mr'>Mr</option>
            <option value='Mrs'>Mrs</option>
            <option value='Miss'>Miss</option>
            <option value='Ms'>Ms</option>
            <option value='Dr'>Dr</option>
          </select>
        </div>

        <div>
          <label
            htmlFor='first_name'
            className='block text-sm font-medium text-gray-700'
          >
            First Name <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            id='first_name'
            name='first_name'
            value={formData.first_name || ''}
            onChange={handleChange}
            required
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.first_name ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.first_name && (
            <p className='mt-1 text-sm text-red-600'>{errors.first_name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor='last_name'
            className='block text-sm font-medium text-gray-700'
          >
            Last Name <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            id='last_name'
            name='last_name'
            value={formData.last_name || ''}
            onChange={handleChange}
            required
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.last_name ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.last_name && (
            <p className='mt-1 text-sm text-red-600'>{errors.last_name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor='email'
            className='block text-sm font-medium text-gray-700'
          >
            Email <span className='text-red-500'>*</span>
          </label>
          <input
            type='email'
            id='email'
            name='email'
            value={formData.email || ''}
            onChange={handleChange}
            required
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.email && (
            <p className='mt-1 text-sm text-red-600'>{errors.email}</p>
          )}
        </div>

        <div>
          <label
            htmlFor='phone'
            className='block text-sm font-medium text-gray-700'
          >
            Phone <span className='text-red-500'>*</span>
          </label>
          <input
            type='tel'
            id='phone'
            name='phone'
            value={formData.phone || ''}
            onChange={handleChange}
            required
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.phone ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.phone && (
            <p className='mt-1 text-sm text-red-600'>{errors.phone}</p>
          )}
        </div>

        <div className='md:col-span-2'>
          <label
            htmlFor='address'
            className='block text-sm font-medium text-gray-700'
          >
            Address <span className='text-red-500'>*</span>
          </label>

          <div className='mt-2'>
            <textarea
              id='address'
              name='address'
              value={formData.address || ''}
              onChange={handleChange}
              required
              rows={3}
              placeholder='Enter full address including postcode'
              className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.address ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.address && (
              <p className='mt-1 text-sm text-red-600'>{errors.address}</p>
            )}
          </div>
        </div>

        <div className='md:col-span-2'>
          <label
            htmlFor='additional_info'
            className='block text-sm font-medium text-gray-700'
          >
            Additional Information
          </label>
          <textarea
            id='additional_info'
            name='additional_info'
            value={formData.additional_info || ''}
            onChange={handleChange}
            rows={3}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
          />
        </div>
      </div>

      {!isValid && (
        <div className='bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4'>
          <div className='flex'>
            <div className='flex-shrink-0'>
              <svg
                className='h-5 w-5 text-yellow-400'
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
            <div className='ml-3'>
              <p className='text-sm text-yellow-700'>
                Please fill in all required fields marked with an asterisk (*)
                to proceed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
