import { Model } from '@nozbe/watermelondb';
import {
  text,
  field,
  date,
  readonly,
  children,
  relation,
  writer,
  json,
} from '@nozbe/watermelondb/decorators';
import type { Query } from '@nozbe/watermelondb';
import type Estimate from './Estimate';
import type Photo from './Photo';

export default class Window extends Model {
  static table = 'windows';

  static associations = {
    estimate: { type: 'belongs_to', key: 'estimate_id' },
    photos: { type: 'has_many', foreignKey: 'window_id' },
  } as const;

  @field('estimate_id') estimateId!: string;
  @text('room') room!: string;
  @field('window_type') windowType!: string;
  @field('width') width!: number;
  @field('height') height!: number;
  @field('quantity') quantity!: number;
  @field('unit_price') unitPrice!: number | null;
  @field('total_price') totalPrice!: number | null;
  @field('finish') finish!: string | null;
  @field('glass_type') glassType!: string | null;
  @field('opening_type') openingType!: string | null;
  @field('notes') notes!: string | null;
  @json('options', json => json) options!: string[] | null; // Selected options array

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Relations
  @relation('estimates', 'estimate_id') estimate!: Estimate;
  @children('photos') photos!: Query<Photo>;

  // Derived fields
  get area(): number {
    return this.width * this.height;
  }

  get totalArea(): number {
    return this.area * this.quantity;
  }

  get displayName(): string {
    return `${this.room} - ${this.windowType}`;
  }

  get dimensions(): string {
    return `${this.width}mm x ${this.height}mm`;
  }

  get hasPhotos(): boolean {
    return this.photos.length > 0;
  }

  // Writer methods
  @writer async updateDimensions(width: number, height: number) {
    await this.update(window => {
      window.width = width;
      window.height = height;
    });
  }

  @writer async updatePricing(
    unitPrice: number | null,
    totalPrice: number | null
  ) {
    await this.update(window => {
      window.unitPrice = unitPrice;
      window.totalPrice = totalPrice;
    });
  }

  @writer async updateConfiguration(config: {
    windowType?: string;
    finish?: string | null;
    glassType?: string | null;
    openingType?: string | null;
    options?: string[] | null;
  }) {
    await this.update(window => {
      if (config.windowType !== undefined)
        window.windowType = config.windowType;
      if (config.finish !== undefined) window.finish = config.finish;
      if (config.glassType !== undefined) window.glassType = config.glassType;
      if (config.openingType !== undefined)
        window.openingType = config.openingType;
      if (config.options !== undefined) window.options = config.options;
    });
  }

  @writer async updateQuantity(quantity: number) {
    await this.update(window => {
      window.quantity = quantity;
    });
  }
}
