import React, { useState, useEffect } from 'react';
import { watermelonDBService } from '../Services/WatermelonDBService';

const SyncTest: React.FC = () => {
  const [storageInfo, setStorageInfo] = useState<{
    customers: number;
    estimates: number;
    windows: number;
    photos: number;
  }>({ customers: 0, estimates: 0, windows: 0, photos: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    // Load initial data
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const info = await watermelonDBService.getStorageInfo();
      setStorageInfo(info);
      setMessage('Data loaded successfully!');
    } catch (error) {
      console.error('Failed to load data:', error);
      setMessage(
        `Error loading data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    setLoading(true);
    setMessage('');
    try {
      await watermelonDBService.clearAllData();
      await loadData();
      setMessage('All data cleared successfully!');
    } catch (error) {
      console.error('Clear data failed:', error);
      setMessage(
        `Clear data failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestCustomer = async () => {
    setLoading(true);
    setMessage('');
    try {
      const testCustomer = {
        name: `Test Customer ${Date.now()}`,
        email: 'test@example.com',
        phone: '01234567890',
        addressLine1: '123 Test Street',
        city: 'Test City',
        postcode: 'TE1 2ST',
        country: 'United Kingdom',
      };

      await watermelonDBService.createCustomer(testCustomer);
      await loadData();
      setMessage('Test customer added successfully!');
    } catch (error) {
      console.error('Failed to add test customer:', error);
      setMessage(
        `Failed to add test customer: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestEstimate = async () => {
    setLoading(true);
    setMessage('');
    try {
      // First create a customer
      const testCustomer = await watermelonDBService.createCustomer({
        name: `Test Customer ${Date.now()}`,
        email: 'test@example.com',
        phone: '01234567890',
        addressLine1: '123 Test Street',
        city: 'Test City',
        postcode: 'TE1 2ST',
        country: 'United Kingdom',
      });

      // Then create an estimate
      await watermelonDBService.createEstimate(testCustomer.id);
      await loadData();
      setMessage('Test estimate added successfully!');
    } catch (error) {
      console.error('Failed to add test estimate:', error);
      setMessage(
        `Failed to add test estimate: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  // WatermelonDB status functions would go here

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      <div className='bg-white rounded-lg shadow-md p-6'>
        <h2 className='text-2xl font-bold mb-4'>WatermelonDB Storage Test</h2>

        {/* Storage Info */}
        <div className='mb-6 p-4 bg-gray-50 rounded-lg'>
          <h3 className='text-lg font-semibold mb-2'>Storage Information</h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
            <div>
              <span className='font-medium'>Customers: </span>
              <span className='text-blue-600'>{storageInfo.customers}</span>
            </div>
            <div>
              <span className='font-medium'>Estimates: </span>
              <span className='text-green-600'>{storageInfo.estimates}</span>
            </div>
            <div>
              <span className='font-medium'>Windows: </span>
              <span className='text-purple-600'>{storageInfo.windows}</span>
            </div>
            <div>
              <span className='font-medium'>Photos: </span>
              <span className='text-orange-600'>{storageInfo.photos}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='mb-6 flex flex-wrap gap-3'>
          <button
            onClick={loadData}
            disabled={loading}
            className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Reload Data
          </button>
          <button
            onClick={handleAddTestCustomer}
            disabled={loading}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Add Test Customer
          </button>
          <button
            onClick={handleAddTestEstimate}
            disabled={loading}
            className='px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Add Test Estimate
          </button>
          <button
            onClick={handleClearData}
            disabled={loading}
            className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Clear All Data
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-md ${
              message.includes('Error') || message.includes('failed')
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-green-100 text-green-700 border border-green-200'
            }`}
          >
            {message}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className='mb-4 p-3 bg-blue-100 text-blue-700 rounded-md'>
            Loading...
          </div>
        )}

        {/* Info */}
        <div className='p-4 bg-blue-50 rounded-lg'>
          <h3 className='text-lg font-semibold mb-2'>About WatermelonDB</h3>
          <p className='text-sm text-gray-700'>
            This component tests the WatermelonDB integration. WatermelonDB
            provides offline-first data storage with better performance and
            TypeScript support compared to traditional database solutions. Use
            the buttons above to test creating customers and estimates, or clear
            all data to start fresh.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SyncTest;
