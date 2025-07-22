import React, { useEffect } from 'react';
import WindowConfigForm from '../Components/WindowConfigForm';
import { WindowConfigStepProps } from '@/types/wizard';

export default function WindowConfigStep({
  windows,
  windowTypes,
  finishes,
  updateWindow,
  currentWindow,
  setCurrentWindow,
  openModal,
  validateStep,
}: WindowConfigStepProps) {
  const handleConfigureWindow = (index: number) => {
    setCurrentWindow(index);

    const content = (
      <WindowConfigForm
        windowData={windows[index]}
        finishes={finishes}
        onSave={windowData => {
          updateWindow(index, windowData);
          closeModal();
        }}
        onCancel={closeModal}
      />
    );

    openModal({
      title: 'Configure Window',
      content,
    });
  };

  const closeModal = () => {
    openModal(null);
  };

  // Validation effect - check if all windows have required configuration
  useEffect(() => {
    if (validateStep) {
      // A window is considered configured if it has glass_specification, paint_finish, and hardware_finish
      const isValid =
        windows.length > 0 &&
        windows.every(
          window =>
            window.glass_specification &&
            window.paint_finish &&
            window.hardware_finish
        );
      validateStep(3, isValid);
    }
  }, [windows, validateStep]);

  return (
    <div className='space-y-6'>
      <h2 className='text-xl font-semibold'>Window Configuration</h2>
      <p className='text-gray-600'>
        Configure your windows with glass specifications and finishes.
      </p>

      {windows.length === 0 ? (
        <div className='text-center py-8 bg-gray-50 rounded-lg'>
          <p className='text-gray-500'>
            No windows added yet. Please add windows in the previous step.
          </p>
        </div>
      ) : (
        <div className='mt-4 space-y-4'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Room
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Type
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Glass
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Paint
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Hardware
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {windows.map((window, index) => (
                <tr key={index}>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {window.room}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {window.type}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {window.glass_specification || (
                      <span className='text-red-500'>Not set</span>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {window.paint_finish || (
                      <span className='text-red-500'>Not set</span>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {window.hardware_finish || (
                      <span className='text-red-500'>Not set</span>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-right'>
                    <button
                      type='button'
                      onClick={() => handleConfigureWindow(index)}
                      className='text-blue-600 hover:text-blue-900'
                    >
                      Configure
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
