import React from 'react';
import { Head, Link } from '@inertiajs/react';
import OfflineStatus from '../../Components/OfflineStatus';
import InstallPrompt from '../../Components/InstallPrompt';

interface EstimateListItem {
  id: number;
  reference_number: string;
  customer_name: string;
  created_at: string;
  window_count: number;
  total_amount: string | number;
  has_file: boolean;
}

interface Statistics {
  total_estimates: number;
  estimates_this_month: number;
}

interface DashboardProps {
  recentEstimates: EstimateListItem[];
  statistics: Statistics;
}

export default function Index({ recentEstimates, statistics }: DashboardProps) {
  return (
    <>
      <Head title='Window Estimate System' />

      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* PWA Status and Install Prompt */}
          <OfflineStatus className='mb-6' />
          <InstallPrompt className='mb-6' variant='banner' />

          {/* Header */}
          <div className='text-center mb-12'>
            <h1 className='text-4xl font-bold text-gray-900 mb-4'>
              Window Estimate System
            </h1>
            <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
              Professional window estimation and quotation management system
              optimised for tablet and desktop use.
            </p>
          </div>

          {/* Main Action Cards */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-12'>
            {/* Create New Estimate */}
            <div className='bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow'>
              <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                <svg
                  className='w-8 h-8 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 4v16m8-8H4'
                  />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                Create New Window Estimate
              </h3>
              <p className='text-gray-600 mb-6'>
                Start the wizard to create a new window estimate with customer
                information, window specifications, and generate a professional
                PDF.
              </p>
              <Link
                href={route('estimates.create')}
                className='inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors'
              >
                Start New Estimate
                <svg
                  className='ml-2 w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 5l7 7-7 7'
                  />
                </svg>
              </Link>
            </div>

            {/* Load Existing Estimate */}
            <div className='bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                <svg
                  className='w-8 h-8 text-green-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                Load Existing Estimate
              </h3>
              <p className='text-gray-600 mb-6'>
                View, edit, or download previously created window estimates.
                Access your complete estimate history and manage existing
                quotes.
              </p>
              <Link
                href={route('estimates.index')}
                className='inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors'
              >
                View All Estimates
                <svg
                  className='ml-2 w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 5l7 7-7 7'
                  />
                </svg>
              </Link>
            </div>

            {/* Settings */}
            <div className='bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow'>
              <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                <svg
                  className='w-8 h-8 text-gray-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                Settings
              </h3>
              <p className='text-gray-600 mb-6'>
                Configure company information, window types, pricing, and system
                preferences. Manage your estimation parameters and PDF
                templates.
              </p>
              <Link
                href={route('settings.index')}
                className='inline-flex items-center px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors'
              >
                Open Settings
                <svg
                  className='ml-2 w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 5l7 7-7 7'
                  />
                </svg>
              </Link>
            </div>
          </div>

          {/* Statistics and Recent Estimates */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Statistics */}
            <div className='bg-white rounded-xl shadow-lg p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Quick Stats
              </h3>
              <div className='space-y-4'>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600'>Total Estimates</span>
                  <span className='text-2xl font-bold text-blue-600'>
                    {statistics.total_estimates}
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600'>This Month</span>
                  <span className='text-2xl font-bold text-green-600'>
                    {statistics.estimates_this_month}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Estimates */}
            <div className='lg:col-span-2 bg-white rounded-xl shadow-lg p-6'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Recent Estimates
                </h3>
                <Link
                  href={route('estimates.index')}
                  className='text-blue-600 hover:text-blue-800 text-sm font-medium'
                >
                  View All
                </Link>
              </div>
              {recentEstimates.length > 0 ? (
                <div className='space-y-3'>
                  {recentEstimates.map(estimate => (
                    <div
                      key={estimate.id}
                      className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
                    >
                      <div>
                        <Link
                          href={route('estimates.show', estimate.id)}
                          className='font-medium text-blue-600 hover:text-blue-800'
                        >
                          {estimate.reference_number}
                        </Link>
                        <p className='text-sm text-gray-600'>
                          {estimate.customer_name} • {estimate.window_count}{' '}
                          windows
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-sm text-gray-500'>
                          {estimate.created_at}
                        </p>
                        {estimate.has_file && (
                          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                            PDF Ready
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-500 text-center py-8'>
                  No estimates created yet. Start by creating your first window
                  estimate!
                </p>
              )}
            </div>
          </div>


        </div>
      </div>
    </>
  );
}
