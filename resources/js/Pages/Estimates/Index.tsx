import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { pouchDBService } from '@/Services/PouchDBService';
import Modal from '@/Components/Modal';

interface EstimateListItem {
  _id: string;
  reference_number: string;
  customer_name: string;
  created_at: string;
  window_count: number;
  total_amount: string | number;
  has_file?: boolean;
}

interface IndexProps {
  estimates: EstimateListItem[];
  usePouchDB?: boolean;
}

export default function Index({
  estimates: initialEstimates,
  usePouchDB = false,
}: IndexProps) {
  const [estimates, setEstimates] =
    useState<EstimateListItem[]>(initialEstimates);
  const [loading, setLoading] = useState(usePouchDB);
  const [selectedEstimate, setSelectedEstimate] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingEstimate, setLoadingEstimate] = useState(false);

  useEffect(() => {
    if (usePouchDB) {
      loadEstimatesFromPouchDB();
    }
  }, [usePouchDB]);

  const loadEstimatesFromPouchDB = async () => {
    try {
      setLoading(true);
      console.log('Loading estimates from PouchDB...');
      const docs = await pouchDBService.getEstimates();
      console.log('Raw PouchDB docs:', docs);
      const estimateList = docs.map((doc: any) => ({
        _id: doc._id,
        reference_number: doc._id, // Use _id as reference number
        customer_name: doc.customerName,
        created_at: new Date(doc.createdAt).toLocaleDateString('en-GB'),
        window_count: doc.windows ? doc.windows.length : 0,
        total_amount: doc.totalPrice,
        has_file: doc._attachments && Object.keys(doc._attachments).length > 0,
      }));
      console.log('Mapped estimate list:', estimateList);
      setEstimates(estimateList);
    } catch (error) {
      console.error('Error loading estimates from PouchDB:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewEstimate = async (estimateId: string) => {
    if (usePouchDB) {
      // Offline mode - load from PouchDB and show in modal
      try {
        setLoadingEstimate(true);
        const estimate = await pouchDBService.getEstimate(estimateId);
        setSelectedEstimate(estimate);
        setShowModal(true);
      } catch (error) {
        console.error('Error loading estimate:', error);
        alert('Error loading estimate. Please try again.');
      } finally {
        setLoadingEstimate(false);
      }
    } else {
      // Online mode - navigate to server route
      router.visit(`/estimates/${estimateId}`);
    }
  };

  const handleEditEstimate = (estimateId: string) => {
    if (usePouchDB) {
      // For offline editing, we can navigate to the wizard with the estimate ID
      router.visit(`/estimates/${estimateId}/load`);
    } else {
      router.visit(`/estimates/${estimateId}/load`);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEstimate(null);
  };
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this window estimate?')) {
      if (usePouchDB) {
        try {
          await pouchDBService.deleteEstimate(id);
          await loadEstimatesFromPouchDB(); // Reload the list
        } catch (error) {
          console.error('Error deleting estimate:', error);
          alert('Failed to delete estimate');
        }
      } else {
        router.delete(route('estimates.destroy', id));
      }
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
                      {loading ? (
                        <tr>
                          <td
                            colSpan={7}
                            className='px-6 py-4 text-center text-gray-500'
                          >
                            Loading estimates...
                          </td>
                        </tr>
                      ) : (
                        estimates.map(estimate => (
                          <tr key={estimate._id} className='hover:bg-gray-50'>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <button
                                onClick={() => handleViewEstimate(estimate._id)}
                                className='text-blue-600 hover:text-blue-900 font-medium'
                                disabled={loadingEstimate}
                              >
                                {estimate.reference_number}
                              </button>
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
                                <button
                                  onClick={() =>
                                    handleViewEstimate(estimate._id)
                                  }
                                  className='text-blue-600 hover:text-blue-900'
                                  disabled={loadingEstimate}
                                >
                                  View
                                </button>
                                <button
                                  onClick={() =>
                                    handleEditEstimate(estimate._id)
                                  }
                                  className='text-green-600 hover:text-green-900'
                                >
                                  Edit
                                </button>
                                {estimate.has_file && (
                                  <Link
                                    href={route(
                                      'estimates.download',
                                      estimate._id
                                    )}
                                    className='text-purple-600 hover:text-purple-900'
                                  >
                                    Download
                                  </Link>
                                )}
                                <button
                                  onClick={() => handleDelete(estimate._id)}
                                  className='text-red-600 hover:text-red-900'
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Offline Estimate View Modal */}
      <Modal show={showModal} onClose={closeModal} maxWidth='4xl'>
        <div className='p-6'>
          {selectedEstimate ? (
            <div>
              <div className='flex justify-between items-center mb-6'>
                <h2 className='text-2xl font-bold text-gray-900'>
                  Estimate {selectedEstimate._id}
                </h2>
                <button
                  onClick={closeModal}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Customer Information */}
                <div className='bg-gray-50 p-4 rounded-lg'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                    Customer Information
                  </h3>
                  <div className='space-y-2'>
                    <p>
                      <span className='font-medium'>Name:</span>{' '}
                      {selectedEstimate.customerName}
                    </p>
                    <p>
                      <span className='font-medium'>Email:</span>{' '}
                      {selectedEstimate.customerEmail}
                    </p>
                    <p>
                      <span className='font-medium'>Phone:</span>{' '}
                      {selectedEstimate.customerPhone}
                    </p>
                    <p>
                      <span className='font-medium'>Address:</span>{' '}
                      {selectedEstimate.customerAddress}
                    </p>
                  </div>
                </div>

                {/* Estimate Details */}
                <div className='bg-gray-50 p-4 rounded-lg'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                    Estimate Details
                  </h3>
                  <div className='space-y-2'>
                    <p>
                      <span className='font-medium'>Created:</span>{' '}
                      {new Date(selectedEstimate.createdAt).toLocaleDateString(
                        'en-GB'
                      )}
                    </p>
                    <p>
                      <span className='font-medium'>Status:</span>{' '}
                      {selectedEstimate.status}
                    </p>
                    <p>
                      <span className='font-medium'>Windows:</span>{' '}
                      {selectedEstimate.windows?.length || 0}
                    </p>
                    <p>
                      <span className='font-medium'>Total:</span> £
                      {selectedEstimate.totalPrice}
                    </p>
                  </div>
                </div>
              </div>

              {/* Windows List */}
              {selectedEstimate.windows &&
                selectedEstimate.windows.length > 0 && (
                  <div className='mt-6'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                      Windows
                    </h3>
                    <div className='bg-white border rounded-lg overflow-hidden'>
                      <table className='min-w-full divide-y divide-gray-200'>
                        <thead className='bg-gray-50'>
                          <tr>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                              Type
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                              Room
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                              Price
                            </th>
                          </tr>
                        </thead>
                        <tbody className='bg-white divide-y divide-gray-200'>
                          {selectedEstimate.windows.map(
                            (window: any, index: number) => (
                              <tr key={index}>
                                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                  {window.type}
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                  {window.room}
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                  £{window.price}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              <div className='mt-6 flex justify-end space-x-3'>
                <button
                  onClick={() => handleEditEstimate(selectedEstimate._id)}
                  className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
                >
                  Edit Estimate
                </button>
                <button
                  onClick={closeModal}
                  className='px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400'
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className='text-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
              <p className='mt-4 text-gray-600'>Loading estimate...</p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
