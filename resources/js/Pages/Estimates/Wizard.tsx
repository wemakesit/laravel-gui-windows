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
import {
  WindowItem,
  CustomerInfo,
  WizardProps,
  ModalData,
} from '@/types/wizard';

export default function Wizard({
  windowTypes,
  extras,
  finishes,
  companyInfo,
  pdfTextConfig,
  options,
  loadedEstimate,
}: WizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [highestStepReached, setHighestStepReached] = useState(1);
  const [stepValidation, setStepValidation] = useState<{
    [key: number]: boolean;
  }>({});

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

  const { canGenerateEstimate } = usePWA();

  const totalSteps = 5;

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
