import React from "react";
import OptionsForm from "../Components/OptionsForm";

interface OptionsSelectionStepProps {
    windows: any[];
    options: any[];
    updateWindow: (index: number, window: any) => void;
    currentWindow: number | null;
    setCurrentWindow: (index: number | null) => void;
    openModal: (modalData: any) => void;
}

export default function OptionsSelectionStep({
    windows,
    options,
    updateWindow,
    currentWindow,
    setCurrentWindow,
    openModal
}: OptionsSelectionStepProps) {
    const handleSetOptions = (index: number) => {
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
            title: 'Set Options for Window',
            content
        });
    };

    const closeModal = () => {
        openModal(null);
    };

    // Helper function to get option names from option IDs
    const getOptionNames = (window) => {
        if (!window.options) return 'None';

        // Handle both array and single value formats
        const optionIds = Array.isArray(window.options) ? window.options : [window.options];

        return optionIds.map(id => {
            // Check if options is an array or an object with options property
            let optionsArray: any[] = [];

            if (Array.isArray(options)) {
                optionsArray = options;
            } else if (options && typeof options === 'object') {
                // Use type assertion to tell TypeScript this is an object with an options property
                const optionsObj = options as { options?: any[] };
                if (optionsObj.options && Array.isArray(optionsObj.options)) {
                    optionsArray = optionsObj.options;
                }
            }

            const option = optionsArray.find(o => o.id === id);
            return option ? option.name : `Option ${id}`;
        }).join(', ');
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Options Selection</h2>
            <p className="text-gray-600">Assign windows to different options.</p>

            {windows.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No windows added yet. Please add windows in the previous steps.</p>
                </div>
            ) : (
                <div className="mt-4 space-y-4">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    Options allow you to create different combinations of windows in your quotation.
                                    Each window can be assigned to one or more options.
                                </p>
                            </div>
                        </div>
                    </div>

                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Options</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {windows.map((window, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{window.room}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{window.type}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {getOptionNames(window)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                        <button
                                            type="button"
                                            onClick={() => handleSetOptions(index)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            Set Options
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
