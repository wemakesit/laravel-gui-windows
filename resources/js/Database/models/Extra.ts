import { Model } from '@nozbe/watermelondb';
import {
  text,
  field,
  date,
  readonly,
  relation,
  writer,
} from '@nozbe/watermelondb/decorators';
import type Estimate from './Estimate';

export default class Extra extends Model {
  static table = 'extras';

  static associations = {
    estimate: { type: 'belongs_to', key: 'estimate_id' },
  } as const;

  @field('estimate_id') estimateId!: string | null; // null for config extras
  @field('api_id') apiId!: string | null; // for config extras from API
  @text('name') name!: string;
  @field('description') description!: string | null;
  @field('quantity') quantity!: number | null; // null for config extras
  @field('unit_price') unitPrice!: number;
  @field('total_price') totalPrice!: number | null; // null for config extras
  @field('category') category!: string | null;
  @field('is_config') isConfig!: boolean; // true for config extras
  @field('is_active') isActive!: boolean | null; // for config extras
  @field('last_synced') lastSynced!: number | null; // for config extras

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Relations
  @relation('estimates', 'estimate_id') estimate!: Estimate;

  // Derived fields
  get displayName(): string {
    return this.description ? `${this.name} - ${this.description}` : this.name;
  }

  // Writer methods
  @writer async updatePricing(unitPrice: number, quantity: number) {
    await this.update(extra => {
      extra.unitPrice = unitPrice;
      extra.quantity = quantity;
      extra.totalPrice = unitPrice * quantity;
    });
  }

  @writer async updateDetails(data: {
    name?: string;
    description?: string | null;
    category?: string | null;
  }) {
    await this.update(extra => {
      if (data.name !== undefined) extra.name = data.name;
      if (data.description !== undefined) extra.description = data.description;
      if (data.category !== undefined) extra.category = data.category;
    });
  }

  @writer async updateFromAPI(data: {
    name?: string;
    cost?: number;
    description?: string;
    category?: string;
    isActive?: boolean;
  }) {
    await this.update(extra => {
      if (data.name !== undefined) extra.name = data.name;
      if (data.cost !== undefined) extra.unitPrice = data.cost;
      if (data.description !== undefined) extra.description = data.description;
      if (data.category !== undefined) extra.category = data.category;
      if (data.isActive !== undefined) extra.isActive = data.isActive;
      extra.lastSynced = Date.now();
    });
  }

  // Helper methods
  get isConfigExtra(): boolean {
    return this.isConfig === true;
  }

  get isEstimateExtra(): boolean {
    return this.isConfig === false;
  }
}
