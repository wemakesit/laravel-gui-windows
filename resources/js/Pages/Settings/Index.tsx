import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import PWADebugger from '@/Components/PWADebugger';

interface CompanyInfo {
  name: string;
  address: {
    line1: string;
    line2: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  registration: {
    company_number: string;
    vat_number: string;
  };
}

interface WindowType {
  name: string;
  description: string;
  base_price: number;
}

interface Extra {
  name: string;
  description: string;
  price: number;
}

interface Finish {
  name: string;
  description: string;
  price_modifier: number;
}

interface PdfTextConfig {
  header: string;
  footer: string;
  terms_and_conditions: string[];
  formats: {
    date_format: string;
    currency_symbol: string;
    vat_rate: number;
  };
}

interface Props {
  apiDocs: any;
  companyInfo: CompanyInfo;
  windowTypes: WindowType[];
  extras: Extra[];
  finishes: Finish[];
  pdfTextConfig: PdfTextConfig;
}

export default function Settings({
  apiDocs,
  companyInfo,
  windowTypes,
  extras,
  finishes,
  pdfTextConfig,
}: Props) {
  const [activeTab, setActiveTab] = useState('company');

  const tabs = [
    { id: 'company', name: 'Company Info', icon: '🏢' },
    { id: 'windows', name: 'Window Types', icon: '🪟' },
    { id: 'extras', name: 'Extras', icon: '➕' },
    { id: 'finishes', name: 'Finishes', icon: '🎨' },
    { id: 'pdf', name: 'PDF Config', icon: '📄' },
    { id: 'api', name: 'API Docs', icon: '🔧' },
    { id: 'pwa', name: 'PWA Debug', icon: '📱' },
  ];

  return (
    <AuthenticatedLayout
      header={
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold leading-tight text-gray-800'>
            Settings
          </h2>
          <Link
            href={route('dashboard')}
            className='inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
          >
            ← Back to Dashboard
          </Link>
        </div>
      }
    >
      <Head title='Settings' />

      <div className='py-12'>
        <div className='mx-auto max-w-7xl sm:px-6 lg:px-8'>
          <div className='overflow-hidden bg-white shadow-sm sm:rounded-lg'>
            {/* Tab Navigation */}
            <div className='border-b border-gray-200'>
              <nav className='-mb-px flex space-x-8 px-6' aria-label='Tabs'>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className='p-6'>
              {activeTab === 'company' && (
                <CompanyInfoTab companyInfo={companyInfo} />
              )}
              {activeTab === 'windows' && (
                <WindowTypesTab windowTypes={windowTypes} />
              )}
              {activeTab === 'extras' && <ExtrasTab extras={extras} />}
              {activeTab === 'finishes' && <FinishesTab finishes={finishes} />}
              {activeTab === 'pdf' && (
                <PdfConfigTab pdfTextConfig={pdfTextConfig} />
              )}
              {activeTab === 'api' && <ApiDocsTab apiDocs={apiDocs} />}
              {activeTab === 'pwa' && <PWADebugger />}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

// Company Info Tab Component
function CompanyInfoTab({ companyInfo }: { companyInfo: CompanyInfo }) {
  const { data, setData, post, processing, errors } = useForm(companyInfo);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      confirm(
        'Are you sure you want to update the company information? This will affect all future estimates.'
      )
    ) {
      post(route('settings.update-company-info'));
    }
  };

  return (
    <div>
      <div className='mb-6'>
        <h3 className='text-lg font-medium leading-6 text-gray-900'>
          Company Information
        </h3>
        <p className='mt-1 text-sm text-gray-500'>
          This information will appear on all generated estimates and
          quotations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        <div>
          <label
            htmlFor='name'
            className='block text-sm font-medium text-gray-700'
          >
            Company Name
          </label>
          <input
            type='text'
            id='name'
            name='name'
            value={data.name}
            onChange={e => setData('name', e.target.value)}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm'
          />
          {errors.name && (
            <p className='mt-1 text-sm text-red-600'>{errors.name}</p>
          )}
        </div>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <div>
            <label
              htmlFor='address.line1'
              className='block text-sm font-medium text-gray-700'
            >
              Address Line 1
            </label>
            <input
              type='text'
              id='address.line1'
              name='address.line1'
              value={data.address.line1}
              onChange={e =>
                setData('address', { ...data.address, line1: e.target.value })
              }
              className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm'
            />
            {errors['address.line1'] && (
              <p className='mt-1 text-sm text-red-600'>
                {errors['address.line1']}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor='address.line2'
              className='block text-sm font-medium text-gray-700'
            >
              Address Line 2
            </label>
            <input
              type='text'
              id='address.line2'
              name='address.line2'
              value={data.address.line2}
              onChange={e =>
                setData('address', { ...data.address, line2: e.target.value })
              }
              className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm'
            />
            {errors['address.line2'] && (
              <p className='mt-1 text-sm text-red-600'>
                {errors['address.line2']}
              </p>
            )}
          </div>
        </div>

        <div className='flex justify-end'>
          <button
            type='submit'
            disabled={processing}
            className='inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50'
          >
            {processing ? 'Saving...' : 'Save Company Info'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Placeholder components for other tabs
function WindowTypesTab({ windowTypes }: { windowTypes: WindowType[] }) {
  return (
    <div>
      <h3 className='text-lg font-medium leading-6 text-gray-900 mb-4'>
        Window Types
      </h3>
      <p className='text-sm text-gray-500 mb-6'>
        Configure available window types and their base prices.
      </p>
      <div className='bg-gray-50 p-4 rounded-md'>
        <p className='text-sm text-gray-600'>
          Window types configuration will be implemented here.
        </p>
        <pre className='mt-2 text-xs text-gray-500'>
          {JSON.stringify(windowTypes, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function ExtrasTab({ extras }: { extras: Extra[] }) {
  return (
    <div>
      <h3 className='text-lg font-medium leading-6 text-gray-900 mb-4'>
        Extras
      </h3>
      <p className='text-sm text-gray-500 mb-6'>
        Configure additional options and their prices.
      </p>
      <div className='bg-gray-50 p-4 rounded-md'>
        <p className='text-sm text-gray-600'>
          Extras configuration will be implemented here.
        </p>
        <pre className='mt-2 text-xs text-gray-500'>
          {JSON.stringify(extras, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function FinishesTab({ finishes }: { finishes: Finish[] }) {
  return (
    <div>
      <h3 className='text-lg font-medium leading-6 text-gray-900 mb-4'>
        Finishes
      </h3>
      <p className='text-sm text-gray-500 mb-6'>
        Configure available finishes and their price modifiers.
      </p>
      <div className='bg-gray-50 p-4 rounded-md'>
        <p className='text-sm text-gray-600'>
          Finishes configuration will be implemented here.
        </p>
        <pre className='mt-2 text-xs text-gray-500'>
          {JSON.stringify(finishes, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function PdfConfigTab({ pdfTextConfig }: { pdfTextConfig: PdfTextConfig }) {
  return (
    <div>
      <h3 className='text-lg font-medium leading-6 text-gray-900 mb-4'>
        PDF Configuration
      </h3>
      <p className='text-sm text-gray-500 mb-6'>
        Configure PDF generation settings and text content.
      </p>
      <div className='bg-gray-50 p-4 rounded-md'>
        <p className='text-sm text-gray-600'>
          PDF configuration will be implemented here.
        </p>
        <pre className='mt-2 text-xs text-gray-500'>
          {JSON.stringify(pdfTextConfig, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function ApiDocsTab({ apiDocs }: { apiDocs: any }) {
  return (
    <div>
      <h3 className='text-lg font-medium leading-6 text-gray-900 mb-4'>
        API Documentation
      </h3>
      <p className='text-sm text-gray-500 mb-6'>
        View API documentation and configuration status.
      </p>
      <div className='bg-gray-50 p-4 rounded-md'>
        <p className='text-sm text-gray-600'>
          API documentation will be displayed here.
        </p>
        <pre className='mt-2 text-xs text-gray-500'>
          {JSON.stringify(apiDocs, null, 2)}
        </pre>
      </div>
    </div>
  );
}
