/**
 * Data Transformation Service
 * Handles consistent data mapping between API responses and WatermelonDB models
 */

// API interfaces
export interface APIWindowType {
  id?: number;
  Type: string;
  Description?: string;
  Cost?: number;
  Unit?: number;
  Hardware?: number;
  Image?: string;
  is_active?: boolean;
}

export interface APIFinish {
  id?: number;
  name: string;
  cost_multiplier?: number;
  description?: string;
  is_active?: boolean;
  color_code?: string;
}

export interface APIExtra {
  id?: number;
  Name: string;
  Description?: string;
  Cost?: number;
  category?: string;
  is_active?: boolean;
}

export interface APICompanyInfo {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  [key: string]: any;
}

export interface APIEstimate {
  id?: string;
  reference_number: string;
  customer_id: string;
  status: string;
  total_amount: number;
  discount_amount?: number;
  vat_amount?: number;
  final_amount: number;
  notes?: string;
  valid_until?: string;
  pdf_generated_at?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
  customer?: any;
  windows?: any[];
}

// WatermelonDB interfaces
export interface WatermelonWindowType {
  apiId: string;
  name: string;
  type: string;
  cost: number;
  description?: string;
  isActive: boolean;
  lastSynced: number;
}

export interface WatermelonFinish {
  apiId: string;
  name: string;
  category: string;
  cost: number;
  description?: string;
  isActive: boolean;
  lastSynced: number;
}

export interface WatermelonExtra {
  apiId: string;
  name: string;
  description?: string;
  cost: number;
  category?: string;
  isActive: boolean;
  lastSynced: number;
}

export class DataTransformService {
  /**
   * Generate consistent API ID from object data
   */
  private static generateApiId(data: any, prefix?: string): string {
    if (data.id) {
      return data.id.toString();
    }
    
    // Use name/Type field to generate consistent ID
    const nameField = data.Type || data.Name || data.name || 'unknown';
    const cleanName = nameField.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    return prefix ? `${prefix}_${cleanName}` : cleanName;
  }

  /**
   * Transform API window type to WatermelonDB format
   */
  static transformWindowType(apiWindowType: APIWindowType): WatermelonWindowType {
    return {
      apiId: this.generateApiId(apiWindowType),
      name: apiWindowType.Type,
      type: 'window', // Default type since API doesn't specify
      cost: apiWindowType.Cost || 0,
      description: apiWindowType.Description || null,
      isActive: apiWindowType.is_active !== false,
      lastSynced: Date.now(),
    };
  }

  /**
   * Transform API finish to WatermelonDB format
   */
  static transformFinish(apiFinish: APIFinish, category: string): WatermelonFinish {
    return {
      apiId: this.generateApiId(apiFinish, category),
      name: apiFinish.name,
      category,
      cost: apiFinish.cost_multiplier || 1,
      description: apiFinish.description || null,
      isActive: apiFinish.is_active !== false,
      lastSynced: Date.now(),
    };
  }

  /**
   * Transform API extra to WatermelonDB format
   */
  static transformExtra(apiExtra: APIExtra): WatermelonExtra {
    return {
      apiId: this.generateApiId(apiExtra),
      name: apiExtra.Name,
      description: apiExtra.Description || null,
      cost: apiExtra.Cost || 0,
      category: apiExtra.category || null,
      isActive: apiExtra.is_active !== false,
      lastSynced: Date.now(),
    };
  }

  /**
   * Transform API company info to WatermelonDB format
   */
  static transformCompanyInfo(apiCompanyInfo: APICompanyInfo): string {
    // Store as JSON string for WatermelonDB
    return JSON.stringify(apiCompanyInfo);
  }

  /**
   * Transform WatermelonDB estimate to API sync format
   */
  static transformEstimateForSync(estimate: any, customer: any, windows: any[]): any {
    return {
      estimate: {
        watermelon_id: estimate.id,
        customer_id: estimate.customerId,
        reference_number: estimate.referenceNumber,
        status: estimate.status,
        total_amount: estimate.totalAmount,
        discount_amount: estimate.discountAmount,
        vat_amount: estimate.vatAmount,
        final_amount: estimate.finalAmount,
        notes: estimate.notes,
        valid_until: estimate.validUntil?.toISOString(),
        pdf_generated_at: estimate.pdfGeneratedAt?.toISOString(),
        pdf_url: estimate.pdfUrl,
        is_synced: estimate.isSynced,
      },
      customer: customer ? {
        watermelon_id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address_line_1: customer.addressLine1,
        address_line_2: customer.addressLine2,
        city: customer.city,
        county: customer.county,
        postcode: customer.postcode,
        country: customer.country,
      } : null,
      windows: windows.map(window => ({
        watermelon_id: window.id,
        estimate_id: window.estimateId,
        room: window.room,
        window_type: window.windowType,
        width: window.width,
        height: window.height,
        quantity: window.quantity,
        finish: window.finish,
        glass_type: window.glassType,
        opening_type: window.openingType,
        notes: window.notes,
      })),
    };
  }

  /**
   * Transform API estimate to WatermelonDB format
   */
  static transformEstimateFromAPI(apiEstimate: APIEstimate): any {
    return {
      referenceNumber: apiEstimate.reference_number,
      status: apiEstimate.status,
      totalAmount: apiEstimate.total_amount,
      discountAmount: apiEstimate.discount_amount,
      vatAmount: apiEstimate.vat_amount,
      finalAmount: apiEstimate.final_amount,
      notes: apiEstimate.notes,
      validUntil: apiEstimate.valid_until ? new Date(apiEstimate.valid_until) : null,
      pdfGeneratedAt: apiEstimate.pdf_generated_at ? new Date(apiEstimate.pdf_generated_at) : null,
      pdfUrl: apiEstimate.pdf_url,
      isSynced: true, // Mark as synced since it came from server
    };
  }

  /**
   * Transform API customer to WatermelonDB format
   */
  static transformCustomerFromAPI(apiCustomer: any): any {
    return {
      name: apiCustomer.name,
      email: apiCustomer.email,
      phone: apiCustomer.phone,
      addressLine1: apiCustomer.address_line_1,
      addressLine2: apiCustomer.address_line_2,
      city: apiCustomer.city,
      county: apiCustomer.county,
      postcode: apiCustomer.postcode,
      country: apiCustomer.country || 'UK',
    };
  }

  /**
   * Transform API window to WatermelonDB format
   */
  static transformWindowFromAPI(apiWindow: any): any {
    return {
      room: apiWindow.room,
      windowType: apiWindow.window_type,
      width: apiWindow.width,
      height: apiWindow.height,
      quantity: apiWindow.quantity,
      unitPrice: apiWindow.unit_price,
      totalPrice: apiWindow.total_price,
      finish: apiWindow.finish,
      glassType: apiWindow.glass_type,
      openingType: apiWindow.opening_type,
      notes: apiWindow.notes,
      isSynced: true,
    };
  }

  /**
   * Validate API data structure
   */
  static validateAPIData(data: any, type: string): boolean {
    switch (type) {
      case 'windowType':
        return data && typeof data.Type === 'string';
      case 'finish':
        return data && typeof data.name === 'string';
      case 'extra':
        return data && typeof data.Name === 'string';
      case 'estimate':
        return data && data.reference_number && data.status;
      default:
        return false;
    }
  }
}

export default DataTransformService;
