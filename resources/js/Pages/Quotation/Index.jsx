import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';

export default function Index({ quotations }) {
    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this quotation?')) {
            router.delete(route('quotations.destroy', id));
        }
    };

    return (
        <>
            <Head title="Window Quotations" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-2xl font-semibold">Window Quotations</h1>
                                <div className="flex space-x-2">
                                    <Link
                                        href={route('settings.index')}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                                    >
                                        Settings
                                    </Link>
                                    <Link
                                        href={route('quotations.create')}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Create New Quotation
                                    </Link>
                                </div>
                            </div>

                            {quotations.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 mb-4">No quotations found.</p>
                                    <p className="text-gray-500">
                                        Get started by creating your first window quotation.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Reference
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Customer
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Windows
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Total
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {quotations.map((quotation) => (
                                                <tr key={quotation.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Link
                                                            href={route('quotations.show', quotation.id)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            {quotation.reference_number}
                                                        </Link>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {quotation.customer_name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {quotation.created_at}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {quotation.window_count}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        £{parseFloat(quotation.total_amount).toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end space-x-2">
                                                            <Link
                                                                href={route('quotations.show', quotation.id)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                            >
                                                                View
                                                            </Link>
                                                            {quotation.has_file && (
                                                                <Link
                                                                    href={route('quotations.download', quotation.id)}
                                                                    className="text-green-600 hover:text-green-900"
                                                                >
                                                                    Download
                                                                </Link>
                                                            )}
                                                            <Link
                                                                href={route('quotations.load', quotation.id)}
                                                                className="text-blue-600 hover:text-blue-900"
                                                            >
                                                                Load
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDelete(quotation.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
