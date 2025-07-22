import React from 'react';
import { Head, Link } from '@inertiajs/react';
import SyncTest from '../Components/SyncTest';

const SyncTestPage: React.FC = () => {
  return (
    <>
      <Head title='WatermelonDB Storage Test' />

      <div className='min-h-screen bg-gray-100'>
        {/* Header */}
        <header className='bg-white shadow-sm'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex justify-between items-center py-4'>
              <div className='flex items-center space-x-4'>
                <Link
                  href='/'
                  className='text-blue-600 hover:text-blue-800 font-medium'
                >
                  ← Back to Dashboard
                </Link>
                <h1 className='text-xl font-semibold text-gray-900'>
                  WatermelonDB Storage Test
                </h1>
              </div>
              <div className='text-sm text-gray-500'>
                Test offline-first data storage
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className='py-8'>
          <SyncTest />
        </main>

        {/* Footer */}
        <footer className='bg-white border-t mt-12'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
            <div className='text-center text-sm text-gray-500'>
              <p>
                This page tests the WatermelonDB offline-first data storage
                functionality. WatermelonDB provides fast, reactive database
                operations with automatic IndexedDB persistence.
              </p>
              <div className='mt-2 space-x-4'>
                <span>Storage: IndexedDB (browser native)</span>
                <span>Sync: Background API synchronization</span>
                <span>
                  Estimates DB:{' '}
                  <a
                    href='http://localhost:5984/window_estimates/_all_docs'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 hover:text-blue-800'
                  >
                    window_estimates
                  </a>
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default SyncTestPage;
