import React from 'react';
import { Head, Link } from '@inertiajs/react';

interface EstimateShowProps {
  estimate: {
    id: number;
    reference_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_address: string;
    additional_info?: string;
    window_count: number;
    total_amount: number;
    created_at: string;
    has_file: boolean;
    estimate_data?: any;
  };
}

export default function Show({ estimate }: EstimateShowProps) {
  return (
    <>
      <Head title={`Window Estimate ${estimate.reference_number}`} />

      <div className='py-12'>
        <div className='max-w-4xl mx-auto sm:px-6 lg:px-8'>
          <div className='bg-white overflow-hidden shadow-sm sm:rounded-lg'>
            <div className='p-6 text-gray-900'>
              {/* Header */}
              <div className='flex justify-between items-start mb-8'>
                <div>
                  <h1 className='text-3xl font-bold text-gray-900'>
                    {estimate.reference_number}
                  </h1>
                  <p className='text-gray-600 mt-1'>
                    Window Estimate Details
                  </p>
                </div>
                <div className='flex space-x-2'>
                  <Link
                    href={route('estimates.index')}
                    className='px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors'
                  >
                    ← Back to Estimates
                  </Link>
                  <Link
                    href={route('estimates.load', estimate.id)}
                    className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
                  >
                    Edit Estimate
                  </Link>
                  {estimate.has_file && (
                    <Link
                      href={route('estimates.download', estimate.id)}
                      className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors'
                    >
                      Download PDF
                    </Link>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className='mb-6'>
                {estimate.has_file ? (
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800'>
                    <svg
                      className='w-4 h-4 mr-2'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                        clipRule='evenodd'
                      />
                    </svg>
                    PDF Generated
                  </span>
                ) : (
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800'>
                    <svg
                      className='w-4 h-4 mr-2 animate-spin'
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
                    Processing
                  </span>
                )}
              </div>

              {/* Estimate Details Grid */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                {/* Customer Information */}
                <div className='bg-gray-50 rounded-lg p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    Customer Information
                  </h3>
                  <div className='space-y-3'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Name
                      </label>
                      <p className='mt-1 text-sm text-gray-900'>
                        {estimate.customer_name}
                      </p>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Email
                      </label>
                      <p className='mt-1 text-sm text-gray-900'>
                        {estimate.customer_email}
                      </p>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Phone
                      </label>
                      <p className='mt-1 text-sm text-gray-900'>
                        {estimate.customer_phone}
                      </p>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Address
                      </label>
                      <p className='mt-1 text-sm text-gray-900 whitespace-pre-line'>
                        {estimate.customer_address}
                      </p>
                    </div>
                    {estimate.additional_info && (
                      <div>
                        <label className='block text-sm font-medium text-gray-700'>
                          Additional Information
                        </label>
                        <p className='mt-1 text-sm text-gray-900 whitespace-pre-line'>
                          {estimate.additional_info}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Estimate Summary */}
                <div className='bg-gray-50 rounded-lg p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    Estimate Summary
                  </h3>
                  <div className='space-y-3'>
                    <div className='flex justify-between'>
                      <span className='text-sm font-medium text-gray-700'>
                        Reference Number
                      </span>
                      <span className='text-sm text-gray-900'>
                        {estimate.reference_number}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-sm font-medium text-gray-700'>
                        Created Date
                      </span>
                      <span className='text-sm text-gray-900'>
                        {estimate.created_at}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-sm font-medium text-gray-700'>
                        Number of Windows
                      </span>
                      <span className='text-sm text-gray-900'>
                        {estimate.window_count}
                      </span>
                    </div>
                    <div className='border-t pt-3'>
                      <div className='flex justify-between'>
                        <span className='text-base font-semibold text-gray-900'>
                          Total Amount
                        </span>
                        <span className='text-base font-semibold text-gray-900'>
                          £{estimate.total_amount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Window Details */}
              {estimate.estimate_data?.windows && (
                <div className='mt-8'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    Window Details
                  </h3>
                  <div className='bg-gray-50 rounded-lg p-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                      {estimate.estimate_data.windows.map(
                        (window: any, index: number) => (
                          <div
                            key={index}
                            className='bg-white rounded-lg p-4 border'
                          >
                            <h4 className='font-medium text-gray-900 mb-2'>
                              Window {index + 1}
                            </h4>
                            <div className='text-sm text-gray-600 space-y-1'>
                              {window.room && (
                                <p>
                                  <span className='font-medium'>Room:</span>{' '}
                                  {window.room}
                                </p>
                              )}
                              {window.type && (
                                <p>
                                  <span className='font-medium'>Type:</span>{' '}
                                  {window.type}
                                </p>
                              )}
                              {window.width && window.height && (
                                <p>
                                  <span className='font-medium'>Size:</span>{' '}
                                  {window.width} × {window.height}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className='mt-8 flex justify-center space-x-4'>
                <Link
                  href={route('estimates.load', estimate.id)}
                  className='px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors'
                >
                  Edit This Estimate
                </Link>
                {estimate.has_file && (
                  <Link
                    href={route('estimates.download', estimate.id)}
                    className='px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors'
                  >
                    Download PDF
                  </Link>
                )}
                <Link
                  href={route('estimates.create')}
                  className='px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors'
                >
                  Create New Estimate
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
