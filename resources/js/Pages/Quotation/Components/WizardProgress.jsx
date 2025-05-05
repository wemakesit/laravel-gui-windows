import React from 'react';

export default function WizardProgress({ currentStep, totalSteps, setCurrentStep, highestStepReached }) {
    const steps = [
        { number: 1, name: 'Customer Information' },
        { number: 2, name: 'Window Selection' },
        { number: 3, name: 'Window Configuration' },
        { number: 4, name: 'Extras Selection' },
        { number: 5, name: 'Options Selection' },
        { number: 6, name: 'Review & Generate' },
    ];

    const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

    const handleStepClick = (stepNumber) => {
        // Only allow navigation to steps that have been reached or previous steps
        if (stepNumber <= highestStepReached) {
            setCurrentStep(stepNumber);
        }
    };

    return (
        <div className="mb-8">
            <div className="relative">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                    <div
                        style={{ width: `${progressPercentage}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
                    ></div>
                </div>
                <div className="flex justify-between">
                    {steps.map((step) => (
                        <div
                            key={step.number}
                            className={`flex flex-col items-center ${currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'}`}
                        >
                            <button
                                type="button"
                                onClick={() => handleStepClick(step.number)}
                                disabled={step.number > highestStepReached}
                                className={`w-8 h-8 flex items-center justify-center rounded-full mb-2 ${
                                    currentStep > step.number
                                        ? 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700'
                                        : currentStep === step.number
                                            ? 'border-2 border-blue-600 text-blue-600 cursor-default'
                                            : step.number <= highestStepReached
                                                ? 'border-2 border-gray-300 text-gray-600 cursor-pointer hover:border-gray-400'
                                                : 'border-2 border-gray-300 text-gray-400 cursor-not-allowed'
                                } focus:outline-none transition-colors duration-200`}
                                aria-label={`Go to step ${step.number}: ${step.name}`}
                                title={step.number <= highestStepReached ? `Go to ${step.name}` : `Complete previous steps first`}
                            >
                                {currentStep > step.number ? (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    step.number
                                )}
                            </button>
                            <span className="text-xs font-medium hidden sm:block">{step.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
