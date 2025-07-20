/**
 * Local Pricing Engine
 * Handles all pricing calculations using cached configuration data
 */

import { configCacheService } from './ConfigCacheService';

export interface PricingContext {
  windowTypes: any[];
  extras: any[];
  finishes: any[];
  vatRate: number;
  discountRules?: DiscountRule[];
}

export interface DiscountRule {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  conditions?: {
    minQuantity?: number;
    minValue?: number;
    windowTypes?: string[];
  };
}

export interface WindowPricing {
  basePrice: number;
  extrasTotal: number;
  finishesTotal: number;
  subtotal: number;
  discountAmount: number;
  total: number;
}

export interface EstimatePricing {
  windowsPricing: WindowPricing[];
  subtotal: number;
  totalDiscount: number;
  vatAmount: number;
  total: number;
  breakdown: {
    windowsTotal: number;
    extrasTotal: number;
    finishesTotal: number;
    discountTotal: number;
    vatTotal: number;
  };
}

class LocalPricingEngine {
  private pricingContext: PricingContext | null = null;
  private readonly DEFAULT_VAT_RATE = 0.2; // 20%

  /**
   * Initialize pricing context with cached configuration
   */
  public async initialize(): Promise<void> {
    try {
      const cachedConfig = await configCacheService.getConfig();

      if (!cachedConfig) {
        throw new Error('No cached configuration available for pricing. Please sync with CouchDB when online.');
      }

      this.pricingContext = {
        windowTypes: cachedConfig.windowTypes || [],
        extras: cachedConfig.extras || [],
        finishes: cachedConfig.finishes || [],
        vatRate: cachedConfig.pdfTextConfig?.formats?.vat_rate || this.DEFAULT_VAT_RATE,
        discountRules: [] // TODO: Implement discount rules from config
      };

      console.log('LocalPricingEngine: Initialized with cached configuration');
    } catch (error) {
      console.error('LocalPricingEngine: Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Ensure pricing context is available
   */
  private ensurePricingContext(): PricingContext {
    if (!this.pricingContext) {
      throw new Error('Pricing engine not initialized. Call initialize() first.');
    }
    return this.pricingContext;
  }

  /**
   * Get window type pricing information
   */
  public getWindowTypePrice(windowType: string): number {
    const context = this.ensurePricingContext();
    const type = context.windowTypes.find(t => t.Type === windowType);
    return type?.Cost || type?.BasePrice || 0;
  }

  /**
   * Get extra pricing information
   */
  public getExtraPrice(extraName: string): number {
    const context = this.ensurePricingContext();
    const extra = context.extras.find(e => e.Name === extraName);
    return extra?.Cost || 0;
  }

  /**
   * Get finish pricing information
   */
  public getFinishPrice(finishName: string): number {
    const context = this.ensurePricingContext();
    const finish = context.finishes.find(f => f.Name === finishName);
    return finish?.Cost || 0;
  }

  /**
   * Calculate pricing for a single window
   */
  public calculateWindowPricing(window: any, applyDiscounts: boolean = false): WindowPricing {
    const context = this.ensurePricingContext();

    // Base price calculation
    const basePrice = this.getWindowTypePrice(window.type);
    const quantity = window.quantity || 1;

    // Extras calculation
    let extrasTotal = 0;
    if (window.extras && Array.isArray(window.extras)) {
      extrasTotal = window.extras.reduce((total: number, extra: any) => {
        const extraPrice = this.getExtraPrice(extra.name);
        return total + extraPrice;
      }, 0);
    }

    // Finishes calculation
    let finishesTotal = 0;
    if (window.paint_finish) {
      finishesTotal += this.getFinishPrice(window.paint_finish);
    }
    if (window.hardware_finish) {
      finishesTotal += this.getFinishPrice(window.hardware_finish);
    }

    const subtotal = (basePrice + extrasTotal + finishesTotal) * quantity;

    // Apply discounts if enabled
    let discountAmount = 0;
    if (applyDiscounts) {
      discountAmount = this.calculateWindowDiscount(window, subtotal);
    }

    const total = subtotal - discountAmount;

    return {
      basePrice,
      extrasTotal,
      finishesTotal,
      subtotal,
      discountAmount,
      total
    };
  }

  /**
   * Calculate discount for a single window
   */
  private calculateWindowDiscount(window: any, subtotal: number): number {
    const context = this.ensurePricingContext();
    let totalDiscount = 0;

    // Apply discount rules if available
    if (context.discountRules) {
      for (const rule of context.discountRules) {
        if (this.isDiscountRuleApplicable(rule, window, subtotal)) {
          if (rule.type === 'percentage') {
            totalDiscount += subtotal * (rule.value / 100);
          } else if (rule.type === 'fixed') {
            totalDiscount += rule.value;
          }
        }
      }
    }

    return totalDiscount;
  }

  /**
   * Check if discount rule is applicable to window
   */
  private isDiscountRuleApplicable(rule: DiscountRule, window: any, subtotal: number): boolean {
    if (!rule.conditions) {
      return true;
    }

    const conditions = rule.conditions;

    // Check minimum quantity
    if (conditions.minQuantity && window.quantity < conditions.minQuantity) {
      return false;
    }

    // Check minimum value
    if (conditions.minValue && subtotal < conditions.minValue) {
      return false;
    }

    // Check window types
    if (conditions.windowTypes && !conditions.windowTypes.includes(window.type)) {
      return false;
    }

    return true;
  }

  /**
   * Calculate pricing for entire estimate
   */
  public calculateEstimatePricing(
    windows: any[],
    discountPercent: number = 0,
    applyDiscountRules: boolean = false
  ): EstimatePricing {
    const context = this.ensurePricingContext();

    // Calculate pricing for each window
    const windowsPricing = windows.map(window => 
      this.calculateWindowPricing(window, applyDiscountRules)
    );

    // Calculate totals
    const windowsTotal = windowsPricing.reduce((total, pricing) => total + pricing.total, 0);
    const extrasTotal = windowsPricing.reduce((total, pricing) => total + (pricing.extrasTotal * (windows[windowsPricing.indexOf(pricing)].quantity || 1)), 0);
    const finishesTotal = windowsPricing.reduce((total, pricing) => total + (pricing.finishesTotal * (windows[windowsPricing.indexOf(pricing)].quantity || 1)), 0);
    const discountTotal = windowsPricing.reduce((total, pricing) => total + pricing.discountAmount, 0);

    let subtotal = windowsTotal;

    // Apply manual discount percentage
    let manualDiscountAmount = 0;
    if (discountPercent > 0) {
      manualDiscountAmount = subtotal * (discountPercent / 100);
      subtotal -= manualDiscountAmount;
    }

    const totalDiscount = discountTotal + manualDiscountAmount;

    // Calculate VAT
    const vatAmount = subtotal * context.vatRate;
    const total = subtotal + vatAmount;

    return {
      windowsPricing,
      subtotal: windowsTotal - totalDiscount,
      totalDiscount,
      vatAmount,
      total,
      breakdown: {
        windowsTotal,
        extrasTotal,
        finishesTotal,
        discountTotal: totalDiscount,
        vatTotal: vatAmount
      }
    };
  }

  /**
   * Validate pricing data
   */
  public validatePricing(windows: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const context = this.ensurePricingContext();

      for (let i = 0; i < windows.length; i++) {
        const window = windows[i];

        // Check if window type exists
        if (!window.type) {
          errors.push(`Window ${i + 1}: No window type specified`);
          continue;
        }

        const windowType = context.windowTypes.find(t => t.Type === window.type);
        if (!windowType) {
          errors.push(`Window ${i + 1}: Unknown window type '${window.type}'`);
        }

        // Check extras
        if (window.extras && Array.isArray(window.extras)) {
          for (const extra of window.extras) {
            const extraData = context.extras.find(e => e.Name === extra.name);
            if (!extraData) {
              errors.push(`Window ${i + 1}: Unknown extra '${extra.name}'`);
            }
          }
        }

        // Check finishes
        if (window.paint_finish) {
          const finishData = context.finishes.find(f => f.Name === window.paint_finish);
          if (!finishData) {
            errors.push(`Window ${i + 1}: Unknown paint finish '${window.paint_finish}'`);
          }
        }

        if (window.hardware_finish) {
          const finishData = context.finishes.find(f => f.Name === window.hardware_finish);
          if (!finishData) {
            errors.push(`Window ${i + 1}: Unknown hardware finish '${window.hardware_finish}'`);
          }
        }

        // Check quantity
        if (!window.quantity || window.quantity < 1) {
          errors.push(`Window ${i + 1}: Invalid quantity`);
        }
      }

    } catch (error) {
      errors.push(`Pricing validation error: ${error.message}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get available window types
   */
  public getAvailableWindowTypes(): any[] {
    const context = this.ensurePricingContext();
    return context.windowTypes;
  }

  /**
   * Get available extras
   */
  public getAvailableExtras(): any[] {
    const context = this.ensurePricingContext();
    return context.extras;
  }

  /**
   * Get available finishes
   */
  public getAvailableFinishes(): any[] {
    const context = this.ensurePricingContext();
    return context.finishes;
  }

  /**
   * Get VAT rate
   */
  public getVATRate(): number {
    const context = this.ensurePricingContext();
    return context.vatRate;
  }

  /**
   * Format currency for display
   */
  public formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  }


}

// Export singleton instance
export const localPricingEngine = new LocalPricingEngine();
