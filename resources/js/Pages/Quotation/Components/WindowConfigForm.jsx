import React, { useState } from 'react';

export default function WindowConfigForm({ windowData, finishes, onSave, onCancel }) {
    const [formData, setFormData] = useState(windowData);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
                <div>
                    <label htmlFor="glass_specification" className="block text-sm font-medium text-gray-700">Glass Specification</label>
                    <select
                        id="glass_specification"
                        name="glass_specification"
                        value={formData.glass_specification || ''}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="">Select glass specification</option>
                        {finishes?.glass_specifications?.map((spec, index) => (
                            <option key={index} value={spec}>{spec}</option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label htmlFor="paint_finish" className="block text-sm font-medium text-gray-700">Paint Finish</label>
                    <select
                        id="paint_finish"
                        name="paint_finish"
                        value={formData.paint_finish || ''}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="">Select paint finish</option>
                        {finishes?.paint_finishes?.map((finish, index) => (
                            <option key={index} value={finish}>{finish}</option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label htmlFor="hardware_finish" className="block text-sm font-medium text-gray-700">Hardware Finish</label>
                    <select
                        id="hardware_finish"
                        name="hardware_finish"
                        value={formData.hardware_finish || ''}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="">Select hardware finish</option>
                        {finishes?.hardware_finishes?.map((finish, index) => (
                            <option key={index} value={finish.name}>{finish.name}</option>
                        ))}
                    </select>
                </div>
                
                {formData.hardware_finish && finishes?.hardware_finishes && (
                    <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Hardware Preview</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {finishes.hardware_finishes
                                .find(f => f.name === formData.hardware_finish)
                                ?.images?.sash?.map((image, index) => (
                                    <div key={index} className="border rounded-md p-2">
                                        <img 
                                            src={image} 
                                            alt={`${formData.hardware_finish} hardware`} 
                                            className="w-full h-auto"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Available';
                                            }}
                                        />
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>
            
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
                    Save Configuration
                </button>
            </div>
        </form>
    );
}
