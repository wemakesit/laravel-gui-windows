import React from 'react';
import OptionsForm from '../Components/OptionsForm';

export default function OptionsSelectionStep({
    windows,
    options,
    updateWindow,
    currentWindow,
    setCurrentWindow,
    openModal
}) {
    const handleConfigureOptions = (index) => {
        setCurrentWindow(index);

        const content = (
            <OptionsForm
                windowData={windows[index]}
                options={options}
                onSave={(windowData) => {
                    updateWindow(index, windowData);
                    closeModal();
                }}
                onCancel={closeModal}
            />
        );

        openModal({
            title: `Configure Options: ${windows[index].room}`,
            content
        });
    };

    const closeModal = () => {
        openModal(null);
    };

    const getOptionsCount = (window) => {
        if (Array.isArray(window.options)) {
            return window.options.length;
        }
        return window.options ? 1 : 0;
    };

    const getOptionsLabel = (window) => {
        // Default to option 1 if no options are set
        if (!window.options) {
            const defaultOption = options?.options?.find(o => o.id === 1);
            return defaultOption ? defaultOption.name : 'Standard Package';
        }

        const count = getOptionsCount(window);
        if (count === 0) {
            return 'No options selected';
        } else if (count === 1) {
            const optionId = Array.isArray(window.options) ? window.options[0] : window.options;
            const option = options?.options?.find(o => o.id === optionId);
            return option ? option.name : `Option ${optionId}`;
        } else {
            return `${count} options selected`;
        }
    };

    return (
        <div>
            <h2 className="text-lg font-medium text-gray-900">Configure Window Options</h2>
            <p className="mt-1 text-sm text-gray-500">
                Assign each window to one or more options. This allows you to create different combinations of windows for your quotation.
            </p>

            {windows.length > 0 ? (
                <div className="mt-4 space-y-4">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Options</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {windows.map((window, index) => {
                                const optionsCount = getOptionsCount(window);
                                const optionsLabel = getOptionsLabel(window);

                                return (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{window.room}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{window.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                optionsCount === 0
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-green-100 text-green-800'
                                            }`}>
                                                {optionsLabel}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                type="button"
                                                onClick={() => handleConfigureOptions(index)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Configure Options
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                No windows have been added yet. Please go back to the Window Selection step to add windows.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
