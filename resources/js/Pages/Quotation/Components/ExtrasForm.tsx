import React, { useState } from 'react';

export default function ExtrasForm({ windowData, extras, onSave, onCancel }) {
  const [formData, setFormData] = useState(windowData);
  const [selectedExtras, setSelectedExtras] = useState(
    windowData.extras?.reduce((acc, extra) => {
      acc[extra.name] = true;
      return acc;
    }, {}) || {}
  );

  const handleExtraToggle = extra => {
    const newSelectedExtras = { ...selectedExtras };

    if (newSelectedExtras[extra.Name]) {
      delete newSelectedExtras[extra.Name];
    } else {
      newSelectedExtras[extra.Name] = true;
    }

    setSelectedExtras(newSelectedExtras);

    // Update the extras array in formData
    const newExtras = Object.keys(newSelectedExtras).map(name => {
      const extraData = extras.extras.find(e => e.Name === name);
      return {
        name,
        cost: extraData.Cost,
      };
    });

    setFormData({
      ...formData,
      extras: newExtras,
    });
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Available Extras
        </h3>

        {extras?.extras?.length > 0 ? (
          <div className='space-y-4'>
            {extras.extras.map((extra, index) => (
              <div key={index} className='flex items-center'>
                <input
                  id={`extra-${index}`}
                  name={`extra-${index}`}
                  type='checkbox'
                  checked={!!selectedExtras[extra.Name]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleExtraToggle(extra)
                  }
                  className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <label
                  htmlFor={`extra-${index}`}
                  className='ml-3 flex justify-between w-full'
                >
                  <span className='text-sm font-medium text-gray-700'>
                    {extra.Name}
                  </span>
                  <span className='text-sm text-gray-500'>
                    £{extra.Cost.toFixed(2)}
                  </span>
                </label>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-gray-500'>No extras available.</p>
        )}
      </div>

      {formData.extras?.length > 0 && (
        <div className='mt-6 bg-gray-50 p-4 rounded-md'>
          <h4 className='text-sm font-medium text-gray-700 mb-2'>
            Selected Extras
          </h4>
          <ul className='space-y-2'>
            {formData.extras.map((extra, index) => (
              <li key={index} className='flex justify-between'>
                <span className='text-sm text-gray-600'>{extra.name}</span>
                <span className='text-sm font-medium text-gray-900'>
                  £{extra.cost.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <div className='mt-4 pt-4 border-t border-gray-200 flex justify-between'>
            <span className='text-sm font-medium text-gray-700'>
              Total Extras Cost:
            </span>
            <span className='text-sm font-medium text-gray-900'>
              £
              {formData.extras
                .reduce((total, extra) => total + extra.cost, 0)
                .toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <div className='flex justify-end space-x-3'>
        <button
          type='button'
          onClick={onCancel}
          className='px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        >
          Cancel
        </button>
        <button
          type='submit'
          className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        >
          Save Extras
        </button>
      </div>
    </form>
  );
}
