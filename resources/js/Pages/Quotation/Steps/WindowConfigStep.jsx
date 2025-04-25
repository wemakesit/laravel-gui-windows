import React from 'react';
import WindowConfigForm from '../Components/WindowConfigForm';

export default function WindowConfigStep({ 
    windows, 
    windowTypes, 
    finishes,
    updateWindow,
    currentWindow,
    setCurrentWindow,
    openModal
}) {
    const handleConfigureWindow = (index) => {
        setCurrentWindow(index);
        
        const content = (
            <WindowConfigForm 
                windowData={windows[index]}
                finishes={finishes}
                onSave={(windowData) => {
                    updateWindow(index, windowData);
                    closeModal();
                }}
                onCancel={closeModal}
            />
        );
        
        openModal({
            title: `Configure Window: ${windows[index].room}`,
            content
        });
    };
    
    const closeModal = () => {
        openModal(null);
    };
    
    const getConfigStatus = (window) => {
        const requiredFields = ['glass_specification', 'paint_finish', 'hardware_finish'];
        const missingFields = requiredFields.filter(field => !window[field]);
        
        if (missingFields.length === 0) {
            return {
                status: 'complete',
                label: 'Configured',
                color: 'green'
            };
        } else if (missingFields.length === requiredFields.length) {
            return {
                status: 'not-started',
                label: 'Not Configured',
                color: 'red'
            };
        } else {
            return {
                status: 'in-progress',
                label: 'Partially Configured',
                color: 'yellow'
            };
        }
    };
    
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Window Configuration</h2>
            <p className="text-gray-600">Configure the finishes for each window.</p>
            
            {windows.length > 0 ? (
                <div className="mt-4 space-y-4">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {windows.map((window, index) => {
                                const status = getConfigStatus(window);
                                
                                return (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{window.room}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{window.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${status.color}-100 text-${status.color}-800`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                type="button"
                                                onClick={() => handleConfigureWindow(index)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Configure
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No windows added yet. Please go back to add windows.</p>
                </div>
            )}
        </div>
    );
}
