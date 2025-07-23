/**
 * WatermelonDB Service for offline-first data storage
 */

import { Q } from '@nozbe/watermelondb';
import database, {
  Customer,
  Estimate,
  Window,
  Extra,
  Photo,
  WindowType,
  Finish,
  CompanyInfo,
} from '../Database';
import type { CustomerInfo, WindowItem } from '../types/wizard';

// API data interfaces
interface APIWindowType {
  id?: number;
  Type: string;  // API uses capitalized field names
  Description?: string;
  Cost?: number;
  Unit?: number;
  Hardware?: number;
  Image?: string;
  is_active?: boolean;
}

interface APIFinish {
  id?: number;
  name: string;
  cost_multiplier?: number;  // API uses cost_multiplier instead of cost
  description?: string;
  is_active?: boolean;
  color_code?: string;  // Some finishes have color codes
}

interface APIFinishes {
  glass_specifications?: APIFinish[];
  paint_finishes?: APIFinish[];
  hardware_finishes?: APIFinish[];
}

interface APIExtra {
  id?: number;
  Name: string;  // API uses capitalized field names
  Cost?: number;
  Description?: string;
  category?: string;
  is_active?: boolean;
}

interface APICompanyInfo {
  name?: string;
  address?: {
    line1?: string;
    line2?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  sales_contact?: {
    name?: string;
    title?: string;
    phone?: string;
    email?: string;
  };
  vat_number?: string;
  registration_number?: string;
}

// Return type interfaces
interface CachedWindowType {
  id: string;
  name: string;
  type: string;
  cost: number;
  description?: string;
}

interface CachedFinishes {
  glass_specifications: CachedFinish[];
  paint_finishes: CachedFinish[];
  hardware_finishes: CachedFinish[];
}

interface CachedFinish {
  id: string;
  name: string;
  cost: number;
  description?: string;
}

interface CachedExtra {
  id: string;
  name: string;
  cost: number;
  description?: string;
  category?: string;
}

export class WatermelonDBService {
  private db = database;
  private static instance: WatermelonDBService | null = null;

  // Singleton pattern to ensure same service instance across the app
  static getInstance(): WatermelonDBService {
    if (!WatermelonDBService.instance) {
      console.log('🍉 Creating new WatermelonDBService instance');
      WatermelonDBService.instance = new WatermelonDBService();
    } else {
      console.log('🍉 Reusing existing WatermelonDBService instance');
    }
    return WatermelonDBService.instance;
  }

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    try {
      // Database is automatically initialized when imported
      console.log('WatermelonDB initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WatermelonDB:', error);
      throw error;
    }
  }

  /**
   * Customer operations
   */
  async createCustomer(customerInfo: CustomerInfo): Promise<Customer> {
    return await this.db.write(async () => {
      return await this.db.get<Customer>('customers').create(customer => {
        customer.name = customerInfo.name;
        customer.email = customerInfo.email || null;
        customer.phone = customerInfo.phone || null;
        customer.addressLine1 = customerInfo.addressLine1 || null;
        customer.addressLine2 = customerInfo.addressLine2 || null;
        customer.city = customerInfo.city || null;
        customer.county = customerInfo.county || null;
        customer.postcode = customerInfo.postcode || null;
        customer.country = customerInfo.country || null;
        customer.companyName = customerInfo.companyName || null;
        customer.notes = customerInfo.notes || null;
      });
    });
  }

  async getCustomer(id: string): Promise<Customer | null> {
    try {
      return await this.db.get<Customer>('customers').find(id);
    } catch {
      return null;
    }
  }

