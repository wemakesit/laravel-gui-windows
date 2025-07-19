import React from 'react';
import { usePWA } from '../../../Hooks/usePWA';

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  submitEstimate: () => void;
  isValid: boolean;
}

export default function WizardNavigation({
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  submitEstimate,
  isValid,
}: WizardNavigationProps) {
  const { canGenerateEstimate } = usePWA();
  return (
    <div className='mt-8 flex justify-between'>
      <button
        type='button'
        onClick={prevStep}
        className={`px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        disabled={currentStep === 1}
      >
        Previous
      </button>

      <div>
        {currentStep === totalSteps ? (
          <button
            type='button'
            onClick={submitEstimate}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              !isValid ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={!isValid}
          >
            {canGenerateEstimate ? 'Generate Estimate' : 'Save Offline'}
          </button>
        ) : (
          <button
            type='button'
            onClick={nextStep}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              !isValid ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={!isValid}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
