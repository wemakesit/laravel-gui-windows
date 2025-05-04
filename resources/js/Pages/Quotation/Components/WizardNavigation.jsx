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
                    className={`px-4 py-2 rounded-md flex items-center ${
                        !isValid
                            ? 'bg-green-300 text-white cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                    {!isValid && currentStep === totalSteps && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    Generate Quotation
                </button>
            )}
        </div>
    );
}
