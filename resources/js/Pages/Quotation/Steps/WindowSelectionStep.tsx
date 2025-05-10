import React, { useState } from 'react';
import WindowForm from '../Components/WindowForm';

interface Window {
    room: string;
    type: string;
    quantity: number;
    cost: number;
    glass_specification?: string;
    paint_finish?: string;
    hardware_finish?: string;
    extras?: any[];
    options?: number;
    additional_info?: string;
    [key: string]: any;
}

interface WindowType {
    Type: string;
    Description?: string;
    Cost?: number;
    BasePrice?: number;
}

interface WindowSelectionStepProps {
    windows: Window[];
    windowTypes: WindowType[];
    addWindow: (window: Window) => void;
    updateWindow: (index: number, window: Window) => void;
    removeWindow: (index: number) => void;
    openModal: (modalData: any) => void;
    setCurrentWindow: (index: number | null) => void;
}

export default function WindowSelectionStep({
    windows,
    windowTypes,
    addWindow,
    updateWindow,
    removeWindow,
    openModal,
    setCurrentWindow
}: WindowSelectionStepProps) {
    const handleAddWindow = () => {
        setCurrentWindow(null);

        const content = (
            <WindowForm
                windowTypes={{ window_types: windowTypes }}
                onSave={(windowData) => {
                    addWindow(windowData);
                    closeModal();
                }}
                onCancel={closeModal}
            />
        );

        openModal({
            title: 'Add New Window',
            content
        });
    };

    const handleEditWindow = (index: number) => {
        setCurrentWindow(index);

        const content = (
            <WindowForm
                windowData={windows[index]}
                windowTypes={{ window_types: windowTypes }}
                onSave={(windowData) => {
                    updateWindow(index, windowData);
                    closeModal();
                }}
                onCancel={closeModal}
            />
        );

        openModal({
            title: 'Edit Window',
            content
        });
    };

    const closeModal = () => {
        openModal(null);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Window Selection</h2>
            <p className="text-gray-600">Add windows to your quotation.</p>

            {windows.length > 0 ? (
                <div className="mt-4 space-y-4">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {windows.map((window, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{window.room}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{window.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{window.quantity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            type="button"
                                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleEditWindow(index)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => removeWindow(index)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No windows added yet.</p>
                </div>
            )}

            <div className="mt-6">
                <button
                    type="button"
                    onClick={handleAddWindow}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Window
                </button>
            </div>
        </div>
    );
}
