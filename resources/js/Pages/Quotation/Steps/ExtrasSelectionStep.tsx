import React from 'react';
import ExtrasForm from '../Components/ExtrasForm';

interface ExtrasSelectionStepProps {
  windows: any[];
  extras: any[];
  updateWindow: (index: number, window: any) => void;
  currentWindow: number | null;
  setCurrentWindow: (index: number | null) => void;
  openModal: (modalData: any) => void;
}

export default function ExtrasSelectionStep({
  windows,
  extras,
  updateWindow,
  currentWindow,
  setCurrentWindow,
  openModal,
}: ExtrasSelectionStepProps) {
  const handleAddExtras = (index: number) => {
    setCurrentWindow(index);

    const content = (
      <ExtrasForm
        windowData={windows[index]}
        extras={extras}
        onSave={windowData => {
          updateWindow(index, windowData);
          closeModal();
        }}
        onCancel={closeModal}
      />
    );

    openModal({
      title: 'Add Extras to Window',
      content,
    });
  };

  const closeModal = () => {
    openModal(null);
  };

  // Calculate total extras cost for a window
  const calculateExtrasTotal = window => {
    if (!window.extras || !Array.isArray(window.extras)) return 0;
    return window.extras.reduce((total, extra) => total + (extra.cost || 0), 0);
  };

  return (
    <div className='space-y-6'>
      <h2 className='text-xl font-semibold'>Extras Selection</h2>
      <p className='text-gray-600'>Add extras to your windows.</p>

      {windows.length === 0 ? (
        <div className='text-center py-8 bg-gray-50 rounded-lg'>
          <p className='text-gray-500'>
            No windows added yet. Please add windows in the previous steps.
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
                  Extras
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Cost
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
                  <td className='px-6 py-4 text-sm text-gray-900'>
                    {window.extras && window.extras.length > 0 ? (
                      <ul className='list-disc pl-5'>
                        {window.extras.map((extra, extraIndex) => (
                          <li key={extraIndex}>{extra.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className='text-gray-500'>No extras added</span>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    £{calculateExtrasTotal(window).toFixed(2)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-right'>
                    <button
                      type='button'
                      onClick={() => handleAddExtras(index)}
                      className='text-blue-600 hover:text-blue-900'
                    >
                      {window.extras && window.extras.length > 0
                        ? 'Edit Extras'
                        : 'Add Extras'}
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
