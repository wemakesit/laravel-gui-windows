import React, { useState } from 'react';

export default function ExtrasForm({ windowData, extras, onSave, onCancel }) {
  console.log('ExtrasForm: Received extras data:', extras);
  console.log('ExtrasForm: Extras structure:', JSON.stringify(extras, null, 2));

  const [formData, setFormData] = useState(windowData);
  const [selectedExtras, setSelectedExtras] = useState(
    windowData.extras?.reduce((acc, extra) => {
      acc[extra.name] = true;
      return acc;
    }, {}) || {}
  );

  const handleExtraToggle = extra => {
    // Get the name field - handle both Name and name formats
    const extraName = extra.Name || extra.name || `extra_${Date.now()}`;
    console.log('ExtrasForm: Toggling extra with name:', extraName);

    const newSelectedExtras = { ...selectedExtras };

    if (newSelectedExtras[extraName]) {
      delete newSelectedExtras[extraName];
      console.log('ExtrasForm: Deselected extra:', extraName);
    } else {
      newSelectedExtras[extraName] = true;
      console.log('ExtrasForm: Selected extra:', extraName);
    }

    setSelectedExtras(newSelectedExtras);
    console.log('ExtrasForm: Updated selected extras:', newSelectedExtras);

    // Update the extras array in formData
    const newExtras = Object.keys(newSelectedExtras).map(name => {
      const extraData = extras.extras.find(e => (e.Name || e.name) === name);
      console.log('ExtrasForm: Found extra data for', name, ':', extraData);
      return {
        name,
        cost: extraData?.Cost || extraData?.cost || 0,
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
            {extras.extras
              .filter((extra, index, self) => {
                // Remove duplicates based on name
                const extraName = extra.Name || extra.name || `extra_${index}`;
                return self.findIndex(e => (e.Name || e.name) === extraName) === index;
              })
              .map((extra, index) => {
                console.log(`ExtrasForm: Extra ${index}:`, extra);
                console.log(`ExtrasForm: Extra Name field:`, extra.Name);
                console.log(`ExtrasForm: Extra name field:`, extra.name);
                console.log(`ExtrasForm: Extra Cost field:`, extra.Cost);
                console.log(`ExtrasForm: Extra cost field:`, extra.cost);
                console.log(`ExtrasForm: All extra keys:`, Object.keys(extra));

                const extraName = extra.Name || extra.name || `extra_${index}`;
                const uniqueId = `extra-${extraName.toLowerCase().replace(/[^a-z0-9]/g, '_')}-${index}`;
                console.log(`ExtrasForm: Using extraName:`, extraName);
                console.log(`ExtrasForm: Using uniqueId:`, uniqueId);

                return (
                  <div key={uniqueId} className='flex items-center'>
                    <input
                      id={uniqueId}
                      name={uniqueId}
                      type='checkbox'
                      checked={!!selectedExtras[extraName]}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleExtraToggle(extra)
                      }
                      className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                    />
                    <label
                      htmlFor={uniqueId}
                      className='ml-3 flex justify-between w-full'
                    >
                      <span className='text-sm font-medium text-gray-700'>
                        {extraName}
                      </span>
                      <span className='text-sm text-gray-500'>
                        £{(extra.Cost || extra.cost || 0).toFixed(2)}
                      </span>
                    </label>
                  </div>
                );
              })}
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
                  £{(extra.cost || 0).toFixed(2)}
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
                .reduce((total, extra) => total + (extra.cost || 0), 0)
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
