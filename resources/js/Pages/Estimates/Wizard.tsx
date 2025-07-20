import React, { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { usePWA } from '../../Hooks/usePWA';
import OfflineStatus from '../../Components/OfflineStatus';
import CustomerInfoStep from './Steps/CustomerInfoStep';
import WindowSelectionStep from './Steps/WindowSelectionStep';
import WindowConfigStep from './Steps/WindowConfigStep';
import ExtrasSelectionStep from './Steps/ExtrasSelectionStep';
import OptionsSelectionStep from './Steps/OptionsSelectionStep';
import ReviewStep from './Steps/ReviewStep';
import WizardProgress from './Components/WizardProgress';
import WizardNavigation from './Components/WizardNavigation';
import StepTransition from './Components/StepTransition';

// Interface for the saved draft data
interface EstimateDraft {
  formData: {
    customer_details: {
      title: string;
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      address: string;
      additional_info: string;
    };
    windows: any[];
    selected_caveats: Record<string, boolean>;
  };
  currentStep: number;
  highestStepReached: number;
  timestamp: number;
}

export default function Wizard({
  windowTypes,
  extras,
  finishes,
  companyInfo,
  pdfTextConfig,
  options,
  loadedEstimate,
}) {
  const { canGenerateEstimate, cacheEstimate, isOnline } = usePWA();
  const [currentStep, setCurrentStep] = useState(1);
  const [previousStep, setPreviousStep] = useState(1);
  const [transitionDirection, setTransitionDirection] = useState<
    'forward' | 'backward'
  >('forward');
  const [formData, setFormData] = useState({
    customer_details: {
      title: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      additional_info: '',
    },
    windows: [],
    selected_caveats: {},
  });

  const [currentWindow, setCurrentWindow] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Ref for debouncing saves
  const saveTimeoutRef = useRef<number | null>(null);

  // Track the highest step the user has reached
  const [highestStepReached, setHighestStepReached] = useState(1);

  // Track validation status for each step
  const [stepValidation, setStepValidation] = useState({
    1: false, // Customer Info
    2: true, // Window Selection (always valid, even with no windows)
    3: true, // Window Configuration (valid if there are no windows)
    4: true, // Extras Selection (valid if there are no windows)
    5: true, // Options Selection (valid if there are no windows)
    6: true, // Review (always valid)
  });

  const totalSteps = 6;
  const STORAGE_KEY = 'estimate_draft';

  // Function to clear the saved draft
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHasDraft(false);
    setLastSaved(null);
  };

  // Load draft from localStorage on component mount
  useEffect(() => {
    // Only try to load from localStorage if no estimate is loaded from the backend
    if (!loadedEstimate && !isLoaded) {
      try {
        const savedDraft = localStorage.getItem(STORAGE_KEY);
        if (savedDraft) {
          const parsedDraft: EstimateDraft = JSON.parse(savedDraft);

          // Set the form data and navigation state
          setFormData(parsedDraft.formData);
          setCurrentStep(parsedDraft.currentStep);
          setHighestStepReached(parsedDraft.highestStepReached);

          // Set all steps as valid when loading a draft
          const validationState: Record<number, boolean> = {};
          for (let i = 1; i <= totalSteps; i++) {
            validationState[i] = true;
          }
          setStepValidation(
            validationState as {
              1: boolean;
              2: boolean;
              3: boolean;
              4: boolean;
              5: boolean;
              6: boolean;
            }
          );

          // Set the last saved timestamp
          setLastSaved(new Date(parsedDraft.timestamp));
          setHasDraft(true);
          setIsLoaded(true);

          // Show notification
          setNotification({
            type: 'info',
            message:
              'Draft estimate loaded. You can continue where you left off.',
          });

          // Clear notification after 3 seconds
          setTimeout(() => {
            setNotification(null);
          }, 3000);
        }
      } catch (error) {
        console.error('Error loading draft from localStorage:', error);
        // If there's an error, clear the draft to avoid future errors
        clearDraft();
      }
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Load estimate data if provided
  useEffect(() => {
    if (loadedEstimate && !isLoaded) {
      console.log('Wizard: Loading estimate data', loadedEstimate);

      // Log the customer details specifically
      if (loadedEstimate.customer_details) {
        console.log(
          'Wizard: Customer details from loaded estimate',
          loadedEstimate.customer_details
        );
      }

      // Clear any existing draft when loading an estimate from the backend
      clearDraft();

      setFormData(loadedEstimate);
      setIsLoaded(true);

      // When loading an estimate, set the highest step reached to the total steps
      // This allows the user to navigate to any step
      setHighestStepReached(totalSteps);

      // Set all steps as valid when loading an existing estimate
      const validationState: Record<number, boolean> = {};
      for (let i = 1; i <= totalSteps; i++) {
        validationState[i] = true;
      }
      setStepValidation(
        validationState as {
          1: boolean;
          2: boolean;
          3: boolean;
          4: boolean;
          5: boolean;
          6: boolean;
        }
      );

      setNotification({
        type: 'info',
        message:
          'Estimate loaded successfully. You can now edit and regenerate it.',
      });

      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
  }, [loadedEstimate, isLoaded, totalSteps]);

  // Save draft to localStorage when form data or navigation state changes
  useEffect(() => {
    // Only save if the form has been loaded (either from localStorage or from backend)
    // and we're not currently generating a PDF
    if (isLoaded && !isGenerating) {
      const draftData: EstimateDraft = {
        formData,
        currentStep,
        highestStepReached,
        timestamp: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
      setLastSaved(new Date());
      setHasDraft(true);
    }
  }, [formData, currentStep, highestStepReached, isLoaded, isGenerating]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const updateFormData = (section, data) => {
    setFormData(prevData => {
      const newData = {
        ...prevData,
        [section]: data,
      };

      // Debounced save to localStorage for offline persistence
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = window.setTimeout(() => {
        try {
          localStorage.setItem('estimate_draft', JSON.stringify({
            ...newData,
            timestamp: Date.now(),
            currentStep,
            highestStepReached,
            stepValidation
          }));
          console.log('Draft saved:', section);
        } catch (error) {
          console.error('Failed to save draft:', error);
        }
      }, 500); // 500ms debounce

      return newData;
    });
  };

  const addWindow = window => {
    // Ensure the window has an options field set
    const windowWithOptions = {
      ...window,
      options: window.options || 1, // Default to option 1 if not set
    };

    setFormData(prevData => ({
      ...prevData,
      windows: [...prevData.windows, windowWithOptions],
    }));
  };

  const updateWindow = (index, window) => {
    // Ensure the window has an options field set
    const windowWithOptions = {
      ...window,
      options: window.options || 1, // Default to option 1 if not set
    };

    setFormData(prevData => {
      const updatedWindows = [...prevData.windows];
      updatedWindows[index] = windowWithOptions;
      return {
        ...prevData,
        windows: updatedWindows,
      };
    });
  };

  const removeWindow = index => {
    setFormData(prevData => {
      const updatedWindows = [...prevData.windows];
      updatedWindows.splice(index, 1);
      return {
        ...prevData,
        windows: updatedWindows,
      };
    });
  };

  const openModal = content => {
    // Only open the modal if there's actual content to display
    if (content) {
      setModalContent(content);
      setIsModalOpen(true);
    } else {
      // If no content is provided, close the modal
      closeModal();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  // Function to validate a specific step
  const validateStep = (stepNumber, isValid) => {
    setStepValidation(prev => ({
      ...prev,
      [stepNumber]: isValid,
    }));
  };

  const nextStep = () => {
    // Only proceed if current step is valid
    if (stepValidation[currentStep] && currentStep < totalSteps) {
      // Start transition
      setIsTransitioning(true);
      setTransitionDirection('forward');
      setPreviousStep(currentStep);

      const newStep = currentStep + 1;

      // Delay the actual step change to allow for animation
      setTimeout(() => {
        setCurrentStep(newStep);

        // Update highest step reached if moving to a new step
        if (newStep > highestStepReached) {
          setHighestStepReached(newStep);
        }

        // End transition after a short delay to ensure smooth animation
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 150);
    } else if (!stepValidation[currentStep]) {
      // Show notification if step is not valid
      setNotification({
        type: 'error',
        message: 'Please complete all required fields before proceeding.',
      });

      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      // Start transition
      setIsTransitioning(true);
      setTransitionDirection('backward');
      setPreviousStep(currentStep);

      // Delay the actual step change to allow for animation
      setTimeout(() => {
        setCurrentStep(currentStep - 1);

        // End transition after a short delay to ensure smooth animation
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 150);
    }
  };

  // Custom function to handle direct step navigation from progress bar
  const goToStep = stepNumber => {
    // Only allow navigation to steps that have been reached or previous steps
    if (stepNumber <= highestStepReached && stepNumber !== currentStep) {
      // Start transition
      setIsTransitioning(true);
      setTransitionDirection(stepNumber > currentStep ? 'forward' : 'backward');
      setPreviousStep(currentStep);

      // Delay the actual step change to allow for animation
      setTimeout(() => {
        setCurrentStep(stepNumber);

        // End transition after a short delay to ensure smooth animation
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 150);
    }
  };

  const submitEstimate = () => {
    // Check if we can generate PDF (online only)
    if (!canGenerateEstimate) {
      // Cache estimate for offline use
      const estimateData = {
        id: `offline-${Date.now()}`,
        customerInfo: formData?.customer_details || {},
        windows: formData?.windows || [],
        selectedCaveats: formData?.selected_caveats || {},
        timestamp: Date.now(),
        synced: false
      };

      cacheEstimate(estimateData);

      setNotification({
        type: 'info',
        message: 'Estimate saved offline. PDF will be generated when you\'re back online.',
      });

      // Clear the draft after saving offline
      clearDraft();

      setTimeout(() => {
        setNotification(null);
      }, 5000);

      return;
    }

    setIsGenerating(true);
    setNotification({
      type: 'info',
      message: 'Generating estimate, please wait...',
    });

    // Use axios for direct file download instead of Inertia
    axios
      .post(route('estimates.generate'), formData, {
        responseType: 'blob', // Important for handling binary data
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute('content'),
        },
      })
      .then(response => {
        setIsGenerating(false);

        // Create a download link and trigger it
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'estimate.pdf';

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
          if (filenameMatch && filenameMatch.length === 2) {
            filename = filenameMatch[1];
          }
        }

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clear the draft after successful submission
        clearDraft();

        setNotification({
          type: 'success',
          message: 'Estimate downloaded successfully!',
        });

        // Clear notification after 3 seconds
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      })
      .catch(error => {
        setIsGenerating(false);
        console.error('Failed to generate estimate:', error);
        setNotification({
          type: 'error',
          message: 'Failed to generate estimate. Please try again.',
        });

        // Clear notification after 3 seconds
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      });
  };

  const renderStep = () => {
    // Render both the current step and the previous step during transitions
    // This allows for smooth animations between steps

    const renderStepContent = step => {
      switch (step) {
        case 1:
          return (
            <CustomerInfoStep
              customerInfo={formData?.customer_details || {}}
              updateCustomerInfo={data =>
                updateFormData('customer_details', data)
              }
              validateStep={validateStep}
            />
          );
        case 2:
          return (
            <WindowSelectionStep
              windows={formData?.windows || []}
              windowTypes={windowTypes}
              addWindow={addWindow}
              updateWindow={updateWindow}
              removeWindow={removeWindow}
              openModal={openModal}
              setCurrentWindow={setCurrentWindow}
            />
          );
        case 3:
          return (
            <WindowConfigStep
              windows={formData?.windows || []}
              windowTypes={windowTypes}
              finishes={finishes}
              updateWindow={updateWindow}
              currentWindow={currentWindow}
              setCurrentWindow={setCurrentWindow}
              openModal={openModal}
            />
          );
        case 4:
          return (
            <ExtrasSelectionStep
              windows={formData?.windows || []}
              extras={extras}
              updateWindow={updateWindow}
              currentWindow={currentWindow}
              setCurrentWindow={setCurrentWindow}
              openModal={openModal}
            />
          );
        case 5:
          return (
            <OptionsSelectionStep
              windows={formData?.windows || []}
              options={options}
              updateWindow={updateWindow}
              currentWindow={currentWindow}
              setCurrentWindow={setCurrentWindow}
              openModal={openModal}
            />
          );
        case 6:
          return (
            <ReviewStep
              formData={formData}
              windowTypes={windowTypes}
              extras={extras}
              finishes={finishes}
              companyInfo={companyInfo}
              pdfTextConfig={pdfTextConfig}
              options={options}
              updateFormData={updateFormData}
              submitEstimate={submitEstimate}
            />
          );
        default:
          return null;
      }
    };

    return (
      <div className='relative'>
        {/* Current step */}
        <StepTransition show={!isTransitioning} direction={transitionDirection}>
          {renderStepContent(currentStep)}
        </StepTransition>

        {/* Previous step (shown during transition) */}
        {isTransitioning && (
          <div className='absolute top-0 left-0 w-full'>
            <StepTransition
              show={isTransitioning}
              direction={
                transitionDirection === 'forward' ? 'backward' : 'forward'
              }
            >
              {renderStepContent(previousStep)}
            </StepTransition>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Head title='Window Estimate Wizard' />

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
            {notification.type === 'success' && (
              <svg
                className='w-5 h-5 mr-2'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                  clipRule='evenodd'
                />
              </svg>
            )}
            {notification.type === 'error' && (
              <svg
                className='w-5 h-5 mr-2'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
            )}
            {notification.type === 'info' && (
              <svg
                className='w-5 h-5 mr-2'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1-5a1 1 0 100 2 1 1 0 000-2z'
                  clipRule='evenodd'
                />
              </svg>
            )}
            <p>{notification.message}</p>
          </div>
        </div>
      )}

      <div className='py-12'>
        <div className='max-w-7xl mx-auto sm:px-6 lg:px-8'>
          {/* Offline Status */}
          <OfflineStatus className='mb-6' />

          <div className='bg-white overflow-hidden shadow-sm sm:rounded-lg'>
            <div className='p-6 text-gray-900'>
              <div className='flex justify-between items-center mb-6'>
                <div>
                  <h1 className='text-2xl font-semibold'>
                    Window Estimate Wizard
                  </h1>
                  {hasDraft && lastSaved && (
                    <div className='flex items-center mt-2 text-sm text-gray-500'>
                      <svg
                        className='w-4 h-4 mr-1'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                        />
                      </svg>
                      <span>
                        Draft last saved: {lastSaved.toLocaleTimeString()}{' '}
                        {lastSaved.toLocaleDateString()}
                      </span>
                      <button
                        onClick={e => {
                          e.preventDefault();
                          if (
                            confirm(
                              'Are you sure you want to clear this draft and start over?'
                            )
                          ) {
                            clearDraft();
                            window.location.reload();
                          }
                        }}
                        className='ml-2 text-red-600 hover:text-red-800 underline'
                      >
                        Clear Draft
                      </button>
                    </div>
                  )}
                </div>
                <Link
                  href={route('estimates.index')}
                  className='px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300'
                >
                  Back to Estimates
                </Link>
              </div>

              <WizardProgress
                currentStep={currentStep}
                totalSteps={totalSteps}
                setCurrentStep={goToStep}
                highestStepReached={highestStepReached}
              />

              <div className='mt-8'>{renderStep()}</div>

              <WizardNavigation
                currentStep={currentStep}
                totalSteps={totalSteps}
                nextStep={nextStep}
                prevStep={prevStep}
                submitEstimate={submitEstimate}
                isValid={stepValidation[currentStep] && !isGenerating} // Disable button if step is invalid or generating
              />
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && modalContent && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-xl font-semibold'>{modalContent.title}</h2>
              <button
                onClick={closeModal}
                className='text-gray-500 hover:text-gray-700'
              >
                <span className='text-2xl'>&times;</span>
              </button>
            </div>
            <div>{modalContent.content}</div>
          </div>
        </div>
      )}
    </>
  );
}
