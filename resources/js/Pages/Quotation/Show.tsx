import React from "react";
import { Head, Link } from '@inertiajs/react';

interface QuotationShowProps {
    quotation: {
        id: number;
        reference_number: string;
        customer_name: string;
        customer_email: string;
        customer_phone: string;
        customer_address: string;
        additional_info?: string;
        window_count: number;
        total_amount: number;
        created_at: string;
        has_file: boolean;
    };
}

export default function Show({ quotation }: QuotationShowProps) {
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
                                        Back to Quotations
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
                                        Load Quotation
                                    </Link>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-lg mb-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Quotation Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Reference Number</p>
                                        <p className="text-base text-gray-900">{quotation.reference_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Date Created</p>
                                        <p className="text-base text-gray-900">{quotation.created_at}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Number of Windows</p>
                                        <p className="text-base text-gray-900">{quotation.window_count}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Total Amount</p>
                                        <p className="text-base text-gray-900">£{parseFloat(String(quotation.total_amount)).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-lg">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Name</p>
                                        <p className="text-base text-gray-900">{quotation.customer_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Email</p>
                                        <p className="text-base text-gray-900">{quotation.customer_email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Phone</p>
                                        <p className="text-base text-gray-900">{quotation.customer_phone}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-sm font-medium text-gray-500">Address</p>
                                        <p className="text-base text-gray-900">{quotation.customer_address}</p>
                                    </div>
                                    {quotation.additional_info && (
                                        <div className="md:col-span-2">
                                            <p className="text-sm font-medium text-gray-500">Additional Information</p>
                                            <p className="text-base text-gray-900">{quotation.additional_info}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
