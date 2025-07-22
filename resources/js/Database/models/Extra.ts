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

  @field('estimate_id') estimateId!: string;
  @text('name') name!: string;
  @field('description') description!: string | null;
  @field('quantity') quantity!: number;
  @field('unit_price') unitPrice!: number;
  @field('total_price') totalPrice!: number;
  @field('category') category!: string | null;

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
}
