/**
 * Unified interfaces for the Estimate Wizard
 * This file consolidates all wizard-related type definitions
 */

export interface WindowItem {
  id?: string;                    // Optional for new windows, generated when saved
  room: string;                   // Room where window is located
  type: string;                   // Window type from API
  quantity: number;               // Number of windows
  cost: number;                   // Cost per window
  width?: number;                 // Window width (optional)
  height?: number;                // Window height (optional)
  glass_specification?: string;   // Glass type/specification
  paint_finish?: string;          // Paint finish option
  hardware_finish?: string;       // Hardware finish option
  extras?: any[];                 // Selected extras for this window
  options?: number | string[];    // Options (flexible format)
  finish?: string;                // General finish option
  additional_info?: string;       // Additional notes/information
  [key: string]: any;            // Allow additional properties
}

export interface CustomerInfo {
  title?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  additional_info?: string;
  [key: string]: any;
}

export interface WindowType {
  Type: string;
  Description?: string;
  Cost?: number;
  BasePrice?: number;
  [key: string]: any;
}

export interface WizardProps {
  windowTypes: WindowType[] | { window_types: WindowType[] } | any;
  extras: any[];
  finishes: any[];
  companyInfo: any;
  pdfTextConfig: any;
  options: any[];
  loadedEstimate?: any;
}

export interface StepValidation {
  [key: number]: boolean;
}

export interface ModalData {
  title: string;
  content: React.ReactNode;
}

// Step component prop interfaces
export interface CustomerInfoStepProps {
  customerInfo: CustomerInfo;
  updateCustomerInfo: (data: CustomerInfo) => void;
  validateStep: (step: number, isValid: boolean) => void;
}

export interface WindowSelectionStepProps {
  windows: WindowItem[];
  windowTypes: WindowType[] | { window_types: WindowType[] } | any;
  addWindow: (window: WindowItem) => void;
  updateWindow: (index: number, window: WindowItem) => void;
  removeWindow: (index: number) => void;
  openModal: (modalData: ModalData | null) => void;
  setCurrentWindow: (index: number | null) => void;
  validateStep?: (step: number, isValid: boolean) => void;
}

export interface WindowConfigStepProps {
  windows: WindowItem[];
  windowTypes: WindowType[] | { window_types: WindowType[] } | any;
  finishes: any;
  updateWindow: (index: number, window: WindowItem) => void;
  currentWindow: number | null;
  setCurrentWindow: (index: number | null) => void;
  openModal: (modalData: ModalData | null) => void;
  validateStep?: (step: number, isValid: boolean) => void;
}

export interface ExtrasSelectionStepProps {
  windows: WindowItem[];
  extras: any[];
  updateWindow: (index: number, window: WindowItem) => void;
  currentWindow: number | null;
  setCurrentWindow: (index: number | null) => void;
  openModal: (modalData: ModalData | null) => void;
  validateStep?: (step: number, isValid: boolean) => void;
}

export interface ReviewStepProps {
  formData: {
    customerInfo: CustomerInfo;
    windows: WindowItem[];
    selectedExtras: string[];
    selectedOptions: string[];
    selectedCaveats: string[];
  };
  windowTypes: WindowType[] | { window_types: WindowType[] } | any;
  extras: any[];
  finishes: any[];
  companyInfo: any;
  pdfTextConfig: any;
  options: any[];
  updateFormData: (section: string, data: any) => void;
  submitEstimate: () => void;
  validateStep?: (step: number, isValid: boolean) => void;
}

export interface WindowFormProps {
  windowData?: WindowItem;
  windowTypes: WindowType[] | { window_types: WindowType[] } | any;
  onSave: (windowData: WindowItem) => void;
  onCancel: () => void;
}
