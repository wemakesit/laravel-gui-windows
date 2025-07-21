import React from 'react';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  setCurrentStep: (step: number) => void;
  highestStepReached: number;
}

export default function WizardProgress({
  currentStep,
  totalSteps,
  setCurrentStep,
  highestStepReached,
}: WizardProgressProps) {
  const steps = [
    { number: 1, name: 'Customer Info' },
    { number: 2, name: 'Window Selection' },
    { number: 3, name: 'Window Config' },
    { number: 4, name: 'Extras' },
    { number: 5, name: 'Review' },
  ];

  return (
    <div className='py-4'>
      <div className='flex items-center justify-between'>
        {steps.map(step => (
          <div key={step.number} className='flex flex-col items-center'>
            <button
              onClick={() =>
                step.number <= highestStepReached && setCurrentStep(step.number)
              }
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm ${
                step.number === currentStep
                  ? 'bg-blue-600 text-white'
                  : step.number < currentStep
                    ? 'bg-blue-200 text-blue-800'
                    : step.number <= highestStepReached
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              disabled={step.number > highestStepReached}
            >
              {step.number}
            </button>
            <span
              className={`mt-2 text-xs ${
                step.number === currentStep
                  ? 'text-blue-600 font-medium'
                  : 'text-gray-500'
              }`}
            >
              {step.name}
            </span>
          </div>
        ))}
      </div>

      <div className='relative mt-2'>
        <div className='absolute inset-0 flex items-center' aria-hidden='true'>
          <div className='h-0.5 w-full bg-gray-200'></div>
        </div>
        <div className='relative flex justify-between'>
          {steps.map(step => (
            <div
              key={step.number}
              className={`w-5 h-0.5 ${
                step.number <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
