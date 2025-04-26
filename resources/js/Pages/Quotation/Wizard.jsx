import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import CustomerInfoStep from './Steps/CustomerInfoStep';
import WindowSelectionStep from './Steps/WindowSelectionStep';
import WindowConfigStep from './Steps/WindowConfigStep';
import ExtrasSelectionStep from './Steps/ExtrasSelectionStep';
import ReviewStep from './Steps/ReviewStep';
import WizardProgress from './Components/WizardProgress';
import WizardNavigation from './Components/WizardNavigation';

export default function Wizard({ windowTypes, extras, finishes, companyInfo, pdfTextConfig }) {
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

    const totalSteps = 5;

    const updateFormData = (section, data) => {
        setFormData(prevData => ({
            ...prevData,
            [section]: data
        }));
    };

    const addWindow = (window) => {
        setFormData(prevData => ({
            ...prevData,
            windows: [...prevData.windows, window]
        }));
    };

    const updateWindow = (index, window) => {
        setFormData(prevData => {
            const updatedWindows = [...prevData.windows];
            updatedWindows[index] = window;
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

    const nextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const submitQuotation = () => {
        // Use Inertia's router to handle the form submission
        router.post(route('quotation.generate'), formData, {
            forceFormData: true, // Force form data to handle file downloads
            onSuccess: () => {
                // The browser will automatically handle the file download
                console.log('Quotation generated successfully');
            },
            onError: (errors) => {
                console.error('Failed to generate quotation:', errors);
            }
        });
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <CustomerInfoStep
                        customerInfo={formData.customer_details}
                        updateCustomerInfo={(data) => updateFormData('customer_details', data)}
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
                    <ReviewStep
                        formData={formData}
                        windowTypes={windowTypes}
                        extras={extras}
                        finishes={finishes}
                        companyInfo={companyInfo}
                        pdfTextConfig={pdfTextConfig}
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

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h1 className="text-2xl font-semibold mb-6">Window Quotation Wizard</h1>

                            <WizardProgress currentStep={currentStep} totalSteps={totalSteps} />

                            <div className="mt-8">
                                {renderStep()}
                            </div>

                            <WizardNavigation
                                currentStep={currentStep}
                                totalSteps={totalSteps}
                                nextStep={nextStep}
                                prevStep={prevStep}
                                submitQuotation={submitQuotation}
                                isValid={true} // Add validation logic here
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
