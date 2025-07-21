/**
 * Offline Estimate Service
 * Handles offline estimate generation, pricing calculations, and local storage
 */

import { indexedDBService, EstimateRecord } from './IndexedDBService';
import { configCacheService } from './ConfigCacheService';

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
  customerDetails: {
    title: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    additional_info?: string;
  };
  companyInfo: any;
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

class OfflineEstimateService {
  private readonly REFERENCE_PREFIX = 'EST';
  private readonly VAT_RATE_DEFAULT = 0.2; // 20% VAT

  /**
   * Generate a unique reference number for the estimate
   */
  private async generateReferenceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const estimates = await indexedDBService.getAllEstimates();

    // Count estimates from current year
    const currentYearEstimates = estimates.filter(est => {
      const estYear = new Date(est.timestamp).getFullYear();
      return estYear === year;
    });

    const sequenceNumber = currentYearEstimates.length + 1;
    return `${this.REFERENCE_PREFIX}-${year}-${sequenceNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Calculate pricing for a single window
   */
  private calculateWindowPricing(
    window: any,
    cachedConfig: any
  ): WindowBreakdown {
    const windowTypes = cachedConfig.windowTypes || [];
    const extras = cachedConfig.extras?.extras || [];
    const finishes = cachedConfig.finishes?.finishes || [];

    // Find window type pricing
    const windowType = windowTypes.find(
      (type: any) => type.Type === window.type
    );
    const basePrice = windowType?.Cost || windowType?.BasePrice || 0;

    // Calculate extras total
    const windowExtras = window.extras || [];
    let extrasTotal = 0;
    const extrasBreakdown: Array<{
      name: string;
      cost: number;
      quantity?: number;
    }> = [];

    windowExtras.forEach((extra: any) => {
      const extraData = extras.find((e: any) => e.Name === extra.name);
      if (extraData) {
        const extraCost = extraData.Cost || 0;
        extrasTotal += extraCost;
        extrasBreakdown.push({
          name: extra.name,
          cost: extraCost,
          quantity: 1,
        });
      }
    });

    // Calculate finishes total (if any)
    let finishesTotal = 0;
    const finishesBreakdown: Array<{ name: string; cost: number }> = [];

    if (window.paint_finish) {
      const finishData = finishes.find(
        (f: any) => f.Name === window.paint_finish
      );
      if (finishData) {
        finishesTotal += finishData.Cost || 0;
        finishesBreakdown.push({
          name: window.paint_finish,
          cost: finishData.Cost || 0,
        });
      }
    }

    if (window.hardware_finish) {
      const finishData = finishes.find(
        (f: any) => f.Name === window.hardware_finish
      );
      if (finishData) {
        finishesTotal += finishData.Cost || 0;
        finishesBreakdown.push({
          name: window.hardware_finish,
          cost: finishData.Cost || 0,
        });
      }
    }

    const quantity = window.quantity || 1;
    const lineTotal = (basePrice + extrasTotal + finishesTotal) * quantity;

    return {
      id:
        window.id ||
        `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      room: window.room || '',
      type: window.type || '',
      quantity,
      basePrice,
      extrasTotal,
      finishesTotal,
      lineTotal,
      extras: extrasBreakdown,
      finishes: finishesBreakdown,
      options: window.options || [1], // Default to Option 1
    };
  }

  /**
   * Calculate estimate breakdown and totals
   */
  private calculateEstimateBreakdown(
    windows: WindowBreakdown[],
    vatRate: number = this.VAT_RATE_DEFAULT,
    discountPercent: number = 0
  ): EstimateBreakdown {
    const windowsTotal = windows.reduce(
      (total, window) => total + window.lineTotal,
      0
    );
    const extrasTotal = windows.reduce(
      (total, window) => total + window.extrasTotal * window.quantity,
      0
    );
    const finishesTotal = windows.reduce(
      (total, window) => total + window.finishesTotal * window.quantity,
      0
    );

    const subtotal = windowsTotal;
    const discountAmount =
      discountPercent > 0 ? (subtotal * discountPercent) / 100 : 0;
    const discountedSubtotal = subtotal - discountAmount;
    const vat = discountedSubtotal * vatRate;
    const total = discountedSubtotal + vat;

    return {
      subtotal,
      vat,
      vatRate,
      total,
      windowsTotal,
      extrasTotal,
      finishesTotal,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      discountPercent: discountPercent > 0 ? discountPercent : undefined,
    };
  }

  /**
   * Generate a complete estimate offline
   */
  public async generateEstimate(estimateData: {
    customerInfo: any;
    windows: any[];
    selectedCaveats: Record<string, boolean>;
    companyInfo?: any;
    discountPercent?: number;
  }): Promise<CompletedEstimate> {
    try {
      // Get cached configuration data
      const cachedConfig = await configCacheService.getConfig();

      if (!cachedConfig) {
        throw new Error(
          'Configuration data not available offline. Please sync when online.'
        );
      }

      // Check if we have any configuration data from PouchDB
      if (
        (!cachedConfig.windowTypes || cachedConfig.windowTypes.length === 0) &&
        (!cachedConfig.extras || cachedConfig.extras.length === 0) &&
        (!cachedConfig.finishes || cachedConfig.finishes.length === 0)
      ) {
        throw new Error(
          'No configuration data available. Please sync with CouchDB when online.'
        );
      }

      // Generate reference number
      const referenceNumber = await this.generateReferenceNumber();

      // Calculate window pricing
      const windowBreakdowns = estimateData.windows.map(window =>
        this.calculateWindowPricing(window, cachedConfig)
      );

      // Get VAT rate from config or use default
      const vatRate =
        cachedConfig.pdfTextConfig?.formats?.vat_rate || this.VAT_RATE_DEFAULT;

      // Calculate estimate breakdown
      const breakdown = this.calculateEstimateBreakdown(
        windowBreakdowns,
        vatRate,
        estimateData.discountPercent || 0
      );

      // Create completed estimate
      const completedEstimate: CompletedEstimate = {
        id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        referenceNumber,
        customerDetails: {
          title: estimateData.customerInfo.title || '',
          first_name: estimateData.customerInfo.first_name || '',
          last_name: estimateData.customerInfo.last_name || '',
          email: estimateData.customerInfo.email || '',
          phone: estimateData.customerInfo.phone || '',
          address: estimateData.customerInfo.address || '',
          additional_info: estimateData.customerInfo.additional_info,
        },
        companyInfo: estimateData.companyInfo || cachedConfig.companyInfo || {},
        windows: windowBreakdowns,
        selectedCaveats: estimateData.selectedCaveats || {},
        breakdown,
        createdAt: new Date(),
        lastModified: new Date(),
        status: 'completed',
        synced: false,
        metadata: {
          windowCount: windowBreakdowns.length,
          totalItems: windowBreakdowns.reduce(
            (total, window) => total + window.quantity,
            0
          ),
          deviceInfo: navigator.userAgent,
        },
      };

      // Store in IndexedDB
      await this.saveEstimate(completedEstimate);

      console.log(
        'OfflineEstimate: Estimate generated successfully',
        referenceNumber
      );
      return completedEstimate;
    } catch (error) {
      console.error('OfflineEstimate: Error generating estimate:', error);
      throw error;
    }
  }

  /**
   * Save estimate to local storage
   */
  public async saveEstimate(estimate: CompletedEstimate): Promise<void> {
    const estimateRecord: EstimateRecord = {
      id: estimate.id,
      customerInfo: estimate.customerDetails,
      windows: estimate.windows,
      selectedCaveats: estimate.selectedCaveats,
      companyInfo: estimate.companyInfo,
      timestamp: estimate.createdAt.getTime(),
      synced: estimate.synced,
      lastModified: estimate.lastModified.getTime(),
      status: estimate.status,
    };

    await indexedDBService.saveEstimate(estimateRecord);

    // Also save the complete estimate data separately for easy retrieval
    await indexedDBService.saveConfig(
      `completed_estimate_${estimate.id}`,
      estimate
    );
  }

  /**
   * Get all completed estimates
   */
  public async getAllEstimates(): Promise<CompletedEstimate[]> {
    try {
      const estimates = await indexedDBService.getAllEstimates();
      const completedEstimates: CompletedEstimate[] = [];

      for (const estimate of estimates) {
        if (estimate.status === 'completed') {
          try {
            const fullEstimate = await indexedDBService.getConfig(
              `completed_estimate_${estimate.id}`
            );
            if (fullEstimate) {
              completedEstimates.push(fullEstimate);
            }
          } catch (error) {
            console.warn(
              'Could not retrieve full estimate data for:',
              estimate.id
            );
          }
        }
      }

      return completedEstimates.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    } catch (error) {
      console.error('OfflineEstimate: Error retrieving estimates:', error);
      return [];
    }
  }

  /**
   * Get estimate by ID
   */
  public async getEstimateById(id: string): Promise<CompletedEstimate | null> {
    try {
      const estimate = await indexedDBService.getConfig(
        `completed_estimate_${id}`
      );
      return estimate || null;
    } catch (error) {
      console.error('OfflineEstimate: Error retrieving estimate:', error);
      return null;
    }
  }

  /**
   * Delete estimate
   */
  public async deleteEstimate(id: string): Promise<void> {
    try {
      await indexedDBService.deleteEstimate(id);
      // Also delete the complete estimate data
      await indexedDBService.deleteConfig(`completed_estimate_${id}`);
      console.log('OfflineEstimate: Estimate deleted:', id);
    } catch (error) {
      console.error('OfflineEstimate: Error deleting estimate:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const offlineEstimateService = new OfflineEstimateService();
