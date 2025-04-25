import React from 'react';

export default function WizardNavigation({ 
    currentStep, 
    totalSteps, 
    nextStep, 
    prevStep, 
    submitQuotation,
    isValid 
}) {
    return (
        <div className="mt-8 flex justify-between">
            <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-4 py-2 rounded-md ${
                    currentStep === 1
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
                Previous
            </button>
            
            {currentStep < totalSteps ? (
                <button
                    type="button"
                    onClick={nextStep}
                    disabled={!isValid}
                    className={`px-4 py-2 rounded-md ${
                        !isValid
                            ? 'bg-blue-300 text-white cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    Next
                </button>
            ) : (
                <button
                    type="button"
                    onClick={submitQuotation}
                    disabled={!isValid}
                    className={`px-4 py-2 rounded-md ${
                        !isValid
                            ? 'bg-green-300 text-white cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                    Generate Quotation
                </button>
            )}
        </div>
    );
}
