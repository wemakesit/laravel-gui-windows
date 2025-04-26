import React, { useState, useEffect } from 'react';

export default function WindowForm({ windowData, windowTypes, onSave, onCancel }) {
    const defaultWindow = {
        room: '',
        type: '',
        quantity: 1,
        glass_specification: '',
        paint_finish: '',
        hardware_finish: '',
        cost: 0,
        extras: [],
        additional_info: ''
    };

    const [formData, setFormData] = useState(windowData || defaultWindow);
    const [selectedType, setSelectedType] = useState(null);

    useEffect(() => {
        if (formData.type && windowTypes?.window_types) {
            const type = windowTypes.window_types.find(t => t.Type === formData.type);
            if (type) {
                setSelectedType(type);
                if (!windowData) {
                    setFormData(prev => ({
                        ...prev,
                        cost: type.Cost || type.BasePrice || 0
                    }));
                }
            }
        }
    }, [formData.type, windowTypes, windowData]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'type' && windowTypes?.window_types) {
            const type = windowTypes.window_types.find(t => t.Type === value);
            if (type) {
                setFormData({
                    ...formData,
                    type: value,
                    cost: type.Cost || type.BasePrice || 0
                });
            } else {
                setFormData({
                    ...formData,
                    type: value
                });
            }
        } else if (name === 'quantity') {
            setFormData({
                ...formData,
                quantity: parseInt(value, 10) || 1
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="room" className="block text-sm font-medium text-gray-700">Room</label>
                    <input
                        type="text"
                        id="room"
                        name="room"
                        value={formData.room}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Window Type</label>
                    <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="">Select a window type</option>
                        {windowTypes?.window_types?.map((type, index) => (
                            <option key={index} value={type.Type}>
                                {type.Type} - £{type.Cost ? type.Cost.toFixed(2) : (type.BasePrice ? type.BasePrice.toFixed(2) : '0.00')}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        min="1"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                {selectedType && (
                    <div className="md:col-span-2">
                        <div className="bg-gray-50 p-4 rounded-md">
                            <h3 className="font-medium text-gray-900">{selectedType.Type}</h3>
                            <p className="text-gray-600 mt-1">{selectedType.Description || 'No description available'}</p>
                            <p className="text-gray-900 mt-2">Price: £{selectedType.Cost ? selectedType.Cost.toFixed(2) : (selectedType.BasePrice ? selectedType.BasePrice.toFixed(2) : '0.00')}</p>
                        </div>
                    </div>
                )}

                <div className="md:col-span-2">
                    <label htmlFor="additional_info" className="block text-sm font-medium text-gray-700">Additional Information</label>
                    <textarea
                        id="additional_info"
                        name="additional_info"
                        value={formData.additional_info || ''}
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
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
                    Save Window
                </button>
            </div>
        </form>
    );
}
