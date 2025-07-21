import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
  PlusIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { offlineEstimateService } from '../../Services/OfflineEstimateService';
import { CompletedEstimate } from '../../types';

interface EstimateFilters {
  search: string;
  status: 'all' | 'completed' | 'synced';
  dateRange: 'all' | 'today' | 'week' | 'month';
}

export default function OfflineIndex() {
  const [estimates, setEstimates] = useState<CompletedEstimate[]>([]);
  const [filteredEstimates, setFilteredEstimates] = useState<
    CompletedEstimate[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<EstimateFilters>({
    search: '',
    status: 'all',
    dateRange: 'all',
  });
  const [selectedEstimates, setSelectedEstimates] = useState<string[]>([]);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Load estimates on component mount
  useEffect(() => {
    loadEstimates();
  }, []);

  // Apply filters when estimates or filters change
  useEffect(() => {
    applyFilters();
  }, [estimates, filters]);

  const loadEstimates = async () => {
    try {
      setLoading(true);
      const loadedEstimates = await offlineEstimateService.getAllEstimates();
      setEstimates(loadedEstimates);
    } catch (error) {
      console.error('Failed to load estimates:', error);
      showNotification('error', 'Failed to load estimates');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...estimates];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        estimate =>
          estimate.referenceNumber.toLowerCase().includes(searchLower) ||
          `${estimate.customerDetails.first_name} ${estimate.customerDetails.last_name}`
            .toLowerCase()
            .includes(searchLower) ||
          estimate.customerDetails.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(
        estimate => estimate.status === filters.status
      );
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(
        estimate => new Date(estimate.createdAt) >= filterDate
      );
    }

    setFilteredEstimates(filtered);
  };

  const showNotification = (
    type: 'success' | 'error' | 'info',
    message: string
  ) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDeleteEstimate = async (estimateId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this estimate? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await offlineEstimateService.deleteEstimate(estimateId);
      await loadEstimates();
      showNotification('success', 'Estimate deleted successfully');
    } catch (error) {
      console.error('Failed to delete estimate:', error);
      showNotification('error', 'Failed to delete estimate');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEstimates.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedEstimates.length} estimate(s)? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      for (const estimateId of selectedEstimates) {
        await offlineEstimateService.deleteEstimate(estimateId);
      }
      setSelectedEstimates([]);
      await loadEstimates();
      showNotification(
        'success',
        `${selectedEstimates.length} estimate(s) deleted successfully`
      );
    } catch (error) {
      console.error('Failed to delete estimates:', error);
      showNotification('error', 'Failed to delete some estimates');
    }
  };

  const toggleEstimateSelection = (estimateId: string) => {
    setSelectedEstimates(prev =>
      prev.includes(estimateId)
        ? prev.filter(id => id !== estimateId)
        : [...prev, estimateId]
    );
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
        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
          Synced
        </span>
      );
    }

    switch (status) {
      case 'completed':
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
            Completed
          </span>
        );
      case 'draft':
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
            Draft
          </span>
        );
      default:
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
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

  return (
    <>
      <Head title='All Estimates' />

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
        <div className='max-w-7xl mx-auto sm:px-6 lg:px-8'>
          <div className='bg-white overflow-hidden shadow-sm sm:rounded-lg'>
            <div className='p-6'>
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
                        All Estimates
                      </span>
                    </div>
                  </li>
                </ol>
              </nav>

              {/* Header */}
              <div className='flex justify-between items-center mb-6'>
                <div>
                  <h1 className='text-2xl font-semibold text-gray-900'>
                    All Estimates
                  </h1>
                  <p className='text-gray-600 mt-1'>
                    {filteredEstimates.length} of {estimates.length} estimates
                  </p>
                </div>
                <div className='flex space-x-3'>
                  <Link
                    href='/'
                    className='inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                  >
                    <HomeIcon className='h-5 w-5 mr-2' />
                    Dashboard
                  </Link>
                  <Link
                    href='/estimates/create'
                    className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  >
                    <PlusIcon className='h-5 w-5 mr-2' />
                    Create New Estimate
                  </Link>
                </div>
              </div>

              {/* Filters */}
              <div className='bg-gray-50 p-4 rounded-lg mb-6'>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                  {/* Search */}
                  <div className='relative'>
                    <MagnifyingGlassIcon className='h-5 w-5 absolute left-3 top-3 text-gray-400' />
                    <input
                      type='text'
                      placeholder='Search estimates...'
                      value={filters.search}
                      onChange={e =>
                        setFilters(prev => ({
                          ...prev,
                          search: e.target.value,
                        }))
                      }
                      className='pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={filters.status}
                    onChange={e =>
                      setFilters(prev => ({
                        ...prev,
                        status: e.target.value as any,
                      }))
                    }
                    className='rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                  >
                    <option value='all'>All Status</option>
                    <option value='completed'>Completed</option>
                    <option value='synced'>Synced</option>
                  </select>

                  {/* Date Range Filter */}
                  <select
                    value={filters.dateRange}
                    onChange={e =>
                      setFilters(prev => ({
                        ...prev,
                        dateRange: e.target.value as any,
                      }))
                    }
                    className='rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                  >
                    <option value='all'>All Time</option>
                    <option value='today'>Today</option>
                    <option value='week'>Last Week</option>
                    <option value='month'>Last Month</option>
                  </select>

                  {/* Bulk Actions */}
                  {selectedEstimates.length > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className='inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                    >
                      <TrashIcon className='h-4 w-4 mr-2' />
                      Delete ({selectedEstimates.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Estimates Table */}
              {filteredEstimates.length === 0 ? (
                <div className='text-center py-12'>
                  <DocumentArrowDownIcon className='mx-auto h-12 w-12 text-gray-400' />
                  <h3 className='mt-2 text-sm font-medium text-gray-900'>
                    No estimates found
                  </h3>
                  <p className='mt-1 text-sm text-gray-500'>
                    {estimates.length === 0
                      ? 'Get started by creating your first estimate.'
                      : 'Try adjusting your filters to see more results.'}
                  </p>
                  {estimates.length === 0 && (
                    <div className='mt-6'>
                      <Link
                        href='/estimates/create'
                        className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
                      >
                        <PlusIcon className='h-5 w-5 mr-2' />
                        Create New Estimate
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          <input
                            type='checkbox'
                            checked={
                              selectedEstimates.length ===
                              filteredEstimates.length
                            }
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedEstimates(
                                  filteredEstimates.map(est => est.id)
                                );
                              } else {
                                setSelectedEstimates([]);
                              }
                            }}
                            className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                          />
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Reference
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Customer
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Windows
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Total
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Status
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Created
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {filteredEstimates.map(estimate => (
                        <tr key={estimate.id} className='hover:bg-gray-50'>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <input
                              type='checkbox'
                              checked={selectedEstimates.includes(estimate.id)}
                              onChange={() =>
                                toggleEstimateSelection(estimate.id)
                              }
                              className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                            />
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div className='text-sm font-medium text-gray-900'>
                              {estimate.referenceNumber}
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div className='text-sm text-gray-900'>
                              {estimate.customerDetails.first_name}{' '}
                              {estimate.customerDetails.last_name}
                            </div>
                            <div className='text-sm text-gray-500'>
                              {estimate.customerDetails.email}
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                            {estimate.metadata.windowCount} (
                            {estimate.metadata.totalItems} items)
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                            {formatCurrency(estimate.breakdown.total)}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            {getStatusBadge(estimate.status, estimate.synced)}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            {formatDate(estimate.createdAt)}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                            <div className='flex space-x-2'>
                              <Link
                                href={`/estimates/view/${estimate.id}`}
                                className='text-blue-600 hover:text-blue-900'
                                title='View Estimate'
                              >
                                <EyeIcon className='h-4 w-4' />
                              </Link>
                              <button
                                onClick={() =>
                                  handleDeleteEstimate(estimate.id)
                                }
                                className='text-red-600 hover:text-red-900'
                              >
                                <TrashIcon className='h-4 w-4' />
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
