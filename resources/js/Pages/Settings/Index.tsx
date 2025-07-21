import { useState, FormEvent, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
// Note: Tab components are deprecated in the current version of @headlessui/react
// They should be updated to the newer API in a future update
import { Tab } from '@headlessui/react';
// import axios from 'axios'; // Uncomment when API health check is implemented
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { CompanyInfo, WindowType, Extra, Finish, PdfTextConfig } from '@/types';
import PWADebug from '../../Components/PWADebug';
import InstallPrompt from '../../Components/InstallPrompt';
import OfflineStatus from '../../Components/OfflineStatus';
import { configCacheService } from '../../Services/ConfigCacheService';
import { pouchDBService, SyncStatus } from '../../Services/PouchDBService';

interface ApiDocs {
  apiBaseUrl?: string;
  url?: string;
}

interface SettingsProps {
  apiDocs?: ApiDocs;
  companyInfo?: CompanyInfo;
  windowTypes?: WindowType[];
  extras?: Extra[];
  finishes?: Finish[];
  pdfTextConfig?: PdfTextConfig;
}

export default function Index({
  apiDocs,
  companyInfo,
  windowTypes,
  extras,
  finishes,
  // Renamed with underscore prefix to indicate it's unused
  pdfTextConfig: _pdfTextConfig,
}: SettingsProps) {
  const [selectedTab, setSelectedTab] = useState(0);
  // apiBaseUrl is used but setApiBaseUrl is not currently used
  const [apiBaseUrl] = useState(apiDocs?.apiBaseUrl || 'http://localhost:8001');

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmationType, setConfirmationType] = useState(null); // 'company_info', 'window_types', 'extras', 'finishes', 'pdf_text'

  // PouchDB sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: null,
    syncInProgress: false,
    error: null,
    documentsCount: 0,
  });
  const [cachedConfig, setCachedConfig] = useState({
    windowTypes: [],
    extras: [],
    finishes: [],
    companyInfo: {},
    options: [],
  });

  // Load cached configuration and setup sync monitoring
  useEffect(() => {
    const loadCachedConfig = async () => {
      try {
        const config = await configCacheService.getConfig();
        setCachedConfig(config);

        // Update sync status
        const status = configCacheService.getSyncStatus();
        setSyncStatus(status);
      } catch (error) {
        console.error('Settings: Error loading cached config:', error);
      }
    };

    loadCachedConfig();

    // Setup sync status monitoring
    const handleSyncChange = (status: SyncStatus) => {
      setSyncStatus(status);
      // Reload cached config after sync
      loadCachedConfig();
    };

    pouchDBService.onSyncChange(handleSyncChange);

    // Setup continuous sync
    configCacheService.setupContinuousSync();

    return () => {
      pouchDBService.removeSyncHandler(handleSyncChange);
    };
  }, []);

  // Initialize forms for each configuration section
  const companyInfoForm = useForm({
    name: companyInfo?.name || '',
    address: {
      line1: companyInfo?.address?.line1 || '',
      line2: companyInfo?.address?.line2 || '',
      country: companyInfo?.address?.country || '',
    },
    contact: {
      phone: companyInfo?.contact?.phone || '',
      email: companyInfo?.contact?.email || '',
      website: companyInfo?.contact?.website || '',
    },
    registration: {
      company_number: companyInfo?.registration?.company_number || '',
      vat_number: companyInfo?.registration?.vat_number || '',
    },
  });

  // Window types form
  const windowTypesForm = useForm<{ window_types: any[] }>({
    window_types: windowTypes || [],
  });

  // Extras form
  const extrasForm = useForm<{ extras: any[] }>({
    extras: extras || [],
  });

  // Finishes form
  const finishesForm = useForm<{ finishes: any[] }>({
    finishes: finishes || [],
  });

  // Form for API base URL - currently unused but kept for future use
  // const apiUrlForm = useForm({
  //     baseUrl: apiBaseUrl,
  // });

  // Check API status - currently unused but kept for future use
  // const checkApiStatus = async () => {
  //     try {
  //         const response = await axios.get('/api/health');
  //         // setApiStatus(response.data);
  //     } catch (error) {
  //         // setApiStatus({ status: 'error', message: error.message });
  //     }
  // };

  // Force sync with CouchDB
  const handleForceSync = async () => {
    if (!navigator.onLine) {
      alert(
        'Cannot sync while offline. Please check your internet connection.'
      );
      return;
    }

    if (syncStatus.syncInProgress) {
      alert('Sync already in progress. Please wait...');
      return;
    }

    try {
      setSyncStatus(prev => ({ ...prev, syncInProgress: true, error: null }));
      await configCacheService.forceSync();

      // Reload cached config after sync
      const config = await configCacheService.getConfig();
      setCachedConfig(config);

      alert('Configuration synced successfully from CouchDB!');
    } catch (error) {
      console.error('Settings: Force sync failed:', error);
      setSyncStatus(prev => ({ ...prev, error: error.message }));
      alert(`Sync failed: ${error.message}`);
    } finally {
      setSyncStatus(prev => ({ ...prev, syncInProgress: false }));
    }
  };

  // Handle form submissions
  const openConfirmModal = (type: string) => {
    setConfirmationType(type);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmationType(null);
  };

  const handleConfirm = () => {
    if (confirmationType === 'company_info') {
      companyInfoForm.post(route('settings.update-company-info'), {
        onSuccess: () => {
          closeConfirmModal();
          // Could add a success notification here
        },
      });
    } else if (confirmationType === 'window_types') {
      // Handle window types update
      windowTypesForm.post(route('settings.update-window-types'), {
        onSuccess: () => {
          closeConfirmModal();
        },
      });
    } else if (confirmationType === 'extras') {
      // Handle extras update
      extrasForm.post(route('settings.update-extras'), {
        onSuccess: () => {
          closeConfirmModal();
        },
      });
    } else if (confirmationType === 'finishes') {
      // Handle finishes update
      finishesForm.post(route('settings.update-finishes'), {
        onSuccess: () => {
          closeConfirmModal();
        },
      });
    }
  };

  const submitCompanyInfo = (e: FormEvent) => {
    e.preventDefault();
    openConfirmModal('company_info');
  };

  const submitWindowTypes = (e: FormEvent) => {
    e.preventDefault();
    openConfirmModal('window_types');
  };

  const submitExtras = (e: FormEvent) => {
    e.preventDefault();
    openConfirmModal('extras');
  };

  const submitFinishes = (e: FormEvent) => {
    e.preventDefault();
    openConfirmModal('finishes');
  };

  return (
    <>
      <Head title='Settings' />

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onClose={closeConfirmModal} maxWidth='md'>
        <div className='p-6'>
          <h2 className='text-lg font-medium text-gray-900 mb-4'>
            Confirm Update
          </h2>

          <p className='mb-6 text-sm text-gray-600'>
            {confirmationType === 'company_info' &&
              'Are you sure you want to update the company information?'}
            {confirmationType === 'window_types' &&
              'Are you sure you want to update the window types?'}
            {confirmationType === 'extras' &&
              'Are you sure you want to update the extras?'}
            {confirmationType === 'finishes' &&
              'Are you sure you want to update the finishes?'}
            {confirmationType === 'pdf_text' &&
              'Are you sure you want to update the PDF text configuration?'}
          </p>

          <div className='mt-6 flex justify-end space-x-3'>
            <SecondaryButton onClick={closeConfirmModal}>
              Cancel
            </SecondaryButton>

            <PrimaryButton onClick={handleConfirm} disabled={false}>
              Confirm
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      <div className='py-12'>
        <div className='max-w-7xl mx-auto sm:px-6 lg:px-8'>
          <div className='bg-white overflow-hidden shadow-sm sm:rounded-lg'>
            <div className='p-6 text-gray-900'>
              <div className='flex justify-between items-center mb-6'>
                <h1 className='text-2xl font-semibold'>Settings</h1>
                <Link
                  href={route('dashboard')}
                  className='px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700'
                >
                  Back to Dashboard
                </Link>
              </div>

              <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                <Tab.List className='flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6'>
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                                            ${
                                              selected
                                                ? 'bg-white text-blue-700 shadow'
                                                : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                                            }`
                    }
                  >
                    API Documentation
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                                            ${
                                              selected
                                                ? 'bg-white text-blue-700 shadow'
                                                : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                                            }`
                    }
                  >
                    Company Info
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                                            ${
                                              selected
                                                ? 'bg-white text-blue-700 shadow'
                                                : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                                            }`
                    }
                  >
                    Window Types
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                                            ${
                                              selected
                                                ? 'bg-white text-blue-700 shadow'
                                                : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                                            }`
                    }
                  >
                    Extras
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                                            ${
                                              selected
                                                ? 'bg-white text-blue-700 shadow'
                                                : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                                            }`
                    }
                  >
                    Finishes
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                                            ${
                                              selected
                                                ? 'bg-white text-blue-700 shadow'
                                                : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                                            }`
                    }
                  >
                    PDF Text
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                                            ${
                                              selected
                                                ? 'bg-white text-blue-700 shadow'
                                                : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                                            }`
                    }
                  >
                    PWA & Offline
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                                            ${
                                              selected
                                                ? 'bg-white text-blue-700 shadow'
                                                : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                                            }`
                    }
                  >
                    Data Sync
                  </Tab>
                </Tab.List>
                <Tab.Panels>
                  {/* API Documentation Panel */}
                  <Tab.Panel>
                    <div className='rounded-xl bg-white p-3'>
                      <h2 className='text-xl font-semibold mb-4'>
                        API Documentation
                      </h2>

                      <div className='mb-6'>
                        <h3 className='text-lg font-medium mb-2'>
                          API Configuration
                        </h3>
                        <div className='bg-gray-50 p-4 rounded-lg border'>
                          <p className='mb-2'>
                            The API is currently configured to run at:{' '}
                            <code className='bg-gray-100 px-1 py-0.5 rounded'>
                              {apiBaseUrl}
                            </code>
                          </p>
                          <div className='mt-4'>
                            <a
                              href={apiDocs?.url || `${apiBaseUrl}/docs`}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
                            >
                              Open API Documentation in New Tab
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className='mt-6'>
                        <h3 className='text-lg font-medium mb-2'>
                          API Endpoints
                        </h3>
                        <div className='bg-gray-50 p-4 rounded-lg border'>
                          <ul className='space-y-2'>
                            <li>
                              <strong>Company Info:</strong>{' '}
                              <code>
                                {apiBaseUrl}/api/v1/config/company_info
                              </code>
                            </li>
                            <li>
                              <strong>Window Types:</strong>{' '}
                              <code>
                                {apiBaseUrl}/api/v1/config/window_types
                              </code>
                            </li>
                            <li>
                              <strong>Extras:</strong>{' '}
                              <code>{apiBaseUrl}/api/v1/config/extras</code>
                            </li>
                            <li>
                              <strong>Finishes:</strong>{' '}
                              <code>{apiBaseUrl}/api/v1/config/finishes</code>
                            </li>
                            <li>
                              <strong>PDF Text Config:</strong>{' '}
                              <code>
                                {apiBaseUrl}/api/v1/config/pdf_text_config
                              </code>
                            </li>
                            <li>
                              <strong>Generate Estimate:</strong>{' '}
                              <code>{apiBaseUrl}/api/v1/quotations</code>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </Tab.Panel>

                  {/* Company Info Panel */}
                  <Tab.Panel>
                    <div className='rounded-xl bg-white p-3'>
                      <h2 className='text-xl font-semibold mb-4'>
                        Company Information
                      </h2>

                      <form onSubmit={submitCompanyInfo}>
                        <div className='grid grid-cols-1 gap-6 mt-4'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700'>
                              Company Name
                            </label>
                            <input
                              type='text'
                              name='name'
                              id='name'
                              value={companyInfoForm.data.name}
                              onChange={e =>
                                companyInfoForm.setData('name', e.target.value)
                              }
                              className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                            />
                            {companyInfoForm.errors.name && (
                              <p className='text-red-500 text-xs mt-1'>
                                {companyInfoForm.errors.name}
                              </p>
                            )}
                          </div>

                          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div>
                              <label className='block text-sm font-medium text-gray-700'>
                                Address Line 1
                              </label>
                              <input
                                type='text'
                                name='address.line1'
                                id='address_line1'
                                value={companyInfoForm.data.address.line1}
                                onChange={e =>
                                  companyInfoForm.setData(
                                    'address.line1',
                                    e.target.value
                                  )
                                }
                                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                              />
                              {companyInfoForm.errors['address.line1'] && (
                                <p className='text-red-500 text-xs mt-1'>
                                  {companyInfoForm.errors['address.line1']}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className='block text-sm font-medium text-gray-700'>
                                Address Line 2
                              </label>
                              <input
                                type='text'
                                name='address.line2'
                                id='address_line2'
                                value={companyInfoForm.data.address.line2}
                                onChange={e =>
                                  companyInfoForm.setData(
                                    'address.line2',
                                    e.target.value
                                  )
                                }
                                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                              />
                              {companyInfoForm.errors['address.line2'] && (
                                <p className='text-red-500 text-xs mt-1'>
                                  {companyInfoForm.errors['address.line2']}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className='mt-6'>
                            <button
                              type='submit'
                              className='inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                              disabled={companyInfoForm.processing}
                            >
                              {companyInfoForm.processing
                                ? 'Saving...'
                                : 'Save Company Info'}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </Tab.Panel>

                  {/* Other panels will be implemented similarly */}
                  <Tab.Panel>
                    <div className='rounded-xl bg-white p-3'>
                      <h2 className='text-xl font-semibold mb-4'>
                        Window Types
                      </h2>

                      <form onSubmit={submitWindowTypes}>
                        <div className='grid grid-cols-1 gap-6 mt-4'>
                          {/* Window types form fields would go here */}
                          <p className='text-gray-500 mb-4'>
                            Configure window types and their pricing here.
                          </p>

                          {/* Example of window types form fields */}
                          <div className='border rounded-md p-4'>
                            <h3 className='font-medium mb-2'>
                              Window Types Configuration
                            </h3>
                            <p className='text-sm text-gray-500 mb-4'>
                              Add, edit, or remove window types that will be
                              available in estimates.
                            </p>

                            {/* This would typically be a dynamic list of window types */}
                            <div className='space-y-4'>
                              {windowTypes && windowTypes.length > 0 ? (
                                windowTypes.map((type, index) => (
                                  <div key={index} className='border-b pb-4'>
                                    <p>
                                      <strong>Name:</strong> {type.Type}
                                    </p>
                                    <p>
                                      <strong>Description:</strong>{' '}
                                      {type.Description}
                                    </p>
                                    <p>
                                      <strong>Base Price:</strong> £
                                      {type.BasePrice}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <p>No window types configured yet.</p>
                              )}
                            </div>
                          </div>

                          <div className='mt-6'>
                            <button
                              type='submit'
                              className='inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                              disabled={windowTypesForm.processing}
                            >
                              {windowTypesForm.processing
                                ? 'Saving...'
                                : 'Save Window Types'}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </Tab.Panel>

                  <Tab.Panel>
                    <div className='rounded-xl bg-white p-3'>
                      <h2 className='text-xl font-semibold mb-4'>Extras</h2>

                      <form onSubmit={submitExtras}>
                        <div className='grid grid-cols-1 gap-6 mt-4'>
                          {/* Extras form fields would go here */}
                          <p className='text-gray-500 mb-4'>
                            Configure additional options and extras for windows.
                          </p>

                          {/* Example of extras form fields */}
                          <div className='border rounded-md p-4'>
                            <h3 className='font-medium mb-2'>
                              Extras Configuration
                            </h3>
                            <p className='text-sm text-gray-500 mb-4'>
                              Add, edit, or remove extras that can be added to
                              windows in estimates.
                            </p>

                            {/* This would typically be a dynamic list of extras */}
                            <div className='space-y-4'>
                              {extras && extras.length > 0 ? (
                                extras.map((extra, index) => (
                                  <div key={index} className='border-b pb-4'>
                                    <p>
                                      <strong>Name:</strong> {extra.Name}
                                    </p>
                                    <p>
                                      <strong>Description:</strong>{' '}
                                      {extra.Description}
                                    </p>
                                    <p>
                                      <strong>Price:</strong> £{extra.Cost}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <p>No extras configured yet.</p>
                              )}
                            </div>
                          </div>

                          <div className='mt-6'>
                            <button
                              type='submit'
                              className='inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                              disabled={extrasForm.processing}
                            >
                              {extrasForm.processing
                                ? 'Saving...'
                                : 'Save Extras'}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </Tab.Panel>

                  <Tab.Panel>
                    <div className='rounded-xl bg-white p-3'>
                      <h2 className='text-xl font-semibold mb-4'>Finishes</h2>

                      <form onSubmit={submitFinishes}>
                        <div className='grid grid-cols-1 gap-6 mt-4'>
                          {/* Finishes form fields would go here */}
                          <p className='text-gray-500 mb-4'>
                            Configure available finishes for windows.
                          </p>

                          {/* Example of finishes form fields */}
                          <div className='border rounded-md p-4'>
                            <h3 className='font-medium mb-2'>
                              Finishes Configuration
                            </h3>
                            <p className='text-sm text-gray-500 mb-4'>
                              Add, edit, or remove finishes that can be applied
                              to windows in estimates.
                            </p>

                            {/* This would typically be a dynamic list of finishes */}
                            <div className='space-y-4'>
                              {finishes && finishes.length > 0 ? (
                                finishes.map((finish, index) => (
                                  <div key={index} className='border-b pb-4'>
                                    <p>
                                      <strong>Name:</strong> {finish.name}
                                    </p>
                                    <p>
                                      <strong>Description:</strong>{' '}
                                      {finish.description}
                                    </p>
                                    <p>
                                      <strong>Price Modifier:</strong>{' '}
                                      {finish.price_modifier}%
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <p>No finishes configured yet.</p>
                              )}
                            </div>
                          </div>

                          <div className='mt-6'>
                            <button
                              type='submit'
                              className='inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                              disabled={finishesForm.processing}
                            >
                              {finishesForm.processing
                                ? 'Saving...'
                                : 'Save Finishes'}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </Tab.Panel>

                  <Tab.Panel>
                    <div className='rounded-xl bg-white p-3'>
                      <h2 className='text-xl font-semibold mb-4'>
                        PDF Text Configuration
                      </h2>
                      <p className='text-gray-500'>
                        PDF text configuration will be implemented here.
                      </p>
                    </div>
                  </Tab.Panel>

                  {/* PWA & Offline Panel */}
                  <Tab.Panel>
                    <div className='rounded-xl bg-white p-3'>
                      <h2 className='text-xl font-semibold mb-4'>
                        PWA & Offline Settings
                      </h2>

                      {/* Offline Status */}
                      <div className='mb-6'>
                        <h3 className='text-lg font-medium mb-3'>
                          Connection Status
                        </h3>
                        <OfflineStatus showWhenOnline={true} />
                      </div>

                      {/* App Installation */}
                      <div className='mb-6'>
                        <h3 className='text-lg font-medium mb-3'>
                          App Installation
                        </h3>
                        <div className='bg-gray-50 rounded-lg p-4'>
                          <p className='text-sm text-gray-600 mb-4'>
                            Install this application for better performance,
                            offline access, and a native app experience on your
                            Surface Pro tablet.
                          </p>
                          <div className='flex flex-wrap gap-3'>
                            <InstallPrompt variant='button' />
                            <button
                              onClick={() => {
                                if ('serviceWorker' in navigator) {
                                  navigator.serviceWorker
                                    .register('/sw.js')
                                    .then(reg => {
                                      console.log(
                                        'Manual SW registration:',
                                        reg
                                      );
                                      alert(
                                        'Service Worker registered successfully!'
                                      );
                                    })
                                    .catch(err => {
                                      console.error(
                                        'Manual SW registration failed:',
                                        err
                                      );
                                      alert(
                                        'Service Worker registration failed: ' +
                                          err.message
                                      );
                                    });
                                } else {
                                  alert(
                                    'Service Workers not supported in this browser'
                                  );
                                }
                              }}
                              className='inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                            >
                              Test Service Worker
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Manual Install Instructions */}
                      <div className='mb-6'>
                        <h3 className='text-lg font-medium mb-3'>
                          Manual Installation
                        </h3>
                        <div className='bg-blue-50 rounded-lg p-4'>
                          <p className='text-sm text-blue-800 mb-3'>
                            If the automatic install doesn't work, you can
                            manually install the app:
                          </p>
                          <ul className='text-sm text-blue-700 space-y-2'>
                            <li>
                              <strong>Chrome/Edge:</strong> Click the menu (⋮) →
                              "Install Window Estimate System"
                            </li>
                            <li>
                              <strong>Safari:</strong> Click Share → "Add to
                              Home Screen"
                            </li>
                            <li>
                              <strong>Firefox:</strong> Click the address bar
                              install icon
                            </li>
                            <li>
                              <strong>Surface Pro:</strong> Use Edge for best
                              tablet experience
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* PWA Debug Information */}
                      <div className='mb-6'>
                        <h3 className='text-lg font-medium mb-3'>
                          Technical Information
                        </h3>
                        <PWADebug />
                      </div>

                      {/* Offline Features */}
                      <div className='mb-6'>
                        <h3 className='text-lg font-medium mb-3'>
                          Offline Features
                        </h3>
                        <div className='bg-green-50 rounded-lg p-4'>
                          <h4 className='font-medium text-green-800 mb-2'>
                            What works offline:
                          </h4>
                          <ul className='text-sm text-green-700 space-y-1 mb-4'>
                            <li>• Create and edit window estimates</li>
                            <li>• Access customer information forms</li>
                            <li>• Configure windows and options</li>
                            <li>• Save estimates locally</li>
                            <li>• View previously created estimates</li>
                          </ul>

                          <h4 className='font-medium text-green-800 mb-2'>
                            What requires internet:
                          </h4>
                          <ul className='text-sm text-green-700 space-y-1'>
                            <li>• PDF generation and download</li>
                            <li>• Syncing estimates to server</li>
                            <li>• Loading configuration updates</li>
                            <li>• Address lookup functionality</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </Tab.Panel>

                  {/* Data Sync Panel */}
                  <Tab.Panel>
                    <div className='rounded-xl bg-white p-3'>
                      <h2 className='text-xl font-semibold mb-4'>
                        PouchDB Data Synchronisation
                      </h2>

                      {/* Sync Status */}
                      <div className='mb-6'>
                        <h3 className='text-lg font-medium mb-3'>
                          Sync Status
                        </h3>
                        <div className='bg-gray-50 p-4 rounded-lg'>
                          <div className='grid grid-cols-2 gap-4'>
                            <div>
                              <span className='text-sm font-medium text-gray-600'>
                                Connection:
                              </span>
                              <span
                                className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                  syncStatus.isOnline
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {syncStatus.isOnline ? 'Online' : 'Offline'}
                              </span>
                            </div>
                            <div>
                              <span className='text-sm font-medium text-gray-600'>
                                Documents:
                              </span>
                              <span className='ml-2 text-sm text-gray-900'>
                                {syncStatus.documentsCount}
                              </span>
                            </div>
                            <div>
                              <span className='text-sm font-medium text-gray-600'>
                                Last Sync:
                              </span>
                              <span className='ml-2 text-sm text-gray-900'>
                                {syncStatus.lastSync
                                  ? new Date(
                                      syncStatus.lastSync
                                    ).toLocaleString()
                                  : 'Never'}
                              </span>
                            </div>
                            <div>
                              <span className='text-sm font-medium text-gray-600'>
                                Status:
                              </span>
                              <span
                                className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                  syncStatus.syncInProgress
                                    ? 'bg-blue-100 text-blue-800'
                                    : syncStatus.error
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {syncStatus.syncInProgress
                                  ? 'Syncing...'
                                  : syncStatus.error
                                    ? 'Error'
                                    : 'Ready'}
                              </span>
                            </div>
                          </div>

                          {syncStatus.error && (
                            <div className='mt-3 p-3 bg-red-50 border border-red-200 rounded'>
                              <p className='text-sm text-red-700'>
                                {syncStatus.error}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Force Sync Button */}
                      <div className='mb-6'>
                        <h3 className='text-lg font-medium mb-3'>
                          Manual Sync
                        </h3>
                        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4'>
                          <p className='text-sm text-yellow-800 mb-2'>
                            <strong>Warning:</strong> Force sync will overwrite
                            all local configuration data with data from CouchDB.
                          </p>
                          <p className='text-sm text-yellow-700'>
                            This action cannot be undone. Make sure your CouchDB
                            contains the correct configuration data.
                          </p>
                        </div>
                        <PrimaryButton
                          onClick={handleForceSync}
                          disabled={
                            !syncStatus.isOnline || syncStatus.syncInProgress
                          }
                          className='bg-blue-600 hover:bg-blue-700'
                        >
                          {syncStatus.syncInProgress
                            ? 'Syncing...'
                            : 'Force Sync from CouchDB'}
                        </PrimaryButton>
                      </div>

                      {/* Cached Configuration Display */}
                      <div className='mb-6'>
                        <h3 className='text-lg font-medium mb-3'>
                          Cached Configuration
                        </h3>
                        <div className='space-y-4'>
                          <div className='bg-gray-50 p-4 rounded-lg'>
                            <h4 className='font-medium text-gray-900 mb-2'>
                              Window Types ({cachedConfig.windowTypes.length})
                            </h4>
                            {cachedConfig.windowTypes.length > 0 ? (
                              <div className='text-sm text-gray-600'>
                                {cachedConfig.windowTypes
                                  .slice(0, 3)
                                  .map((type: any, index: number) => (
                                    <div
                                      key={index}
                                      className='flex justify-between'
                                    >
                                      <span>
                                        {type.Type || type.name || 'Unknown'}
                                      </span>
                                      <span>
                                        £{type.Cost || type.price || 0}
                                      </span>
                                    </div>
                                  ))}
                                {cachedConfig.windowTypes.length > 3 && (
                                  <div className='text-xs text-gray-500 mt-1'>
                                    ...and {cachedConfig.windowTypes.length - 3}{' '}
                                    more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className='text-sm text-gray-500'>
                                No window types cached
                              </p>
                            )}
                          </div>

                          <div className='bg-gray-50 p-4 rounded-lg'>
                            <h4 className='font-medium text-gray-900 mb-2'>
                              Extras ({cachedConfig.extras.length})
                            </h4>
                            {cachedConfig.extras.length > 0 ? (
                              <div className='text-sm text-gray-600'>
                                {cachedConfig.extras
                                  .slice(0, 3)
                                  .map((extra: any, index: number) => (
                                    <div
                                      key={index}
                                      className='flex justify-between'
                                    >
                                      <span>
                                        {extra.Name || extra.name || 'Unknown'}
                                      </span>
                                      <span>
                                        £{extra.Cost || extra.price || 0}
                                      </span>
                                    </div>
                                  ))}
                                {cachedConfig.extras.length > 3 && (
                                  <div className='text-xs text-gray-500 mt-1'>
                                    ...and {cachedConfig.extras.length - 3} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className='text-sm text-gray-500'>
                                No extras cached
                              </p>
                            )}
                          </div>

                          <div className='bg-gray-50 p-4 rounded-lg'>
                            <h4 className='font-medium text-gray-900 mb-2'>
                              Finishes ({cachedConfig.finishes.length})
                            </h4>
                            {cachedConfig.finishes.length > 0 ? (
                              <div className='text-sm text-gray-600'>
                                {cachedConfig.finishes
                                  .slice(0, 3)
                                  .map((finish: any, index: number) => (
                                    <div
                                      key={index}
                                      className='flex justify-between'
                                    >
                                      <span>
                                        {finish.Name ||
                                          finish.name ||
                                          'Unknown'}
                                      </span>
                                      <span>
                                        £{finish.Cost || finish.price || 0}
                                      </span>
                                    </div>
                                  ))}
                                {cachedConfig.finishes.length > 3 && (
                                  <div className='text-xs text-gray-500 mt-1'>
                                    ...and {cachedConfig.finishes.length - 3}{' '}
                                    more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className='text-sm text-gray-500'>
                                No finishes cached
                              </p>
                            )}
                          </div>

                          <div className='bg-gray-50 p-4 rounded-lg'>
                            <h4 className='font-medium text-gray-900 mb-2'>
                              Company Information
                            </h4>
                            {Object.keys(cachedConfig.companyInfo).length >
                            0 ? (
                              <div className='text-sm text-gray-600'>
                                <div>
                                  Name:{' '}
                                  {cachedConfig.companyInfo.name || 'Not set'}
                                </div>
                                <div>
                                  Address:{' '}
                                  {cachedConfig.companyInfo.address?.line1 ||
                                    'Not set'}
                                </div>
                              </div>
                            ) : (
                              <p className='text-sm text-gray-500'>
                                No company information cached
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                        <h4 className='font-medium text-blue-900 mb-2'>
                          How Data Sync Works
                        </h4>
                        <ul className='text-sm text-blue-800 space-y-1'>
                          <li>
                            • Configuration data is stored locally in PouchDB
                          </li>
                          <li>
                            • Data automatically syncs with CouchDB when online
                          </li>
                          <li>
                            • Force sync overwrites local data with server data
                          </li>
                          <li>
                            • Estimates work offline using cached configuration
                          </li>
                          <li>• All data persists between browser sessions</li>
                        </ul>
                      </div>
                    </div>
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
