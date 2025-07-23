import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import WizardProgress from './Components/WizardProgress';
import WizardNavigation from './Components/WizardNavigation';
import CustomerInfoStep from './Steps/CustomerInfoStep';
import WindowSelectionStep from './Steps/WindowSelectionStep';
import WindowConfigStep from './Steps/WindowConfigStep';
import ExtrasSelectionStep from './Steps/ExtrasSelectionStep';
import ReviewStep from './Steps/ReviewStep';
import { usePWA } from '@/Hooks/usePWA';
import { watermelonDBService } from '@/Services/WatermelonDBService';
import { configSyncService } from '@/Services/ConfigSyncService';
import {
  WindowItem,
  CustomerInfo,
  WizardProps,
  ModalData,
} from '@/types/wizard';

export default function Wizard({
  windowTypes: serverWindowTypes,
  extras: serverExtras,
  finishes: serverFinishes,
  companyInfo: serverCompanyInfo,
  pdfTextConfig: serverPdfTextConfig,
  options: serverOptions,
  loadedEstimate,
}: WizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [highestStepReached, setHighestStepReached] = useState(1);
  const [stepValidation, setStepValidation] = useState<{
    [key: number]: boolean;
  }>({});

  // Configuration data state - loaded from cache/localStorage
  const [windowTypes, setWindowTypes] = useState(serverWindowTypes || []);
  const [extras, setExtras] = useState(serverExtras || []);
  const [finishes, setFinishes] = useState(serverFinishes || []);
  const [companyInfo, setCompanyInfo] = useState(serverCompanyInfo || {});
  const [pdfTextConfig, setPdfTextConfig] = useState(serverPdfTextConfig || {});
  const [options, setOptions] = useState(serverOptions || []);

  // Form data state
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({});
  const [windows, setWindows] = useState<WindowItem[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selectedCaveats, setSelectedCaveats] = useState<string[]>([]);
  const [currentWindowIndex, setCurrentWindowIndex] = useState<number | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state
  const [modalData, setModalData] = useState<ModalData | null>(null);

  // Configuration loading state
  const [configLoaded, setConfigLoaded] = useState(false);
  const [configMissing, setConfigMissing] = useState(false);

  const { canGenerateEstimate } = usePWA();

  const totalSteps = 5;

  // Load configuration data from WatermelonDB on component mount
  useEffect(() => {
    const loadCachedConfig = async () => {
      try {
        // Load data from WatermelonDB
        const [cachedWindowTypes, cachedExtras, cachedFinishes, cachedCompanyInfo] = await Promise.all([
          watermelonDBService.getCachedWindowTypes(),
          watermelonDBService.getCachedExtras(),
          watermelonDBService.getCachedFinishes(),
          watermelonDBService.getCachedCompanyInfo(),
        ]);

        // Only use cached data - no defaults
        if (cachedWindowTypes.length > 0) {
          // Convert to the format expected by the UI
          setWindowTypes({
            window_types: cachedWindowTypes.map(wt => ({
              Type: wt.name,
              Cost: wt.cost,
            }))
          });
        }

        if (cachedExtras.length > 0) {
          setExtras(cachedExtras);
        }

        if (Object.keys(cachedFinishes).length > 0) {
          setFinishes(cachedFinishes);
        }

        if (Object.keys(cachedCompanyInfo).length > 0) {
          setCompanyInfo(cachedCompanyInfo);
        }

        // For options, use localStorage as they're not synced from API
        const cachedOptions = localStorage.getItem('options');
        if (cachedOptions) {
          setOptions(JSON.parse(cachedOptions));
        } else {
          // Options are user-configurable, so provide defaults
          setOptions([
            { id: 1, name: 'Option 1' },
            { id: 2, name: 'Option 2' },
            { id: 3, name: 'Option 3' },
            { id: 4, name: 'Option 4' },
            { id: 5, name: 'Option 5' },
          ]);
        }

        // Check if essential configuration data is missing
        const hasWindowTypes = cachedWindowTypes.length > 0;
        const hasExtras = cachedExtras.length > 0;
        const hasFinishes = Object.keys(cachedFinishes).length > 0;

        if (!hasWindowTypes || !hasExtras || !hasFinishes) {
          setConfigMissing(true);
          console.warn('Essential configuration data is missing. Please go online to sync data.');
        }

        setConfigLoaded(true);
      } catch (error) {
        console.error('Failed to load cached configuration:', error);
        setConfigMissing(true);
        setConfigLoaded(true);
      }
    };

    loadCachedConfig();
  }, []);

  // Load estimate data if provided
  useEffect(() => {
    if (loadedEstimate) {
      const data = loadedEstimate.estimate_data;
      if (data) {
        setCustomerInfo(data.customerInfo || {});
        setWindows(data.windows || []);
        setSelectedExtras(data.selectedExtras || []);
        setSelectedOptions(data.selectedOptions || []);
        setSelectedCaveats(data.selectedCaveats || []);
      }
    }
  }, [loadedEstimate]);

  // Handle configuration sync
  const handleSyncConfiguration = async () => {
    try {
      console.log('Starting configuration sync...');
      await configSyncService.syncAllConfiguration();

      // Reload the cached configuration
      const loadCachedConfig = async () => {
        try {
          // Load data from WatermelonDB
          const [cachedWindowTypes, cachedExtras, cachedFinishes, cachedCompanyInfo] = await Promise.all([
            watermelonDBService.getCachedWindowTypes(),
            watermelonDBService.getCachedExtras(),
            watermelonDBService.getCachedFinishes(),
            watermelonDBService.getCachedCompanyInfo(),
          ]);

          // Only use cached data - no defaults
          if (cachedWindowTypes.length > 0) {
            // Convert to the format expected by the UI
            setWindowTypes({
              window_types: cachedWindowTypes.map(wt => ({
                Type: wt.name,
                Cost: wt.cost,
              }))
            });
          }

          if (cachedExtras.length > 0) {
            setExtras(cachedExtras);
          }

          if (Object.keys(cachedFinishes).length > 0) {
            setFinishes(cachedFinishes);
          }

          if (Object.keys(cachedCompanyInfo).length > 0) {
            setCompanyInfo(cachedCompanyInfo);
          }

          // Check if essential configuration data is missing
          const hasWindowTypes = cachedWindowTypes.length > 0;
          const hasExtras = cachedExtras.length > 0;
          const hasFinishes = Object.keys(cachedFinishes).length > 0;

          if (!hasWindowTypes || !hasExtras || !hasFinishes) {
            setConfigMissing(true);
            console.warn('Essential configuration data is missing. Please go online to sync data.');
          } else {
            setConfigMissing(false);
          }

          setConfigLoaded(true);
        } catch (error) {
          console.error('Failed to load cached configuration:', error);
          setConfigMissing(true);
          setConfigLoaded(true);
        }
      };

      await loadCachedConfig();

      console.log('Configuration sync completed successfully');
    } catch (error) {
      console.error('Configuration sync failed:', error);
      // You could add a toast notification here
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep < totalSteps && stepValidation[currentStep]) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      setHighestStepReached(Math.max(highestStepReached, newStep));
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step <= highestStepReached) {
      setCurrentStep(step);
    }
  };

  // Validation function with useCallback to prevent infinite re-renders
  const validateStep = React.useCallback((step: number, isValid: boolean) => {
    setStepValidation(prev => {
      if (prev[step] !== isValid) {
        return {
          ...prev,
          [step]: isValid,
        };
      }
      return prev;
    });
  }, []);

  // Update functions
  const updateCustomerInfo = (data: CustomerInfo) => {
    setCustomerInfo(data);
  };

  // Window management functions for WindowSelectionStep
  const addWindow = (window: WindowItem) => {
    setWindows(prev => [...prev, window]);
  };

  const updateWindow = (index: number, window: WindowItem) => {
    setWindows(prev => prev.map((w, i) => (i === index ? window : w)));
  };

  const removeWindow = (index: number) => {
    setWindows(prev => prev.filter((_, i) => i !== index));
  };

  const openModal = (data: ModalData | null) => {
    setModalData(data);
  };

  const setCurrentWindowByIndex = (index: number | null) => {
    setCurrentWindowIndex(index);
  };

  // Submit function - Save estimate locally and redirect to details
  const submitEstimate = async () => {
    setIsSubmitting(true);

    try {
      // Calculate totals
      const windowCount = windows.reduce(
        (total, window) => total + (window.quantity || 1),
        0
      );
      const totalAmount = windows.reduce((total, window) => {
        const basePrice = window.cost || 0;
        const extrasTotal =
          window.extras?.reduce((sum, extra) => sum + extra.cost, 0) || 0;
        return total + (basePrice + extrasTotal) * (window.quantity || 1);
      }, 0);

      // Create customer name
      const customerName =
        `${customerInfo.first_name || ''} ${customerInfo.last_name || ''}`.trim();

      // Save to WatermelonDB
      const customer = await watermelonDBService.createCustomer({
        name: customerName,
        email: customerInfo.email || null,
        phone: customerInfo.phone || null,
        addressLine1: customerInfo.address || null,
        city: customerInfo.city || null,
        postcode: customerInfo.postcode || null,
        country: customerInfo.country || null,
      });

      const estimate = await watermelonDBService.createEstimate(customer.id);

      // Add windows to the estimate
      for (const window of windows) {
        await watermelonDBService.addWindowToEstimate(estimate.id, window);
      }

      // Update estimate with total amount
      await estimate.updateAmounts({
        totalAmount,
        finalAmount: totalAmount,
      });

      // Redirect to the estimate details page
      window.location.href = `/estimates/${estimate.id}`;
    } catch (error) {
      console.error('Error saving estimate to WatermelonDB:', error);
      alert('An error occurred while saving the estimate. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CustomerInfoStep
            customerInfo={customerInfo}
            updateCustomerInfo={updateCustomerInfo}
            validateStep={validateStep}
          />
        );
      case 2:
        return (
          <WindowSelectionStep
            windows={windows}
            windowTypes={windowTypes}
            addWindow={addWindow}
            updateWindow={updateWindow}
            removeWindow={removeWindow}
            openModal={openModal}
            setCurrentWindow={setCurrentWindowByIndex}
            validateStep={validateStep}
          />
        );
      case 3:
        return (
          <WindowConfigStep
            windows={windows}
            windowTypes={windowTypes}
            finishes={finishes}
            currentWindow={currentWindowIndex}
            updateWindow={updateWindow}
            setCurrentWindow={setCurrentWindowByIndex}
            openModal={openModal}
            validateStep={validateStep}
          />
        );
      case 4:
        return (
          <ExtrasSelectionStep
            windows={windows}
            extras={extras}
            updateWindow={updateWindow}
            currentWindow={currentWindowIndex}
            setCurrentWindow={setCurrentWindowByIndex}
            openModal={openModal}
            validateStep={validateStep}
          />
        );
      case 5:
        return (
          <ReviewStep
            formData={{
              customerInfo,
              windows,
              selectedExtras,
              selectedOptions,
              selectedCaveats,
            }}
            windowTypes={windowTypes}
            extras={extras}
            finishes={finishes}
            companyInfo={companyInfo}
            pdfTextConfig={pdfTextConfig}
            options={options}
            updateFormData={(section: string, data: any) => {
              // Handle form data updates
              console.log('Updating form data:', section, data);
            }}
            submitEstimate={submitEstimate}
            validateStep={validateStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className='text-xl font-semibold leading-tight text-gray-800'>
          Create New Estimate
        </h2>
      }
    >
      <Head title='Create Estimate' />

      <div className='py-12'>
        <div className='mx-auto max-w-7xl sm:px-6 lg:px-8'>
          <div className='overflow-hidden bg-white shadow-sm sm:rounded-lg'>
            <div className='p-6'>
              {/* Configuration Missing Warning */}
              {configLoaded && configMissing && (
                <div className='mb-6 rounded-md bg-yellow-50 p-4'>
                  <div className='flex'>
                    <div className='flex-shrink-0'>
                      <svg className='h-5 w-5 text-yellow-400' viewBox='0 0 20 20' fill='currentColor'>
                        <path fillRule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
                      </svg>
                    </div>
                    <div className='ml-3'>
                      <h3 className='text-sm font-medium text-yellow-800'>
                        Configuration Data Required
                      </h3>
                      <div className='mt-2 text-sm text-yellow-700'>
                        <p>
                          Some configuration data is missing. Please connect to the internet and sync data before creating estimates.
                        </p>
                      </div>
                      <div className='mt-4'>
                        <button
                          type='button'
                          onClick={handleSyncConfiguration}
                          disabled={!navigator.onLine}
                          className='inline-flex items-center rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          <svg className='-ml-0.5 mr-1.5 h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
                            <path fillRule='evenodd' d='M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z' clipRule='evenodd' />
                          </svg>
                          {navigator.onLine ? 'Sync Configuration Data' : 'Connect to Internet to Sync'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Progress */}
              <WizardProgress
                currentStep={currentStep}
                totalSteps={totalSteps}
                setCurrentStep={goToStep}
                highestStepReached={highestStepReached}
              />

              {/* Current Step Content */}
              <div className='mt-8'>{renderCurrentStep()}</div>

              {/* Navigation */}
              <WizardNavigation
                currentStep={currentStep}
                totalSteps={totalSteps}
                nextStep={nextStep}
                prevStep={prevStep}
                submitEstimate={submitEstimate}
                isValid={stepValidation[currentStep] || false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalData && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0'>
            {/* Background overlay */}
            <div
              className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'
              onClick={() => setModalData(null)}
            />

            {/* Modal panel */}
            <div className='inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle'>
              <div className='bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4'>
                <div className='sm:flex sm:items-start'>
                  <div className='mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left'>
                    <h3 className='text-lg font-medium leading-6 text-gray-900'>
                      {modalData.title}
                    </h3>
                    <div className='mt-4'>{modalData.content}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
