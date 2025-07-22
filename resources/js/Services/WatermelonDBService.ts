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
} from '../Database';
import type { CustomerInfo, WindowItem } from '../types/wizard';

export class WatermelonDBService {
  private db = database;

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
        window.options = windowData.options || null;
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
        if (updates.options !== undefined) w.options = updates.options;
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
}

// Export singleton instance
export const watermelonDBService = new WatermelonDBService();
export default watermelonDBService;