  async getAllCustomers(): Promise<Customer[]> {
    return await this.db.get<Customer>('customers').query().fetch();
  }

  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    return await this.db
      .get<Customer>('customers')
      .query(
        Q.or(
          Q.where('name', Q.like(`%${searchTerm}%`)),
          Q.where('email', Q.like(`%${searchTerm}%`)),
          Q.where('company_name', Q.like(`%${searchTerm}%`))
        )
      )
      .fetch();
  }

  /**
   * Estimate operations
   */
  async createEstimate(
    customerId: string,
    referenceNumber?: string
  ): Promise<Estimate> {
    return await this.db.write(async () => {
      return await this.db.get<Estimate>('estimates').create(estimate => {
        estimate.customerId = customerId;
        estimate.referenceNumber =
          referenceNumber || this.generateReferenceNumber();
        estimate.status = 'draft';
        estimate.isSynced = false;
      });
    });
  }

  async getEstimate(id: string): Promise<Estimate | null> {
    try {
      return await this.db.get<Estimate>('estimates').find(id);
    } catch {
      return null;
    }
  }

  async getAllEstimates(): Promise<Estimate[]> {
    return await this.db
      .get<Estimate>('estimates')
      .query(Q.sortBy('created_at', Q.desc))
      .fetch();
  }

  async getEstimatesByCustomer(customerId: string): Promise<Estimate[]> {
    return await this.db
      .get<Estimate>('estimates')
      .query(Q.where('customer_id', customerId), Q.sortBy('created_at', Q.desc))
      .fetch();
  }

  async getDraftEstimates(): Promise<Estimate[]> {
    return await this.db
      .get<Estimate>('estimates')
      .query(Q.where('status', 'draft'), Q.sortBy('updated_at', Q.desc))
      .fetch();
  }

  /**
   * Window operations
   */
  async addWindowToEstimate(
    estimateId: string,
    windowData: WindowItem
  ): Promise<Window> {
    return await this.db.write(async () => {
      return await this.db.get<Window>('windows').create(window => {
        window.estimateId = estimateId;
        window.room = windowData.room;
        window.windowType = windowData.windowType;
        window.width = windowData.width;
        window.height = windowData.height;
        window.quantity = windowData.quantity || 1;
        window.finish = windowData.finish || null;
        window.glassType = windowData.glassType || null;
        window.openingType = windowData.openingType || null;
        window.notes = windowData.notes || null;
        // Ensure options is properly typed as string[] | null
        window.options = Array.isArray(windowData.options) ? windowData.options : null;
      });
    });
  }

  async getWindowsByEstimate(estimateId: string): Promise<Window[]> {
    return await this.db
      .get<Window>('windows')
      .query(Q.where('estimate_id', estimateId))
      .fetch();
  }

  async updateWindow(
    windowId: string,
    updates: Partial<WindowItem>
  ): Promise<void> {
    await this.db.write(async () => {
      const window = await this.db.get<Window>('windows').find(windowId);
      await window.update(w => {
        if (updates.room !== undefined) w.room = updates.room;
        if (updates.windowType !== undefined) w.windowType = updates.windowType;
        if (updates.width !== undefined) w.width = updates.width;
        if (updates.height !== undefined) w.height = updates.height;
        if (updates.quantity !== undefined) w.quantity = updates.quantity;
        if (updates.finish !== undefined) w.finish = updates.finish;
        if (updates.glassType !== undefined) w.glassType = updates.glassType;
        if (updates.openingType !== undefined)
          w.openingType = updates.openingType;
        if (updates.notes !== undefined) w.notes = updates.notes;
        if (updates.options !== undefined) {
          // Ensure options is properly typed as string[] | null
          w.options = Array.isArray(updates.options) ? updates.options : null;
        }
      });
    });
  }

  async deleteWindow(windowId: string): Promise<void> {
    await this.db.write(async () => {
      const window = await this.db.get<Window>('windows').find(windowId);
      await window.markAsDeleted();
    });
  }

  /**
   * Photo operations
   */
  async addPhoto(
    estimateId: string,
    photoData: {
      filename: string;
      filePath: string;
      fileSize?: number;
      mimeType?: string;
      caption?: string;
      windowId?: string;
    }
  ): Promise<Photo> {
    return await this.db.write(async () => {
      return await this.db.get<Photo>('photos').create(photo => {
        photo.estimateId = estimateId;
        photo.windowId = photoData.windowId || null;
        photo.filename = photoData.filename;
        photo.filePath = photoData.filePath;
        photo.fileSize = photoData.fileSize || null;
        photo.mimeType = photoData.mimeType || null;
        photo.caption = photoData.caption || null;
        photo.isSynced = false;
      });
    });
  }

  async getPhotosByEstimate(estimateId: string): Promise<Photo[]> {
    return await this.db
      .get<Photo>('photos')
      .query(Q.where('estimate_id', estimateId))
      .fetch();
  }

  async getPhotosByWindow(windowId: string): Promise<Photo[]> {
    return await this.db
      .get<Photo>('photos')
      .query(Q.where('window_id', windowId))
      .fetch();
  }

  /**
   * Utility methods
   */
  private generateReferenceNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `EST-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Database maintenance
   */
  async clearAllData(): Promise<void> {
    await this.db.write(async () => {
      await this.db.unsafeResetDatabase();
    });
  }

  async getStorageInfo(): Promise<{
    customers: number;
    estimates: number;
    windows: number;
    photos: number;
  }> {
    const [customers, estimates, windows, photos] = await Promise.all([
      this.db.get<Customer>('customers').query().fetchCount(),
      this.db.get<Estimate>('estimates').query().fetchCount(),
      this.db.get<Window>('windows').query().fetchCount(),
      this.db.get<Photo>('photos').query().fetchCount(),
    ]);

    return { customers, estimates, windows, photos };
  }

  /**
   * Configuration data sync methods
   */
  async syncWindowTypesFromAPI(windowTypes: APIWindowType[]): Promise<void> {
    console.log('🍉 Starting window types sync, data will be persisted to IndexedDB');

    await this.db.write(async () => {
      for (const apiWindowType of windowTypes) {
        try {
          // Generate a consistent ID based on the Type name since API doesn't provide ID
          const generatedId = apiWindowType.id?.toString() ||
            apiWindowType.Type.toLowerCase().replace(/[^a-z0-9]/g, '_');

          // Try to find existing record
          const existing = await this.db
            .get<WindowType>('window_types')
            .query(Q.where('api_id', generatedId))
            .fetch();

          if (existing.length > 0) {
            // Update existing
            await existing[0].updateFromAPI({
              name: apiWindowType.Type,
              type: 'window', // Default type since API doesn't specify
              cost: apiWindowType.Cost || 0,
              description: apiWindowType.Description,
              isActive: apiWindowType.is_active !== false,
            });
            console.log('🍉 Updated window type:', apiWindowType.Type);
          } else {
            // Create new
            const newRecord = await this.db.get<WindowType>('window_types').create(windowType => {
              windowType.apiId = generatedId;
              windowType.name = apiWindowType.Type;
              windowType.type = 'window'; // Default type since API doesn't specify
              windowType.cost = apiWindowType.Cost || 0;
              windowType.description = apiWindowType.Description || null;
              windowType.isActive = apiWindowType.is_active !== false;
              windowType.lastSynced = Date.now();
            });
            console.log('🍉 Created window type:', apiWindowType.Type, 'ID:', newRecord.id);
          }
        } catch (error) {
          console.error('Error syncing window type:', apiWindowType, error);
        }
      }
    });

    console.log('🍉 Window types sync completed, data should be persisted to IndexedDB');

    // Force a save to IndexedDB by triggering a small delay
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('🍉 Persistence delay completed');
  }

  async syncFinishesFromAPI(finishes: APIFinishes): Promise<void> {
    await this.db.write(async () => {
      // Process each category of finishes
      const categories = ['glass_specifications', 'paint_finishes', 'hardware_finishes'];

      for (const category of categories) {
        if (finishes[category] && Array.isArray(finishes[category])) {
          for (const apiFinish of finishes[category]) {
            try {
              // Generate a consistent ID based on the name since API doesn't provide ID
              const generatedId = apiFinish.id?.toString() ||
                `${category}_${apiFinish.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

              // Try to find existing record
              const existing = await this.db
                .get<Finish>('finishes')
                .query(
                  Q.where('api_id', generatedId),
                  Q.where('category', category)
                )
                .fetch();

              if (existing.length > 0) {
                // Update existing
                await existing[0].updateFromAPI({
                  name: apiFinish.name,
                  category,
                  cost: apiFinish.cost_multiplier || 1, // Use cost_multiplier from API
                  description: apiFinish.description,
                  isActive: apiFinish.is_active !== false,
                });
              } else {
                // Create new
                await this.db.get<any>('finishes').create(finish => {
                  finish.apiId = generatedId;
                  finish.name = apiFinish.name;
                  finish.category = category;
                  finish.cost = apiFinish.cost_multiplier || 1; // Use cost_multiplier from API
                  finish.description = apiFinish.description || null;
                  finish.isActive = apiFinish.is_active !== false;
                  finish.lastSynced = Date.now();
                });
              }
            } catch (error) {
              console.error('Error syncing finish:', apiFinish, error);
            }
          }
        }
      }
    });
  }

  async syncExtrasFromAPI(extras: APIExtra[]): Promise<void> {
    await this.db.write(async () => {
      for (const apiExtra of extras) {
        try {
          // Generate a consistent ID based on the name since API doesn't provide ID
          const generatedId = apiExtra.id?.toString() ||
            apiExtra.Name.toLowerCase().replace(/[^a-z0-9]/g, '_');

          // Try to find existing config extra record
          const existing = await this.db
            .get<Extra>('extras')
            .query(
              Q.where('api_id', generatedId),
              Q.where('is_config', true)
            )
            .fetch();

          if (existing.length > 0) {
            // Update existing
            await existing[0].updateFromAPI({
              name: apiExtra.Name,
              cost: apiExtra.Cost || 0,
              description: apiExtra.Description,
              category: apiExtra.category,
              isActive: apiExtra.is_active !== false,
            });
          } else {
            // Create new config extra
            await this.db.get<Extra>('extras').create(extra => {
              extra.apiId = generatedId;
              extra.estimateId = null; // Config extras don't belong to estimates
              extra.name = apiExtra.Name;
              extra.description = apiExtra.Description || null;
              extra.quantity = null; // Config extras don't have quantity
              extra.unitPrice = apiExtra.Cost || 0;
              extra.totalPrice = null; // Config extras don't have total price
              extra.category = apiExtra.category || 'general';
              extra.isConfig = true;
              extra.isActive = apiExtra.is_active !== false;
              extra.lastSynced = Date.now();
            });
          }
        } catch (error) {
          console.error('Error syncing extra:', apiExtra, error);
        }
      }
    });
  }

  async syncCompanyInfoFromAPI(companyInfo: APICompanyInfo): Promise<void> {
    await this.db.write(async () => {
      try {
        // Try to find existing record
        const existing = await this.db
          .get<CompanyInfo>('company_info')
          .query(Q.where('key', 'default'))
          .fetch();

        if (existing.length > 0) {
          // Update existing
          await existing[0].updateFromAPI(companyInfo);
        } else {
          // Create new
          await this.db.get<CompanyInfo>('company_info').create(info => {
            info.key = 'default';
            info.data = JSON.stringify(companyInfo);
            info.lastSynced = Date.now();
          });
        }
      } catch (error) {
        console.error('Error syncing company info:', companyInfo, error);
      }
    });
  }

  /**
   * Get cached configuration data
   */
  async getCachedWindowTypes(): Promise<CachedWindowType[]> {
    // Get all active window types
    // Note: Using manual filter instead of Q.where('is_active', true) due to WatermelonDB boolean query issue
    // This is a known limitation where boolean queries don't work reliably in some WatermelonDB versions
    const allWindowTypes = await this.db
      .get<any>('window_types')
      .query()
      .fetch();

    // Filter for active window types manually
    const windowTypes = allWindowTypes.filter(wt => wt.isActive === true);

    return windowTypes.map(wt => ({
      id: wt.apiId,
      name: wt.name,
      type: wt.type,
      cost: wt.cost,
      description: wt.description,
    }));
  }

  async getCachedFinishes(): Promise<CachedFinishes> {
    // Get all finishes and filter manually for active ones
    const allFinishes = await this.db
      .get<any>('finishes')
      .query()
      .fetch();

    const finishes = allFinishes.filter(f => f.isActive === true);

    const result: CachedFinishes = {
      glass_specifications: [],
      paint_finishes: [],
      hardware_finishes: [],
    };

    for (const finish of finishes) {
      if (result[finish.category]) {
        result[finish.category].push({
          id: finish.apiId,
          name: finish.name,
          cost: finish.cost,
          description: finish.description,
        });
      }
    }

    return result;
  }

  async getCachedExtras(): Promise<CachedExtra[]> {
    // Get all extras and filter manually for active config extras
    const allExtras = await this.db
      .get<Extra>('extras')
      .query()
      .fetch();

    const extras = allExtras.filter(extra => extra.isConfig === true && extra.isActive === true);

    return extras.map(extra => ({
      id: extra.apiId,
      name: extra.name,
      cost: extra.unitPrice,
      description: extra.description,
      category: extra.category,
    }));
  }

  async getCachedCompanyInfo(): Promise<Record<string, any>> {
    const companyInfoRecords = await this.db
      .get<CompanyInfo>('company_info')
      .query(Q.where('key', 'default'))
      .fetch();

    if (companyInfoRecords.length > 0) {
      return companyInfoRecords[0].getCompanyData();
    }

    return {};
  }
}

// Export singleton instance
export const watermelonDBService = WatermelonDBService.getInstance();
export default watermelonDBService;
