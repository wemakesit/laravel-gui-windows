import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import CustomerInfoStep from './Steps/CustomerInfoStep';
import WindowSelectionStep from './Steps/WindowSelectionStep';
import WindowConfigStep from './Steps/WindowConfigStep';
import ExtrasSelectionStep from './Steps/ExtrasSelectionStep';
import OptionsSelectionStep from './Steps/OptionsSelectionStep';
import ReviewStep from './Steps/ReviewStep';
import WizardProgress from './Components/WizardProgress';
import WizardNavigation from './Components/WizardNavigation';

export default function Wizard({ windowTypes, extras, finishes, companyInfo, pdfTextConfig, options, loadedQuotation }) {
    const [currentStep, setCurrentStep] = useState(1);
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

    // Track the highest step the user has reached
    const [highestStepReached, setHighestStepReached] = useState(1);

    // Track validation status for each step
    const [stepValidation, setStepValidation] = useState({
        1: false, // Customer Info
        2: true,  // Window Selection (always valid, even with no windows)
        3: true,  // Window Configuration (valid if there are no windows)
        4: true,  // Extras Selection (valid if there are no windows)
        5: true,  // Options Selection (valid if there are no windows)
        6: true,  // Review (always valid)
    });

    const totalSteps = 6;

    // Load quotation data if provided
    useEffect(() => {
        if (loadedQuotation && !isLoaded) {
            setFormData(loadedQuotation);
            setIsLoaded(true);

            // When loading a quotation, set the highest step reached to the total steps
            // This allows the user to navigate to any step
            setHighestStepReached(totalSteps);

            // Set all steps as valid when loading an existing quotation
            const validationState = {};
            for (let i = 1; i <= totalSteps; i++) {
                validationState[i] = true;
            }
            setStepValidation(validationState);

            setNotification({
                type: 'info',
                message: 'Quotation loaded successfully. You can now edit and regenerate it.'
            });

            // Clear notification after 3 seconds
            setTimeout(() => {
                setNotification(null);
            }, 3000);
        }
    }, [loadedQuotation, isLoaded, totalSteps]);

    const updateFormData = (section, data) => {
        setFormData(prevData => ({
            ...prevData,
            [section]: data
        }));
    };

    const addWindow = (window) => {
        // Ensure the window has an options field set
        const windowWithOptions = {
            ...window,
            options: window.options || 1 // Default to option 1 if not set
        };

        setFormData(prevData => ({
            ...prevData,
            windows: [...prevData.windows, windowWithOptions]
        }));
    };

    const updateWindow = (index, window) => {
        // Ensure the window has an options field set
        const windowWithOptions = {
            ...window,
            options: window.options || 1 // Default to option 1 if not set
        };

        setFormData(prevData => {
            const updatedWindows = [...prevData.windows];
            updatedWindows[index] = windowWithOptions;
            return {
                ...prevData,
                windows: updatedWindows
            };
        });
    };

    const removeWindow = (index) => {
        setFormData(prevData => {
            const updatedWindows = [...prevData.windows];
            updatedWindows.splice(index, 1);
            return {
                ...prevData,
                windows: updatedWindows
            };
        });
    };

    const openModal = (content) => {
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
            [stepNumber]: isValid
        }));
    };

    const nextStep = () => {
        // Only proceed if current step is valid
        if (stepValidation[currentStep] && currentStep < totalSteps) {
            const newStep = currentStep + 1;
            setCurrentStep(newStep);

            // Update highest step reached if moving to a new step
            if (newStep > highestStepReached) {
                setHighestStepReached(newStep);
            }
        } else if (!stepValidation[currentStep]) {
            // Show notification if step is not valid
            setNotification({
                type: 'error',
                message: 'Please complete all required fields before proceeding.'
            });

            // Clear notification after 3 seconds
            setTimeout(() => {
                setNotification(null);
            }, 3000);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Custom function to handle direct step navigation from progress bar
    const goToStep = (stepNumber) => {
        // Only allow navigation to steps that have been reached or previous steps
        if (stepNumber <= highestStepReached) {
            setCurrentStep(stepNumber);
        }
    };

    const submitQuotation = () => {
        setIsGenerating(true);
        setNotification({ type: 'info', message: 'Generating quotation, please wait...' });

        // Use axios for direct file download instead of Inertia
        axios.post(route('quotations.generate'), formData, {
            responseType: 'blob', // Important for handling binary data
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            }
        })
        .then(response => {
            setIsGenerating(false);

            // Create a download link and trigger it
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Get filename from Content-Disposition header or use default
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'quotation.pdf';

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

            setNotification({ type: 'success', message: 'Quotation downloaded successfully!' });

            // Clear notification after 3 seconds
            setTimeout(() => {
                setNotification(null);
            }, 3000);
        })
        .catch(error => {
            setIsGenerating(false);
            console.error('Failed to generate quotation:', error);
            setNotification({ type: 'error', message: 'Failed to generate quotation. Please try again.' });

            // Clear notification after 3 seconds
            setTimeout(() => {
                setNotification(null);
            }, 3000);
        });
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <CustomerInfoStep
                        customerInfo={formData.customer_details}
                        updateCustomerInfo={(data) => updateFormData('customer_details', data)}
                        validateStep={validateStep}
                    />
                );
            case 2:
                return (
                    <WindowSelectionStep
                        windows={formData.windows}
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
                        windows={formData.windows}
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
                        windows={formData.windows}
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
                        windows={formData.windows}
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
                        submitQuotation={submitQuotation}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Head title="Window Quotation Wizard" />

            {notification && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-md ${
                    notification.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
                    notification.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
                    'bg-blue-100 border border-blue-400 text-blue-700'
                }`}>
                    <div className="flex items-center">
                        {notification.type === 'success' && (
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        )}
                        {notification.type === 'error' && (
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        )}
                        {notification.type === 'info' && (
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1-5a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                            </svg>
                        )}
                        <p>{notification.message}</p>
                    </div>
                </div>
            )}

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-2xl font-semibold">Window Quotation Wizard</h1>
                                <Link
                                    href={route('quotations.index')}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                >
                                    Back to Quotations
                                </Link>
                            </div>

                            <WizardProgress
                                currentStep={currentStep}
                                totalSteps={totalSteps}
                                setCurrentStep={goToStep}
                                highestStepReached={highestStepReached}
                            />

                            <div className="mt-8">
                                {renderStep()}
                            </div>

                            <WizardNavigation
                                currentStep={currentStep}
                                totalSteps={totalSteps}
                                nextStep={nextStep}
                                prevStep={prevStep}
                                submitQuotation={submitQuotation}
                                isValid={stepValidation[currentStep] && !isGenerating} // Disable button if step is invalid or generating
                            />
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && modalContent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">
                                {modalContent.title}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div>
                            {modalContent.content}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
