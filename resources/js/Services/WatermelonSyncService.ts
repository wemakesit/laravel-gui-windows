import { synchronize } from '@nozbe/watermelondb/sync';
import { watermelonDBService } from './WatermelonDBService';
import { configService } from './ConfigService';

export class WatermelonSyncService {
  private get syncUrl(): string {
    return configService.getWatermelonSyncUrl();
  }
  private lastSyncTime: number | null = null;

  constructor() {
    this.loadLastSyncTime();
  }

  /**
   * Perform full bidirectional sync with the server
   */
  async sync(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Starting WatermelonDB sync...');

      await synchronize({
        database: watermelonDBService.db,
        pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
          console.log('📥 Pulling changes from server...', { lastPulledAt, schemaVersion });
          
          const response = await fetch(`${this.syncUrl}?last_pulled_at=${lastPulledAt || 0}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
            },
          });

          if (!response.ok) {
            throw new Error(`Pull failed: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          console.log('📥 Received changes:', data);

          return {
            changes: data.changes || {},
            timestamp: data.timestamp || Date.now(),
          };
        },

        pushChanges: async ({ changes, lastPulledAt }) => {
          console.log('📤 Pushing changes to server...', { changes, lastPulledAt });

          const response = await fetch(this.syncUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              'X-CSRF-TOKEN': this.getCSRFToken(),
            },
            body: JSON.stringify({
              changes,
              lastPulledAt,
            }),
          });

          if (!response.ok) {
            throw new Error(`Push failed: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          console.log('📤 Push response:', data);
        },

        migrationsEnabledAtVersion: 1,
      });

      this.lastSyncTime = Date.now();
      this.saveLastSyncTime();

      console.log('✅ WatermelonDB sync completed successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ WatermelonDB sync failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown sync error' 
      };
    }
  }

  /**
   * Sync specific estimate data to server
   */
  async syncEstimate(estimateId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Syncing specific estimate:', estimateId);

      const estimate = await watermelonDBService.getEstimate(estimateId);
      if (!estimate) {
        throw new Error('Estimate not found');
      }

      const customer = await watermelonDBService.getCustomer(estimate.customerId);
      const windows = await watermelonDBService.getWindowsByEstimate(estimateId);

      // Prepare data for server
      const syncData = {
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
          options: window.options,
        })),
      };

      const response = await fetch('/api/watermelon/sync-estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': this.getCSRFToken(),
        },
        body: JSON.stringify(syncData),
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Estimate sync completed:', result);

      return { success: true };

    } catch (error) {
      console.error('❌ Estimate sync failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown sync error' 
      };
    }
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): number | null {
    return this.lastSyncTime;
  }

  /**
   * Check if sync is needed (based on time since last sync)
   */
  isSyncNeeded(maxAgeMinutes: number = 30): boolean {
    if (!this.lastSyncTime) return true;
    const ageMinutes = (Date.now() - this.lastSyncTime) / (1000 * 60);
    return ageMinutes > maxAgeMinutes;
  }

  /**
   * Auto-sync if needed
   */
  async autoSync(): Promise<void> {
    if (this.isSyncNeeded()) {
      console.log('🔄 Auto-sync triggered');
      await this.sync();
    }
  }

  private getCSRFToken(): string {
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    return token || '';
  }

  private loadLastSyncTime(): void {
    const stored = localStorage.getItem('watermelon_last_sync');
    this.lastSyncTime = stored ? parseInt(stored, 10) : null;
  }

  private saveLastSyncTime(): void {
    if (this.lastSyncTime) {
      localStorage.setItem('watermelon_last_sync', this.lastSyncTime.toString());
    }
  }
}

// Export singleton instance
export const watermelonSyncService = new WatermelonSyncService();
