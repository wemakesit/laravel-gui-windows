import React, { useState } from 'react';

export default function CustomerInfoStep({ customerInfo, updateCustomerInfo }) {
    const [formData, setFormData] = useState(customerInfo);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        const updatedData = { ...formData, [name]: value };
        setFormData(updatedData);
        updateCustomerInfo(updatedData);
    };
    
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Customer Information</h2>
            <p className="text-gray-600">Please enter the customer's details for the quotation.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                    <select
                        id="title"
                        name="title"
                        value={formData.title || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="">Select a title</option>
                        <option value="Mr">Mr</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Miss">Miss</option>
                        <option value="Ms">Ms</option>
                        <option value="Dr">Dr</option>
                    </select>
                </div>
                
                <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={formData.first_name || ''}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                
                <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={formData.last_name || ''}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                
                <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea
                        id="address"
                        name="address"
                        value={formData.address || ''}
                        onChange={handleChange}
                        required
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                
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
        </div>
    );
}
