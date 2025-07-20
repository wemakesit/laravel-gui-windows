import React from 'react';
import {
  CheckCircleIcon,
  DocumentTextIcon,
  EyeIcon,
  PlusIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import { CompletedEstimate } from '../../../types';

interface EstimateCompletionProps {
  estimate: CompletedEstimate;
  onCreateNew: () => void;
  onViewAllEstimates: () => void;
  onViewEstimate?: (id: string) => void;
}

export default function EstimateCompletion({
  estimate,
  onCreateNew,
  onViewAllEstimates,
  onViewEstimate,
}: EstimateCompletionProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-8'>
      {/* Breadcrumb Navigation */}
      <nav className='flex' aria-label='Breadcrumb'>
        <ol className='inline-flex items-center space-x-1 md:space-x-3'>
          <li className='inline-flex items-center'>
            <Link
              href='/'
              className='inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600'
            >
              <HomeIcon className='w-4 h-4 mr-2' />
              Dashboard
            </Link>
          </li>
          <li>
            <div className='flex items-center'>
              <svg
                className='w-6 h-6 text-gray-400'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
                  clipRule='evenodd'
                />
              </svg>
              <Link
                href='/estimates/create'
                className='ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2'
              >
                Create Estimate
              </Link>
            </div>
          </li>
          <li aria-current='page'>
            <div className='flex items-center'>
              <svg
                className='w-6 h-6 text-gray-400'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
                  clipRule='evenodd'
                />
              </svg>
              <span className='ml-1 text-sm font-medium text-gray-500 md:ml-2'>
                Estimate Complete
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Success Header */}
      <div className='text-center'>
        <CheckCircleIcon className='mx-auto h-16 w-16 text-green-500' />
        <h1 className='mt-4 text-3xl font-bold text-gray-900'>
          Estimate Created Successfully
        </h1>
        <p className='mt-2 text-lg text-gray-600'>
          Your estimate has been saved and is ready for review
        </p>
      </div>

      {/* Estimate Summary Card */}
      <div className='bg-white shadow-lg rounded-lg overflow-hidden'>
        <div className='bg-blue-50 px-6 py-4 border-b border-blue-200'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-xl font-semibold text-blue-900'>
                {estimate.referenceNumber}
              </h2>
              <p className='text-sm text-blue-700'>
                Created: {formatDate(estimate.createdAt)}
              </p>
            </div>
            <div className='text-right'>
              <p className='text-2xl font-bold text-blue-900'>
                {formatCurrency(estimate.breakdown.total)}
              </p>
              <p className='text-sm text-blue-700'>
                Inc. VAT ({(estimate.breakdown.vatRate * 100).toFixed(0)}%)
              </p>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className='px-6 py-4 border-b border-gray-200'>
          <h3 className='text-lg font-medium text-gray-900 mb-3'>
            Customer Details
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <p className='text-sm font-medium text-gray-700'>Name</p>
              <p className='text-sm text-gray-900'>
                {estimate.customerDetails.title}{' '}
                {estimate.customerDetails.first_name}{' '}
                {estimate.customerDetails.last_name}
              </p>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-700'>Email</p>
              <p className='text-sm text-gray-900'>
                {estimate.customerDetails.email}
              </p>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-700'>Phone</p>
              <p className='text-sm text-gray-900'>
                {estimate.customerDetails.phone}
              </p>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-700'>Address</p>
              <p className='text-sm text-gray-900'>
                {estimate.customerDetails.address}
              </p>
            </div>
          </div>
          {estimate.customerDetails.additional_info && (
            <div className='mt-4'>
              <p className='text-sm font-medium text-gray-700'>
                Additional Information
              </p>
              <p className='text-sm text-gray-900'>
                {estimate.customerDetails.additional_info}
              </p>
            </div>
          )}
        </div>

        {/* Windows Breakdown */}
        <div className='px-6 py-4 border-b border-gray-200'>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>
            Windows & Configuration
          </h3>
          <div className='space-y-4'>
            {estimate.windows.map((window, index) => (
              <div key={window.id} className='bg-gray-50 rounded-lg p-4'>
                <div className='flex justify-between items-start mb-3'>
                  <div>
                    <h4 className='font-medium text-gray-900'>{window.room}</h4>
                    <p className='text-sm text-gray-600'>{window.type}</p>
                    <p className='text-sm text-gray-500'>
                      Quantity: {window.quantity}
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='font-medium text-gray-900'>
                      {formatCurrency(window.lineTotal)}
                    </p>
                    <p className='text-sm text-gray-500'>
                      Options: {window.options.join(', ')}
                    </p>
                  </div>
                </div>

                {/* Window Pricing Breakdown */}
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Base Price:</span>
                    <span className='text-gray-900'>
                      {formatCurrency(window.basePrice)} × {window.quantity}
                    </span>
                  </div>

                  {window.extras.length > 0 && (
                    <div>
                      <div className='flex justify-between font-medium'>
                        <span className='text-gray-600'>Extras:</span>
                        <span className='text-gray-900'>
                          {formatCurrency(window.extrasTotal * window.quantity)}
                        </span>
                      </div>
                      {window.extras.map((extra, extraIndex) => (
                        <div
                          key={extraIndex}
                          className='flex justify-between ml-4 text-gray-500'
                        >
                          <span>• {extra.name}</span>
                          <span>
                            {formatCurrency(extra.cost)} × {window.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {window.finishes.length > 0 && (
                    <div>
                      <div className='flex justify-between font-medium'>
                        <span className='text-gray-600'>Finishes:</span>
                        <span className='text-gray-900'>
                          {formatCurrency(
                            window.finishesTotal * window.quantity
                          )}
                        </span>
                      </div>
                      {window.finishes.map((finish, finishIndex) => (
                        <div
                          key={finishIndex}
                          className='flex justify-between ml-4 text-gray-500'
                        >
                          <span>• {finish.name}</span>
                          <span>
                            {formatCurrency(finish.cost)} × {window.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className='px-6 py-4 border-b border-gray-200'>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>
            Pricing Summary
          </h3>
          <div className='space-y-3'>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Subtotal:</span>
              <span className='text-gray-900'>
                {formatCurrency(estimate.breakdown.subtotal)}
              </span>
            </div>

            {estimate.breakdown.discountAmount && (
              <div className='flex justify-between text-red-600'>
                <span>Discount ({estimate.breakdown.discountPercent}%):</span>
                <span>
                  -{formatCurrency(estimate.breakdown.discountAmount)}
                </span>
              </div>
            )}

            <div className='flex justify-between'>
              <span className='text-gray-600'>
                VAT ({(estimate.breakdown.vatRate * 100).toFixed(0)}%):
              </span>
              <span className='text-gray-900'>
                {formatCurrency(estimate.breakdown.vat)}
              </span>
            </div>

            <div className='flex justify-between text-lg font-semibold border-t border-gray-200 pt-3'>
              <span className='text-gray-900'>Total:</span>
              <span className='text-gray-900'>
                {formatCurrency(estimate.breakdown.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Estimate Metadata */}
        <div className='px-6 py-4 bg-gray-50'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
            <div>
              <p className='font-medium text-gray-700'>Windows</p>
              <p className='text-gray-900'>{estimate.metadata.windowCount}</p>
            </div>
            <div>
              <p className='font-medium text-gray-700'>Total Items</p>
              <p className='text-gray-900'>{estimate.metadata.totalItems}</p>
            </div>
            <div>
              <p className='font-medium text-gray-700'>Status</p>
              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                {estimate.status === 'completed'
                  ? 'Completed'
                  : estimate.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex flex-col sm:flex-row gap-4 justify-center'>
        <button
          onClick={onCreateNew}
          className='inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
        >
          <PlusIcon className='h-5 w-5 mr-2' />
          Create New Estimate
        </button>

        <button
          onClick={onViewAllEstimates}
          className='inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
        >
          <DocumentTextIcon className='h-5 w-5 mr-2' />
          View All Estimates
        </button>

        {onViewEstimate && (
          <button
            onClick={() => onViewEstimate(estimate.id)}
            className='inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
          >
            <EyeIcon className='h-5 w-5 mr-2' />
            View This Estimate
          </button>
        )}

        <Link
          href='/'
          className='inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
        >
          <HomeIcon className='h-5 w-5 mr-2' />
          Back to Dashboard
        </Link>
      </div>

      {/* Sync Status - Only show if not synced and user is online */}
      {!estimate.synced && navigator.onLine && (
        <div className='bg-blue-50 border border-blue-200 rounded-md p-4'>
          <div className='flex'>
            <div className='flex-shrink-0'>
              <svg
                className='h-5 w-5 text-blue-400'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-blue-800'>
                Ready to Sync
              </h3>
              <div className='mt-2 text-sm text-blue-700'>
                <p>
                  This estimate is ready to be synced to the server when you're
                  online.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
