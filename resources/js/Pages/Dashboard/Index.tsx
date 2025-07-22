import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { watermelonDBService } from '@/Services/WatermelonDBService';

interface Estimate {
  _id: string;
  reference_number: string;
  customer_name: string;
  created_at: string;
  window_count: number;
  total_amount: number;
  has_file: boolean;
}

interface Statistics {
  total_estimates: number;
  estimates_this_month: number;
}

interface Props {
  recentEstimates?: Estimate[];
  statistics?: Statistics;
  useOfflineMode?: boolean;
}

export default function Dashboard({
  recentEstimates: serverEstimates = [],
  statistics: serverStatistics = { total_estimates: 0, estimates_this_month: 0 },
  useOfflineMode = false,
}: Props) {
  const [recentEstimates, setRecentEstimates] = useState<Estimate[]>(serverEstimates);
  const [statistics, setStatistics] = useState<Statistics>(serverStatistics);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Load data from WatermelonDB (offline-first approach)
  useEffect(() => {
    loadDashboardData();

    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Loading dashboard data from WatermelonDB...');
      const estimates = await watermelonDBService.getAllEstimates();

      // Map WatermelonDB data to dashboard format
      const estimateList = await Promise.all(
        estimates.map(async (estimate) => {
          // Get related data using WatermelonDB relations
          const customer = await watermelonDBService.getCustomer(estimate.customerId);
          const windows = await watermelonDBService.getWindowsByEstimate(estimate.id);

          return {
            _id: estimate.id,
            reference_number: estimate.referenceNumber,
            customer_name: customer?.name || 'Unknown Customer',
            created_at: estimate.createdAt.toLocaleDateString('en-GB'),
            window_count: windows.length,
            total_amount: estimate.finalAmount || 0,
            has_file: estimate.hasPdf,
          };
        })
      );

      // Get recent estimates (last 5)
      const recentEstimatesList = estimateList
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 5);

      // Calculate statistics
      const totalEstimates = estimateList.length;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const estimatesThisMonth = estimates.filter(estimate => {
        const docDate = estimate.createdAt;
        return (
          docDate.getMonth() === currentMonth &&
          docDate.getFullYear() === currentYear
        );
      }).length;

      setRecentEstimates(recentEstimatesList);
      setStatistics({
        total_estimates: totalEstimates,
        estimates_this_month: estimatesThisMonth,
      });

      console.log('Dashboard data loaded:', {
        totalEstimates,
        estimatesThisMonth,
        recentCount: recentEstimatesList.length,
      });
    } catch (error) {
      console.error('Error loading dashboard data from WatermelonDB:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthenticatedLayout
      header={
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold leading-tight text-gray-800'>
            Dashboard
          </h2>
          {isOffline && (
            <div className='flex items-center space-x-2 rounded-md bg-yellow-100 px-3 py-1 text-sm text-yellow-800'>
              <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                <path fillRule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
              </svg>
              <span>Offline Mode</span>
            </div>
          )}
        </div>
      }
    >
      <Head title='Dashboard' />

      <div className='py-12'>
        <div className='mx-auto max-w-7xl sm:px-6 lg:px-8'>
          {/* Statistics Cards */}
          <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            <div className='overflow-hidden bg-white shadow-sm sm:rounded-lg'>
              <div className='p-6'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 text-white'>
                      <svg
                        className='h-5 w-5'
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
                  </div>
                  <div className='ml-5 w-0 flex-1'>
                    <dl>
                      <dt className='truncate text-sm font-medium text-gray-500'>
                        Total Estimates
                      </dt>
                      <dd className='text-lg font-medium text-gray-900'>
                        {loading ? (
                          <div className='animate-pulse bg-gray-200 h-6 w-8 rounded'></div>
                        ) : (
                          statistics.total_estimates
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className='overflow-hidden bg-white shadow-sm sm:rounded-lg'>
              <div className='p-6'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-md bg-green-500 text-white'>
                      <svg
                        className='h-5 w-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M8 7V3a4 4 0 118 0v4m-4 8a2 2 0 100-4 2 2 0 000 4zm0 0v4a2 2 0 002 2h4a2 2 0 002-2v-4'
                        />
                      </svg>
                    </div>
                  </div>
                  <div className='ml-5 w-0 flex-1'>
                    <dl>
                      <dt className='truncate text-sm font-medium text-gray-500'>
                        This Month
                      </dt>
                      <dd className='text-lg font-medium text-gray-900'>
                        {loading ? (
                          <div className='animate-pulse bg-gray-200 h-6 w-8 rounded'></div>
                        ) : (
                          statistics.estimates_this_month
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className='overflow-hidden bg-white shadow-sm sm:rounded-lg'>
              <div className='p-6'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <Link
                      href='/estimates/create'
                      className='flex h-8 w-8 items-center justify-center rounded-md bg-indigo-500 text-white hover:bg-indigo-600'
                    >
                      <svg
                        className='h-5 w-5'
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
                    </Link>
                  </div>
                  <div className='ml-5 w-0 flex-1'>
                    <dl>
                      <dt className='truncate text-sm font-medium text-gray-500'>
                        Quick Actions
                      </dt>
                      <dd className='text-sm font-medium text-gray-900'>
                        <Link
                          href='/estimates/create'
                          className='text-indigo-600 hover:text-indigo-500'
                        >
                          Create New Estimate
                        </Link>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='overflow-hidden bg-white shadow-sm sm:rounded-lg'>
            <div className='p-6'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <Link
                    href='/settings'
                    className='flex h-8 w-8 items-center justify-center rounded-md bg-gray-500 text-white hover:bg-gray-600'
                  >
                    <svg
                      className='h-5 w-5'
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
                  </Link>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='truncate text-sm font-medium text-gray-500'>
                      Configuration
                    </dt>
                    <dd className='text-sm font-medium text-gray-900'>
                      <Link
                        href='/settings'
                        className='text-gray-600 hover:text-gray-500'
                      >
                        Manage Settings
                      </Link>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Estimates */}
          <div className='overflow-hidden bg-white shadow-sm sm:rounded-lg'>
            <div className='border-b border-gray-200 bg-white px-4 py-5 sm:px-6'>
              <div className='-ml-4 -mt-4 flex flex-wrap items-center justify-between sm:flex-nowrap'>
                <div className='ml-4 mt-4'>
                  <h3 className='text-lg font-medium leading-6 text-gray-900'>
                    Recent Estimates
                  </h3>
                  <p className='mt-1 text-sm text-gray-500'>
                    Your most recently created estimates
                  </p>
                </div>
                <div className='ml-4 mt-4 flex-shrink-0'>
                  <Link
                    href='/estimates'
                    className='relative inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                  >
                    View All Estimates
                  </Link>
                </div>
              </div>
            </div>

            <div className='bg-white'>
              {loading ? (
                <div className='px-4 py-12 text-center'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
                  <p className='mt-4 text-gray-600'>
                    Loading recent estimates...
                  </p>
                </div>
              ) : recentEstimates.length > 0 ? (
                <ul className='divide-y divide-gray-200'>
                  {recentEstimates.map(estimate => (
                    <li key={estimate._id}>
                      <div className='px-4 py-4 sm:px-6'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center'>
                            <div className='flex-shrink-0'>
                              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100'>
                                <svg
                                  className='h-6 w-6 text-gray-600'
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
                            </div>
                            <div className='ml-4'>
                              <div className='flex items-center'>
                                <p className='text-sm font-medium text-indigo-600'>
                                  {estimate.reference_number}
                                </p>
                                {estimate.has_file && (
                                  <span className='ml-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800'>
                                    PDF
                                  </span>
                                )}
                              </div>
                              <p className='text-sm text-gray-900'>
                                {estimate.customer_name}
                              </p>
                              <p className='text-sm text-gray-500'>
                                {estimate.window_count} windows • Created{' '}
                                {estimate.created_at}
                              </p>
                            </div>
                          </div>
                          <div className='flex items-center space-x-4'>
                            <div className='text-right'>
                              <p className='text-sm font-medium text-gray-900'>
                                £{estimate.total_amount.toFixed(2)}
                              </p>
                            </div>
                            <Link
                              href={`/estimates/${estimate._id}`}
                              className='inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className='px-4 py-12 text-center'>
                  <svg
                    className='mx-auto h-12 w-12 text-gray-400'
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
                  <h3 className='mt-2 text-sm font-medium text-gray-900'>
                    No estimates
                  </h3>
                  <p className='mt-1 text-sm text-gray-500'>
                    Get started by creating your first estimate.
                  </p>
                  <div className='mt-6'>
                    <Link
                      href='/estimates/create'
                      className='inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                    >
                      <svg
                        className='-ml-1 mr-2 h-5 w-5'
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
                      Create New Estimate
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
