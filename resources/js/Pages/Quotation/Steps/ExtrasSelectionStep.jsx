import React from 'react';
import ExtrasForm from '../Components/ExtrasForm';

export default function ExtrasSelectionStep({ 
    windows, 
    extras,
    updateWindow,
    currentWindow,
    setCurrentWindow,
    openModal
}) {
    const handleAddExtras = (index) => {
        setCurrentWindow(index);
        
        const content = (
            <ExtrasForm 
                windowData={windows[index]}
                extras={extras}
                onSave={(windowData) => {
                    updateWindow(index, windowData);
                    closeModal();
                }}
                onCancel={closeModal}
            />
        );
        
        openModal({
            title: `Add Extras: ${windows[index].room}`,
            content
        });
    };
    
    const closeModal = () => {
        openModal(null);
    };
    
    const getExtrasCount = (window) => {
        return window.extras?.length || 0;
    };
    
    const getTotalExtrasCost = (window) => {
        if (!window.extras || window.extras.length === 0) {
            return 0;
        }
        
        return window.extras.reduce((total, extra) => total + extra.cost, 0);
    };
    
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Extras Selection</h2>
            <p className="text-gray-600">Add optional extras to each window.</p>
            
            {windows.length > 0 ? (
                <div className="mt-4 space-y-4">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Extras</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Extra Cost</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {windows.map((window, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{window.room}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{window.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {getExtrasCount(window) > 0 ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                {getExtrasCount(window)} extras
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                None
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        £{getTotalExtrasCost(window).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            type="button"
                                            onClick={() => handleAddExtras(index)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            {getExtrasCount(window) > 0 ? 'Edit Extras' : 'Add Extras'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
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
