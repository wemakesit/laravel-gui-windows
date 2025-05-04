import React from 'react';
import { Head, Link } from '@inertiajs/react';

export default function Show({ quotation }) {
    const formatCurrency = (amount) => {
        return '£' + parseFloat(amount).toFixed(2);
    };

    return (
        <>
            <Head title={`Quotation ${quotation.reference_number}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-2xl font-semibold">Quotation Details</h1>
                                <div className="flex space-x-2">
                                    <Link
                                        href={route('quotations.index')}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                    >
                                        Back to List
                                    </Link>
                                    {quotation.has_file && (
                                        <Link
                                            href={route('quotations.download', quotation.id)}
                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                        >
                                            Download PDF
                                        </Link>
                                    )}
                                    <Link
                                        href={route('quotations.load', quotation.id)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Load in Wizard
                                    </Link>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h2 className="text-lg font-medium mb-4">Quotation Information</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Reference Number</p>
                                            <p className="font-medium">{quotation.reference_number}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Date Created</p>
                                            <p className="font-medium">{quotation.created_at}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Total Windows</p>
                                            <p className="font-medium">{quotation.window_count}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Total Amount</p>
                                            <p className="font-medium">{formatCurrency(quotation.total_amount)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h2 className="text-lg font-medium mb-4">Customer Information</h2>
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-sm text-gray-500">Name</p>
                                            <p className="font-medium">{quotation.customer_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Email</p>
                                            <p className="font-medium">{quotation.customer_email}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Phone</p>
                                            <p className="font-medium">{quotation.customer_phone}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Address</p>
                                            <p className="font-medium">{quotation.customer_address}</p>
                                        </div>
                                        {quotation.additional_info && (
                                            <div>
                                                <p className="text-sm text-gray-500">Additional Information</p>
                                                <p className="font-medium">{quotation.additional_info}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h2 className="text-lg font-medium mb-4">Windows</h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Room
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Type
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Quantity
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Glass
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Finish
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Cost
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {quotation.quotation_data.windows.map((window, index) => (
                                                <tr key={index}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {window.room}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {window.type}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {window.quantity || 1}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {window.glass_specification}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {window.paint_finish}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        {formatCurrency(window.cost * (window.quantity || 1))}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
