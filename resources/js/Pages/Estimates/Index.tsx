import React from 'react';
import { Head, Link, router } from '@inertiajs/react';

interface EstimateListItem {
  id: number;
  reference_number: string;
  customer_name: string;
  created_at: string;
  window_count: number;
  total_amount: string | number;
  has_file: boolean;
}

interface IndexProps {
  estimates: EstimateListItem[];
}

export default function Index({ estimates }: IndexProps) {
  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this window estimate?')) {
      router.delete(route('estimates.destroy', id));
    }
  };

  return (
    <>
      <Head title='Window Estimates' />

      <div className='py-12'>
        <div className='max-w-7xl mx-auto sm:px-6 lg:px-8'>
          <div className='bg-white overflow-hidden shadow-sm sm:rounded-lg'>
            <div className='p-6 text-gray-900'>
              <div className='flex justify-between items-center mb-6'>
                <div>
                  <h1 className='text-2xl font-semibold'>Window Estimates</h1>
                  <p className='text-gray-600 mt-1'>
                    Manage your window estimates and quotations
                  </p>
                </div>
                <div className='flex space-x-2'>
                  <Link
                    href={route('dashboard')}
                    className='px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors'
                  >
                    ← Dashboard
                  </Link>
                  <Link
                    href={route('settings.index')}
                    className='px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors'
                  >
                    Settings
                  </Link>
                  <Link
                    href={route('estimates.create')}
                    className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
                  >
                    Create New Estimate
                  </Link>
                </div>
              </div>

              {estimates.length === 0 ? (
                <div className='text-center py-12'>
                  <svg
                    className='mx-auto h-12 w-12 text-gray-400'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    aria-hidden='true'
                  >
                    <path
                      vectorEffect='non-scaling-stroke'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                  <h3 className='mt-2 text-sm font-medium text-gray-900'>
                    No window estimates
                  </h3>
                  <p className='mt-1 text-sm text-gray-500'>
                    Get started by creating your first window estimate.
                  </p>
                  <div className='mt-6'>
                    <Link
                      href={route('estimates.create')}
                      className='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
                    >
                      <svg
                        className='-ml-1 mr-2 h-5 w-5'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <path
                          fillRule='evenodd'
                          d='M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z'
                          clipRule='evenodd'
                        />
                      </svg>
                      New Window Estimate
                    </Link>
                  </div>
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                        >
                          Reference
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                        >
                          Customer
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                        >
                          Created
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                        >
                          Windows
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                        >
                          Total
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                        >
                          Status
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {estimates.map(estimate => (
                        <tr key={estimate.id} className='hover:bg-gray-50'>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <Link
                              href={route('estimates.show', estimate.id)}
                              className='text-blue-600 hover:text-blue-900 font-medium'
                            >
                              {estimate.reference_number}
                            </Link>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div className='text-sm font-medium text-gray-900'>
                              {estimate.customer_name}
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            {estimate.created_at}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                            {estimate.window_count}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                            £{estimate.total_amount}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            {estimate.has_file ? (
                              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                                PDF Ready
                              </span>
                            ) : (
                              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
                                Processing
                              </span>
                            )}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                            <div className='flex justify-end space-x-2'>
                              <Link
                                href={route('estimates.show', estimate.id)}
                                className='text-blue-600 hover:text-blue-900'
                              >
                                View
                              </Link>
                              <Link
                                href={route('estimates.load', estimate.id)}
                                className='text-green-600 hover:text-green-900'
                              >
                                Edit
                              </Link>
                              {estimate.has_file && (
                                <Link
                                  href={route(
                                    'estimates.download',
                                    estimate.id
                                  )}
                                  className='text-purple-600 hover:text-purple-900'
                                >
                                  Download
                                </Link>
                              )}
                              <button
                                onClick={() => handleDelete(estimate.id)}
                                className='text-red-600 hover:text-red-900'
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
