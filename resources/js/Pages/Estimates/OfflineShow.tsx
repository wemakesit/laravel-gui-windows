import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon,
  PrinterIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { offlineEstimateService } from '../../Services/OfflineEstimateService';
import { CompletedEstimate } from '../../types';

interface OfflineShowProps {
  estimateId: string;
}

export default function OfflineShow({ estimateId }: OfflineShowProps) {
  const [estimate, setEstimate] = useState<CompletedEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    loadEstimate();
  }, [estimateId]);

  const loadEstimate = async () => {
    try {
      setLoading(true);
      const loadedEstimate =
        await offlineEstimateService.getEstimateById(estimateId);
      if (!loadedEstimate) {
        showNotification('error', 'Estimate not found');
        return;
      }
      setEstimate(loadedEstimate);
    } catch (error) {
      console.error('Failed to load estimate:', error);
      showNotification('error', 'Failed to load estimate');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (
    type: 'success' | 'error' | 'info',
    message: string
  ) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDelete = async () => {
    if (!estimate) return;

    if (
      !confirm(
        'Are you sure you want to delete this estimate? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await offlineEstimateService.deleteEstimate(estimate.id);
      showNotification('success', 'Estimate deleted successfully');
      // Redirect to estimates list after a short delay
      setTimeout(() => {
        window.location.href = '/estimates';
      }, 2000);
    } catch (error) {
      console.error('Failed to delete estimate:', error);
      showNotification('error', 'Failed to delete estimate');
    }
  };

  const handlePrint = () => {
    window.print();
  };

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
    }).format(new Date(date));
  };

  const getStatusBadge = (status: string, synced: boolean) => {
    if (synced) {
      return (
        <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800'>
          Synced
        </span>
      );
    }

    switch (status) {
      case 'completed':
        return (
          <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800'>
            Completed
          </span>
        );
      case 'draft':
        return (
          <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800'>
            Draft
          </span>
        );
      default:
        return (
          <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800'>
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <>
        <Head title='Estimate Not Found' />
        <div className='min-h-screen flex items-center justify-center'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-gray-900 mb-4'>
              Estimate Not Found
            </h1>
            <p className='text-gray-600 mb-6'>
              The estimate you're looking for doesn't exist or has been deleted.
            </p>
            <Link
              href='/estimates'
              className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              <ArrowLeftIcon className='h-5 w-5 mr-2' />
              Back to Estimates
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head title={`Estimate ${estimate.referenceNumber}`} />

      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-md ${
            notification.type === 'success'
              ? 'bg-green-100 border border-green-400 text-green-700'
              : notification.type === 'error'
                ? 'bg-red-100 border border-red-400 text-red-700'
                : 'bg-blue-100 border border-blue-400 text-blue-700'
          }`}
        >
          <div className='flex items-center'>
            <p>{notification.message}</p>
          </div>
        </div>
      )}

      <div className='py-12'>
        <div className='max-w-4xl mx-auto sm:px-6 lg:px-8'>
          {/* Breadcrumb Navigation */}
          <nav className='flex mb-6' aria-label='Breadcrumb'>
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
                    href='/estimates'
                    className='ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2'
                  >
                    All Estimates
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
                    {estimate?.referenceNumber || 'Estimate Details'}
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Header */}
          <div className='bg-white shadow-sm rounded-lg mb-6'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <div className='flex justify-between items-center'>
                <div className='flex items-center space-x-4'>
                  <Link
                    href='/estimates'
                    className='text-gray-500 hover:text-gray-700'
                    title='Back to All Estimates'
                  >
                    <ArrowLeftIcon className='h-6 w-6' />
                  </Link>
                  <div>
                    <h1 className='text-2xl font-bold text-gray-900'>
                      {estimate.referenceNumber}
                    </h1>
                    <p className='text-sm text-gray-500'>
                      Created: {formatDate(estimate.createdAt)}
                    </p>
                  </div>
                </div>
                <div className='flex items-center space-x-3'>
                  {getStatusBadge(estimate.status, estimate.synced)}
                  <div className='flex space-x-2'>
                    <Link
                      href='/'
                      className='inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'
                    >
                      <HomeIcon className='h-4 w-4 mr-2' />
                      Dashboard
                    </Link>
                    <button
                      onClick={handlePrint}
                      className='inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'
                    >
                      <PrinterIcon className='h-4 w-4 mr-2' />
                      Print
                    </button>
                    <button
                      onClick={handleDelete}
                      className='inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50'
                    >
                      <TrashIcon className='h-4 w-4 mr-2' />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Estimate Summary */}
            <div className='px-6 py-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div>
                  <h3 className='text-sm font-medium text-gray-500'>
                    Customer
                  </h3>
                  <p className='mt-1 text-sm text-gray-900'>
                    {estimate.customerDetails.title}{' '}
                    {estimate.customerDetails.first_name}{' '}
                    {estimate.customerDetails.last_name}
                  </p>
                  <p className='text-sm text-gray-500'>
                    {estimate.customerDetails.email}
                  </p>
                  <p className='text-sm text-gray-500'>
                    {estimate.customerDetails.phone}
                  </p>
                </div>
                <div>
                  <h3 className='text-sm font-medium text-gray-500'>Windows</h3>
                  <p className='mt-1 text-sm text-gray-900'>
                    {estimate.metadata.windowCount} windows (
                    {estimate.metadata.totalItems} total items)
                  </p>
                </div>
                <div>
                  <h3 className='text-sm font-medium text-gray-500'>
                    Total Amount
                  </h3>
                  <p className='mt-1 text-2xl font-bold text-gray-900'>
                    {formatCurrency(estimate.breakdown.total)}
                  </p>
                  <p className='text-sm text-gray-500'>
                    Inc. VAT ({(estimate.breakdown.vatRate * 100).toFixed(0)}%)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className='bg-white shadow-sm rounded-lg mb-6'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <h2 className='text-lg font-medium text-gray-900'>
                Customer Details
              </h2>
            </div>
            <div className='px-6 py-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <h3 className='text-sm font-medium text-gray-500'>
                    Contact Information
                  </h3>
                  <div className='mt-2 space-y-1'>
                    <p className='text-sm text-gray-900'>
                      {estimate.customerDetails.title}{' '}
                      {estimate.customerDetails.first_name}{' '}
                      {estimate.customerDetails.last_name}
                    </p>
                    <p className='text-sm text-gray-900'>
                      {estimate.customerDetails.email}
                    </p>
                    <p className='text-sm text-gray-900'>
                      {estimate.customerDetails.phone}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className='text-sm font-medium text-gray-500'>Address</h3>
                  <div className='mt-2'>
                    <p className='text-sm text-gray-900 whitespace-pre-line'>
                      {estimate.customerDetails.address}
                    </p>
                  </div>
                </div>
              </div>
              {estimate.customerDetails.additional_info && (
                <div className='mt-6'>
                  <h3 className='text-sm font-medium text-gray-500'>
                    Additional Information
                  </h3>
                  <p className='mt-2 text-sm text-gray-900 whitespace-pre-line'>
                    {estimate.customerDetails.additional_info}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Windows Details */}
          <div className='bg-white shadow-sm rounded-lg mb-6'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <h2 className='text-lg font-medium text-gray-900'>
                Windows & Configuration
              </h2>
            </div>
            <div className='px-6 py-4'>
              <div className='space-y-6'>
                {estimate.windows.map((window, index) => (
                  <div
                    key={window.id}
                    className='border border-gray-200 rounded-lg p-4'
                  >
                    <div className='flex justify-between items-start mb-4'>
                      <div>
                        <h4 className='text-base font-medium text-gray-900'>
                          {window.room}
                        </h4>
                        <p className='text-sm text-gray-600'>{window.type}</p>
                        <p className='text-sm text-gray-500'>
                          Quantity: {window.quantity} | Options:{' '}
                          {window.options.join(', ')}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-lg font-medium text-gray-900'>
                          {formatCurrency(window.lineTotal)}
                        </p>
                      </div>
                    </div>

                    {/* Pricing Breakdown */}
                    <div className='bg-gray-50 rounded-md p-3'>
                      <div className='space-y-2 text-sm'>
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Base Price:</span>
                          <span className='text-gray-900'>
                            {formatCurrency(window.basePrice)} ×{' '}
                            {window.quantity} ={' '}
                            {formatCurrency(window.basePrice * window.quantity)}
                          </span>
                        </div>

                        {window.extras.length > 0 && (
                          <div>
                            <div className='flex justify-between font-medium'>
                              <span className='text-gray-600'>Extras:</span>
                              <span className='text-gray-900'>
                                {formatCurrency(
                                  window.extrasTotal * window.quantity
                                )}
                              </span>
                            </div>
                            {window.extras.map((extra, extraIndex) => (
                              <div
                                key={extraIndex}
                                className='flex justify-between ml-4 text-gray-500'
                              >
                                <span>• {extra.name}</span>
                                <span>
                                  {formatCurrency(extra.cost)} ×{' '}
                                  {window.quantity}
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
                                  {formatCurrency(finish.cost)} ×{' '}
                                  {window.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className='bg-white shadow-sm rounded-lg'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <h2 className='text-lg font-medium text-gray-900'>
                Pricing Summary
              </h2>
            </div>
            <div className='px-6 py-4'>
              <div className='space-y-3'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Subtotal:</span>
                  <span className='text-gray-900'>
                    {formatCurrency(estimate.breakdown.subtotal)}
                  </span>
                </div>

                {estimate.breakdown.discountAmount && (
                  <div className='flex justify-between text-red-600'>
                    <span>
                      Discount ({estimate.breakdown.discountPercent}%):
                    </span>
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

                <div className='flex justify-between text-xl font-bold border-t border-gray-200 pt-3'>
                  <span className='text-gray-900'>Total:</span>
                  <span className='text-gray-900'>
                    {formatCurrency(estimate.breakdown.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sync Status - Only show if not synced and user is online */}
          {!estimate.synced && navigator.onLine && (
            <div className='mt-6 bg-blue-50 border border-blue-200 rounded-md p-4'>
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
                      This estimate is ready to be synced to the server. PDF
                      generation will be available after syncing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
