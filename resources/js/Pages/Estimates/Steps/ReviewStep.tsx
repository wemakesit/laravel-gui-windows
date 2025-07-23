import React, { useState, useEffect } from 'react';
import { ReviewStepProps } from '@/types/wizard';

export default function ReviewStep({
  formData,
  windowTypes,
  extras,
  finishes,
  companyInfo,
  pdfTextConfig,
  options,
  updateFormData,
  submitEstimate,
  validateStep,
}: ReviewStepProps) {
  // Safety checks for required data
  if (!formData) {
    return (
      <div className='p-6 text-center'>
        <p className='text-gray-500'>Loading review data...</p>
      </div>
    );
  }

  // Ensure required data structures exist
  const safeFormData = {
    customer_details: formData.customerInfo || {},
    windows: formData.windows || [],
    selected_caveats: formData.selectedCaveats || {},
    ...formData,
  };

  const [selectedCaveats, setSelectedCaveats] = useState(
    safeFormData.selected_caveats || {}
  );

  // Validation effect - review step is valid if we have customer info and windows
  useEffect(() => {
    if (validateStep) {
      const hasCustomerInfo =
        formData.customerInfo &&
        formData.customerInfo.first_name &&
        formData.customerInfo.last_name &&
        formData.customerInfo.email;
      const hasWindows = formData.windows && formData.windows.length > 0;
      const isValid = hasCustomerInfo && hasWindows;
      validateStep(5, isValid);
    }
  }, [formData, validateStep]);

  const handleCaveatToggle = (caveat: string) => {
    const newSelectedCaveats: Record<string, boolean> = { ...selectedCaveats };

    if (newSelectedCaveats[caveat]) {
      newSelectedCaveats[caveat] = false;
    } else {
      newSelectedCaveats[caveat] = true;
    }

    setSelectedCaveats(newSelectedCaveats);
    updateFormData('selected_caveats', newSelectedCaveats);
  };

  const calculateWindowTotal = window => {
    const basePrice = window.cost || 0;
    const extrasTotal =
      window.extras?.reduce((total, extra) => total + (extra.cost || 0), 0) || 0;
    return (basePrice + extrasTotal) * (window.quantity || 1);
  };

  const calculateSubtotal = () => {
    return safeFormData.windows.reduce(
      (total, window) => total + calculateWindowTotal(window),
      0
    );
  };

  const calculateVAT = () => {
    const vatRate = pdfTextConfig?.formats?.vat_rate || 0.2;
    return calculateSubtotal() * vatRate;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateVAT();
  };

  const defaultCaveats = [
    'This quotation is valid for 30 days from the date of issue',
    'A 50% deposit is required to confirm your order',
    'The balance is due on completion of installation',
    'All measurements are subject to survey',
    'Delivery times may vary depending on material availability',
  ];

  return (
    <div className='space-y-8'>
      <h2 className='text-xl font-semibold'>Review Your Quotation</h2>
      <p className='text-gray-600'>
        Please review your quotation details before generating the PDF.
      </p>

      <div className='bg-gray-50 p-6 rounded-lg'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Customer Information
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <p className='text-sm font-medium text-gray-500'>Name</p>
            <p className='text-base text-gray-900'>
              {safeFormData.customer_details.title
                ? `${safeFormData.customer_details.title} `
                : ''}
              {safeFormData.customer_details.first_name}{' '}
              {safeFormData.customer_details.last_name}
            </p>
          </div>
          <div>
            <p className='text-sm font-medium text-gray-500'>Email</p>
            <p className='text-base text-gray-900'>
              {safeFormData.customer_details.email || 'Not provided'}
            </p>
          </div>
          <div>
            <p className='text-sm font-medium text-gray-500'>Phone</p>
            <p className='text-base text-gray-900'>
              {safeFormData.customer_details.phone || 'Not provided'}
            </p>
          </div>
          <div className='md:col-span-2'>
            <p className='text-sm font-medium text-gray-500'>Address</p>
            <p className='text-base text-gray-900'>
              {safeFormData.customer_details.address || 'Not provided'}
            </p>
          </div>
          {safeFormData.customer_details.additional_info && (
            <div className='md:col-span-2'>
              <p className='text-sm font-medium text-gray-500'>
                Additional Information
              </p>
              <p className='text-base text-gray-900'>
                {safeFormData.customer_details.additional_info}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className='bg-gray-50 p-6 rounded-lg'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>Windows</h3>

        {safeFormData.windows.length > 0 ? (
          <div className='space-y-6'>
            {safeFormData.windows.map((window, index) => (
              <div
                key={index}
                className='border border-gray-200 rounded-md p-4'
              >
                <div className='flex justify-between items-start'>
                  <div>
                    <h4 className='text-base font-medium text-gray-900'>
                      {window.room}
                    </h4>
                    <p className='text-sm text-gray-600'>{window.type}</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm text-gray-500'>
                      Quantity: {window.quantity}
                    </p>
                    <p className='text-base font-medium text-gray-900'>
                      £{calculateWindowTotal(window).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className='mt-4 grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div>
                    <p className='text-xs font-medium text-gray-500'>
                      Glass Specification
                    </p>
                    <p className='text-sm text-gray-900'>
                      {window.glass_specification || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs font-medium text-gray-500'>
                      Paint Finish
                    </p>
                    <p className='text-sm text-gray-900'>
                      {window.paint_finish || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs font-medium text-gray-500'>
                      Hardware Finish
                    </p>
                    <p className='text-sm text-gray-900'>
                      {window.hardware_finish || 'Not specified'}
                    </p>
                  </div>
                </div>

                {window.extras && window.extras.length > 0 && (
                  <div className='mt-4'>
                    <p className='text-xs font-medium text-gray-500'>Extras</p>
                    <ul className='mt-1 space-y-1'>
                      {window.extras.map((extra, extraIndex) => (
                        <li
                          key={extraIndex}
                          className='text-sm flex justify-between'
                        >
                          <span className='text-gray-600'>{extra.name}</span>
                          <span className='text-gray-900'>
                            £{(extra.cost || 0).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {window.options && (
                  <div className='mt-4'>
                    <p className='text-xs font-medium text-gray-500'>Options</p>
                    <p className='text-sm text-gray-600'>
                      {Array.isArray(window.options)
                        ? window.options
                            .map(optionId => {
                              const option = options?.options?.find(
                                o => o.id === optionId
                              );
                              return option
                                ? option.name
                                : `Option ${optionId}`;
                            })
                            .join(', ')
                        : (() => {
                            const option = options?.options?.find(
                              o => o.id === window.options
                            );
                            return option
                              ? option.name
                              : `Option ${window.options}`;
                          })()}
                    </p>
                  </div>
                )}

                {window.additional_info && (
                  <div className='mt-4'>
                    <p className='text-xs font-medium text-gray-500'>
                      Additional Information
                    </p>
                    <p className='text-sm text-gray-600'>
                      {window.additional_info}
                    </p>
                  </div>
                )}
              </div>
            ))}

            <div className='mt-6 border-t border-gray-200 pt-4'>
              <div className='flex justify-between text-sm'>
                <span className='font-medium text-gray-700'>Subtotal:</span>
                <span className='text-gray-900'>
                  £{calculateSubtotal().toFixed(2)}
                </span>
              </div>
              <div className='flex justify-between text-sm mt-2'>
                <span className='font-medium text-gray-700'>
                  VAT ({(pdfTextConfig?.formats?.vat_rate || 0.2) * 100}%):
                </span>
                <span className='text-gray-900'>
                  £{calculateVAT().toFixed(2)}
                </span>
              </div>
              <div className='flex justify-between text-base font-medium mt-2'>
                <span className='text-gray-900'>Total:</span>
                <span className='text-gray-900'>
                  £{calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className='text-gray-500'>No windows added to this quotation.</p>
        )}
      </div>

      <div className='bg-gray-50 p-6 rounded-lg'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>Caveats</h3>
        <p className='text-sm text-gray-600 mb-4'>
          Select the caveats to include in your quotation:
        </p>

        <div className='space-y-3'>
          {defaultCaveats.map((caveat, index) => (
            <div key={index} className='flex items-start'>
              <input
                id={`caveat-${index}`}
                name={`caveat-${index}`}
                type='checkbox'
                checked={!!selectedCaveats[caveat]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleCaveatToggle(caveat)
                }
                className='h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <label
                htmlFor={`caveat-${index}`}
                className='ml-3 text-sm text-gray-700'
              >
                {caveat}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className='bg-gray-50 p-6 rounded-lg'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Company Information
        </h3>

        {companyInfo ? (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <p className='text-sm font-medium text-gray-500'>Company Name</p>
              <p className='text-base text-gray-900'>
                {companyInfo.name || 'Not specified'}
              </p>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500'>Address</p>
              <p className='text-base text-gray-900'>
                {companyInfo.address?.line1 ||
                  companyInfo.address ||
                  'Not specified'}
                {companyInfo.address?.line2 && `, ${companyInfo.address.line2}`}
              </p>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500'>Contact</p>
              <p className='text-base text-gray-900'>
                {companyInfo.contact?.phone || companyInfo.phone || 'No phone'}{' '}
                |{' '}
                {companyInfo.contact?.email || companyInfo.email || 'No email'}
              </p>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500'>Registration</p>
              <p className='text-base text-gray-900'>
                Company No:{' '}
                {companyInfo.registration?.company_number ||
                  companyInfo.company_number ||
                  'Not specified'}{' '}
                | VAT No:{' '}
                {companyInfo.registration?.vat_number ||
                  companyInfo.vat_number ||
                  'Not specified'}
              </p>
            </div>
          </div>
        ) : (
          <p className='text-gray-500'>Using default company information.</p>
        )}
      </div>
    </div>
  );
}
