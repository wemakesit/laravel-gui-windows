import { AxiosInstance } from 'axios';
import ziggyRoute, { Config as ZiggyConfig } from 'ziggy-js';

declare global {
  interface Window {
    axios: AxiosInstance;
  }

  var route: typeof ziggyRoute;
  var Ziggy: ZiggyConfig;
}

export interface PageProps {
  auth: {
    user: User | null;
  };
  flash?: {
    message?: string;
    success?: string;
    error?: string;
  };
  errors: Record<string, string>;
  ziggy: ZiggyConfig;
}

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
}

export interface WindowType {
  Type: string;
  Description?: string;
  Cost?: number;
  BasePrice?: number;
}

export interface WindowTypes {
  window_types: WindowType[];
}

export interface Extra {
  Name: string;
  Description?: string;
  Cost: number;
}

export interface Extras {
  extras: Extra[];
}

export interface Finish {
  name: string;
  description?: string;
  price_modifier?: number;
  images?: {
    sash?: string[];
    casement?: string[];
  };
}

export interface Finishes {
  paint_finishes?: Finish[];
  hardware_finishes?: Finish[];
  glass_specifications?: string[];
}

export interface Option {
  id: number;
  name: string;
  description?: string;
}

export interface Options {
  options: Option[];
}

export interface Window {
  room: string;
  type: string;
  quantity: number;
  glass_specification?: string;
  paint_finish?: string;
  hardware_finish?: string;
  cost: number;
  extras: Array<{ name: string; cost: number }>;
  options: number | number[];
  additional_info?: string;
}

export interface CustomerDetails {
  title: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  additional_info?: string;
}

export interface CompanyInfo {
  name: string;
  address?: {
    line1: string;
    line2: string;
    country: string;
  };
  contact?: {
    phone: string;
    email: string;
    website: string;
  };
  registration?: {
    company_number: string;
    vat_number: string;
  };
  logo?: string;
}

export interface PdfTextConfig {
  header?: string;
  footer?: string;
  terms_and_conditions?: string[];
}

export interface Quotation {
  id?: number;
  reference?: string;
  customer_details: CustomerDetails;
  windows: Window[];
  selected_caveats: Record<string, boolean>;
  created_at?: string;
  updated_at?: string;
}

// Offline Estimate Types
export interface EstimateBreakdown {
  subtotal: number;
  vat: number;
  vatRate: number;
  total: number;
  windowsTotal: number;
  extrasTotal: number;
  finishesTotal: number;
  discountAmount?: number;
  discountPercent?: number;
}

export interface WindowBreakdown {
  id: string;
  room: string;
  type: string;
  quantity: number;
  basePrice: number;
  extrasTotal: number;
  finishesTotal: number;
  lineTotal: number;
  extras: Array<{
    name: string;
    cost: number;
    quantity?: number;
  }>;
  finishes: Array<{
    name: string;
    cost: number;
  }>;
  options: number[];
}

export interface CompletedEstimate {
  id: string;
  referenceNumber: string;
  customerDetails: CustomerDetails;
  companyInfo: CompanyInfo;
  windows: WindowBreakdown[];
  selectedCaveats: Record<string, boolean>;
  breakdown: EstimateBreakdown;
  createdAt: Date;
  lastModified: Date;
  status: 'draft' | 'completed' | 'synced';
  synced: boolean;
  metadata: {
    windowCount: number;
    totalItems: number;
    createdBy?: string;
    deviceInfo?: string;
  };
}
