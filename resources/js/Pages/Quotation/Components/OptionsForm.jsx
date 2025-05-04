import React, { useState } from 'react';

export default function OptionsForm({ windowData, options, onSave, onCancel }) {
    const [formData, setFormData] = useState(windowData);
    const [selectedOptions, setSelectedOptions] = useState(
        Array.isArray(windowData.options) 
            ? windowData.options.reduce((acc, optionId) => {
                acc[optionId] = true;
                return acc;
              }, {})
            : windowData.options
                ? { [windowData.options]: true }
                : {}
    );
    
    const handleOptionToggle = (optionId) => {
        const newSelectedOptions = { ...selectedOptions };
        
        if (newSelectedOptions[optionId]) {
            delete newSelectedOptions[optionId];
        } else {
            newSelectedOptions[optionId] = true;
        }
        
        setSelectedOptions(newSelectedOptions);
        
        // Convert selected options to array for API
        const optionsArray = Object.keys(newSelectedOptions).map(id => parseInt(id, 10));
        
        // If only one option is selected, store it as a number, otherwise as an array
        const optionsValue = optionsArray.length === 1 ? optionsArray[0] : optionsArray;
        
        setFormData({
            ...formData,
            options: optionsValue
        });
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Available Options</h3>
                <p className="text-sm text-gray-500 mb-4">
                    Select which options this window should be included in. A window can be part of multiple options.
                </p>
                
                {options?.options?.length > 0 ? (
                    <div className="space-y-4">
                        {options.options.map((option, index) => (
                            <div key={index} className="flex items-center">
                                <input
                                    id={`option-${option.id}`}
                                    name={`option-${option.id}`}
                                    type="checkbox"
                                    checked={!!selectedOptions[option.id]}
                                    onChange={() => handleOptionToggle(option.id)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`option-${option.id}`} className="ml-3 flex flex-col">
                                    <span className="text-sm font-medium text-gray-700">{option.name}</span>
                                    {option.description && (
                                        <span className="text-xs text-gray-500">{option.description}</span>
                                    )}
                                </label>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No options available.</p>
                )}
            </div>
            
            {Object.keys(selectedOptions).length > 0 && (
                <div className="mt-6 bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Options</h4>
                    <ul className="space-y-2">
                        {Object.keys(selectedOptions).map((optionId) => {
                            const option = options.options.find(o => o.id === parseInt(optionId, 10));
                            return (
                                <li key={optionId} className="text-sm text-gray-600">
                                    {option ? option.name : `Option ${optionId}`}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
            
            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Save Options
                </button>
            </div>
        </form>
    );
}
