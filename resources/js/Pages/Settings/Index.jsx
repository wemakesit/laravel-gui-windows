import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Tab } from '@headlessui/react';
import axios from 'axios';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Index({ apiDocs, companyInfo, windowTypes, extras, finishes, pdfTextConfig }) {
    const [selectedTab, setSelectedTab] = useState(0);
    const [apiBaseUrl, setApiBaseUrl] = useState(apiDocs?.apiBaseUrl || 'http://localhost:8001');
    const [apiStatus, setApiStatus] = useState(null);

    // Confirmation modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmationType, setConfirmationType] = useState(null); // 'company_info', 'window_types', 'extras', 'finishes', 'pdf_text'

    // Initialize forms for each configuration section
    const companyInfoForm = useForm({
        name: companyInfo?.name || '',
        address: {
            line1: companyInfo?.address?.line1 || '',
            line2: companyInfo?.address?.line2 || '',
            country: companyInfo?.address?.country || '',
        },
        contact: {
            phone: companyInfo?.contact?.phone || '',
            email: companyInfo?.contact?.email || '',
            website: companyInfo?.contact?.website || '',
        },
        registration: {
            company_number: companyInfo?.registration?.company_number || '',
            vat_number: companyInfo?.registration?.vat_number || '',
        },
    });

    // Window types form
    const windowTypesForm = useForm({
        window_types: windowTypes || [],
    });

    // Extras form
    const extrasForm = useForm({
        extras: extras || [],
    });

    // Finishes form
    const finishesForm = useForm({
        finishes: finishes || [],
    });

    // Form for API base URL
    const apiUrlForm = useForm({
        baseUrl: apiBaseUrl,
    });

    // Check API status
    const checkApiStatus = async () => {
        try {
            const response = await axios.get('/api/health');
            setApiStatus(response.data);
        } catch (error) {
            setApiStatus({ status: 'error', message: error.message });
        }
    };

    // Handle form submissions
    const openConfirmModal = (type) => {
        setConfirmationType(type);
        setShowConfirmModal(true);
    };

    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setConfirmationType(null);
    };

    const handleConfirm = () => {
        if (confirmationType === 'company_info') {
            companyInfoForm.post(route('settings.update-company-info'), {
                onSuccess: () => {
                    closeConfirmModal();
                    // Could add a success notification here
                },
            });
        } else if (confirmationType === 'window_types') {
            // Handle window types update
            windowTypesForm.post(route('settings.update-window-types'), {
                onSuccess: () => {
                    closeConfirmModal();
                },
            });
        } else if (confirmationType === 'extras') {
            // Handle extras update
            extrasForm.post(route('settings.update-extras'), {
                onSuccess: () => {
                    closeConfirmModal();
                },
            });
        } else if (confirmationType === 'finishes') {
            // Handle finishes update
            finishesForm.post(route('settings.update-finishes'), {
                onSuccess: () => {
                    closeConfirmModal();
                },
            });
        }
    };

    const submitCompanyInfo = (e) => {
        e.preventDefault();
        openConfirmModal('company_info');
    };

    const submitWindowTypes = (e) => {
        e.preventDefault();
        openConfirmModal('window_types');
    };

    const submitExtras = (e) => {
        e.preventDefault();
        openConfirmModal('extras');
    };

    const submitFinishes = (e) => {
        e.preventDefault();
        openConfirmModal('finishes');
    };

    return (
        <>
            <Head title="Settings" />

            {/* Confirmation Modal */}
            <Modal show={showConfirmModal} onClose={closeConfirmModal} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                        Confirm Update
                    </h2>

                    <p className="mb-6 text-sm text-gray-600">
                        {confirmationType === 'company_info' && 'Are you sure you want to update the company information?'}
                        {confirmationType === 'window_types' && 'Are you sure you want to update the window types?'}
                        {confirmationType === 'extras' && 'Are you sure you want to update the extras?'}
                        {confirmationType === 'finishes' && 'Are you sure you want to update the finishes?'}
                        {confirmationType === 'pdf_text' && 'Are you sure you want to update the PDF text configuration?'}
                    </p>

                    <div className="mt-6 flex justify-end space-x-3">
                        <SecondaryButton onClick={closeConfirmModal}>
                            Cancel
                        </SecondaryButton>

                        <PrimaryButton onClick={handleConfirm}>
                            Confirm
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-2xl font-semibold">Settings</h1>
                                <Link
                                    href={route('quotations.index')}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                                >
                                    Back to Quotations
                                </Link>
                            </div>

                            <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                                <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
                                    <Tab
                                        className={({ selected }) =>
                                            `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                                            ${
                                                selected
                                                    ? 'bg-white text-blue-700 shadow'
                                                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                                            }`
                                        }
                                    >
                                        API Documentation
                                    </Tab>
                                    <Tab
                                        className={({ selected }) =>
                                            `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                                            ${
                                                selected
                                                    ? 'bg-white text-blue-700 shadow'
                                                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                                            }`
                                        }
                                    >
                                        Company Info
                                    </Tab>
                                    <Tab
                                        className={({ selected }) =>
                                            `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                                            ${
                                                selected
                                                    ? 'bg-white text-blue-700 shadow'
                                                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                                            }`
                                        }
                                    >
                                        Window Types
                                    </Tab>
                                    <Tab
                                        className={({ selected }) =>
                                            `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                                            ${
                                                selected
                                                    ? 'bg-white text-blue-700 shadow'
                                                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                                            }`
                                        }
                                    >
                                        Extras
                                    </Tab>
                                    <Tab
                                        className={({ selected }) =>
                                            `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                                            ${
                                                selected
                                                    ? 'bg-white text-blue-700 shadow'
                                                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                                            }`
                                        }
                                    >
                                        Finishes
                                    </Tab>
                                    <Tab
                                        className={({ selected }) =>
                                            `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                                            ${
                                                selected
                                                    ? 'bg-white text-blue-700 shadow'
                                                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                                            }`
                                        }
                                    >
                                        PDF Text
                                    </Tab>
                                </Tab.List>
                                <Tab.Panels>
                                    {/* API Documentation Panel */}
                                    <Tab.Panel>
                                        <div className="rounded-xl bg-white p-3">
                                            <h2 className="text-xl font-semibold mb-4">API Documentation</h2>

                                            <div className="mb-6">
                                                <h3 className="text-lg font-medium mb-2">API Configuration</h3>
                                                <div className="bg-gray-50 p-4 rounded-lg border">
                                                    <p className="mb-2">
                                                        The API is currently configured to run at:{' '}
                                                        <code className="bg-gray-100 px-1 py-0.5 rounded">
                                                            {apiBaseUrl}
                                                        </code>
                                                    </p>
                                                    <div className="mt-4">
                                                        <a
                                                            href={apiDocs?.url || `${apiBaseUrl}/docs`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                                        >
                                                            Open API Documentation in New Tab
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6">
                                                <h3 className="text-lg font-medium mb-2">API Endpoints</h3>
                                                <div className="bg-gray-50 p-4 rounded-lg border">
                                                    <ul className="space-y-2">
                                                        <li>
                                                            <strong>Company Info:</strong> <code>{apiBaseUrl}/api/v1/config/company_info</code>
                                                        </li>
                                                        <li>
                                                            <strong>Window Types:</strong> <code>{apiBaseUrl}/api/v1/config/window_types</code>
                                                        </li>
                                                        <li>
                                                            <strong>Extras:</strong> <code>{apiBaseUrl}/api/v1/config/extras</code>
                                                        </li>
                                                        <li>
                                                            <strong>Finishes:</strong> <code>{apiBaseUrl}/api/v1/config/finishes</code>
                                                        </li>
                                                        <li>
                                                            <strong>PDF Text Config:</strong> <code>{apiBaseUrl}/api/v1/config/pdf_text_config</code>
                                                        </li>
                                                        <li>
                                                            <strong>Generate Quotation:</strong> <code>{apiBaseUrl}/api/v1/quotations</code>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </Tab.Panel>

                                    {/* Company Info Panel */}
                                    <Tab.Panel>
                                        <div className="rounded-xl bg-white p-3">
                                            <h2 className="text-xl font-semibold mb-4">Company Information</h2>

                                            <form onSubmit={submitCompanyInfo}>
                                                <div className="grid grid-cols-1 gap-6 mt-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Company Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="name"
                                                            id="name"
                                                            value={companyInfoForm.data.name}
                                                            onChange={(e) => companyInfoForm.setData('name', e.target.value)}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                        />
                                                        {companyInfoForm.errors.name && (
                                                            <p className="text-red-500 text-xs mt-1">{companyInfoForm.errors.name}</p>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700">
                                                                Address Line 1
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="address.line1"
                                                                id="address_line1"
                                                                value={companyInfoForm.data.address.line1}
                                                                onChange={(e) => companyInfoForm.setData('address.line1', e.target.value)}
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                            />
                                                            {companyInfoForm.errors['address.line1'] && (
                                                                <p className="text-red-500 text-xs mt-1">{companyInfoForm.errors['address.line1']}</p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700">
                                                                Address Line 2
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="address.line2"
                                                                id="address_line2"
                                                                value={companyInfoForm.data.address.line2}
                                                                onChange={(e) => companyInfoForm.setData('address.line2', e.target.value)}
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                            />
                                                            {companyInfoForm.errors['address.line2'] && (
                                                                <p className="text-red-500 text-xs mt-1">{companyInfoForm.errors['address.line2']}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mt-6">
                                                        <button
                                                            type="submit"
                                                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                            disabled={companyInfoForm.processing}
                                                        >
                                                            {companyInfoForm.processing ? 'Saving...' : 'Save Company Info'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </Tab.Panel>

                                    {/* Other panels will be implemented similarly */}
                                    <Tab.Panel>
                                        <div className="rounded-xl bg-white p-3">
                                            <h2 className="text-xl font-semibold mb-4">Window Types</h2>

                                            <form onSubmit={submitWindowTypes}>
                                                <div className="grid grid-cols-1 gap-6 mt-4">
                                                    {/* Window types form fields would go here */}
                                                    <p className="text-gray-500 mb-4">Configure window types and their pricing here.</p>

                                                    {/* Example of window types form fields */}
                                                    <div className="border rounded-md p-4">
                                                        <h3 className="font-medium mb-2">Window Types Configuration</h3>
                                                        <p className="text-sm text-gray-500 mb-4">
                                                            Add, edit, or remove window types that will be available in quotations.
                                                        </p>

                                                        {/* This would typically be a dynamic list of window types */}
                                                        <div className="space-y-4">
                                                            {windowTypes && windowTypes.length > 0 ? (
                                                                windowTypes.map((type, index) => (
                                                                    <div key={index} className="border-b pb-4">
                                                                        <p><strong>Name:</strong> {type.name}</p>
                                                                        <p><strong>Description:</strong> {type.description}</p>
                                                                        <p><strong>Base Price:</strong> £{type.base_price}</p>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p>No window types configured yet.</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mt-6">
                                                        <button
                                                            type="submit"
                                                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                            disabled={windowTypesForm.processing}
                                                        >
                                                            {windowTypesForm.processing ? 'Saving...' : 'Save Window Types'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </Tab.Panel>

                                    <Tab.Panel>
                                        <div className="rounded-xl bg-white p-3">
                                            <h2 className="text-xl font-semibold mb-4">Extras</h2>

                                            <form onSubmit={submitExtras}>
                                                <div className="grid grid-cols-1 gap-6 mt-4">
                                                    {/* Extras form fields would go here */}
                                                    <p className="text-gray-500 mb-4">Configure additional options and extras for windows.</p>

                                                    {/* Example of extras form fields */}
                                                    <div className="border rounded-md p-4">
                                                        <h3 className="font-medium mb-2">Extras Configuration</h3>
                                                        <p className="text-sm text-gray-500 mb-4">
                                                            Add, edit, or remove extras that can be added to windows in quotations.
                                                        </p>

                                                        {/* This would typically be a dynamic list of extras */}
                                                        <div className="space-y-4">
                                                            {extras && extras.length > 0 ? (
                                                                extras.map((extra, index) => (
                                                                    <div key={index} className="border-b pb-4">
                                                                        <p><strong>Name:</strong> {extra.name}</p>
                                                                        <p><strong>Description:</strong> {extra.description}</p>
                                                                        <p><strong>Price:</strong> £{extra.price}</p>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p>No extras configured yet.</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mt-6">
                                                        <button
                                                            type="submit"
                                                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                            disabled={extrasForm.processing}
                                                        >
                                                            {extrasForm.processing ? 'Saving...' : 'Save Extras'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </Tab.Panel>

                                    <Tab.Panel>
                                        <div className="rounded-xl bg-white p-3">
                                            <h2 className="text-xl font-semibold mb-4">Finishes</h2>

                                            <form onSubmit={submitFinishes}>
                                                <div className="grid grid-cols-1 gap-6 mt-4">
                                                    {/* Finishes form fields would go here */}
                                                    <p className="text-gray-500 mb-4">Configure available finishes for windows.</p>

                                                    {/* Example of finishes form fields */}
                                                    <div className="border rounded-md p-4">
                                                        <h3 className="font-medium mb-2">Finishes Configuration</h3>
                                                        <p className="text-sm text-gray-500 mb-4">
                                                            Add, edit, or remove finishes that can be applied to windows in quotations.
                                                        </p>

                                                        {/* This would typically be a dynamic list of finishes */}
                                                        <div className="space-y-4">
                                                            {finishes && finishes.length > 0 ? (
                                                                finishes.map((finish, index) => (
                                                                    <div key={index} className="border-b pb-4">
                                                                        <p><strong>Name:</strong> {finish.name}</p>
                                                                        <p><strong>Description:</strong> {finish.description}</p>
                                                                        <p><strong>Price Modifier:</strong> {finish.price_modifier}%</p>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p>No finishes configured yet.</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mt-6">
                                                        <button
                                                            type="submit"
                                                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                            disabled={finishesForm.processing}
                                                        >
                                                            {finishesForm.processing ? 'Saving...' : 'Save Finishes'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </Tab.Panel>

                                    <Tab.Panel>
                                        <div className="rounded-xl bg-white p-3">
                                            <h2 className="text-xl font-semibold mb-4">PDF Text Configuration</h2>
                                            <p className="text-gray-500">PDF text configuration will be implemented here.</p>
                                        </div>
                                    </Tab.Panel>
                                </Tab.Panels>
                            </Tab.Group>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
