import { Model } from '@nozbe/watermelondb';
import {
  text,
  field,
  date,
  readonly,
  children,
  relation,
  writer,
} from '@nozbe/watermelondb/decorators';
import type { Query } from '@nozbe/watermelondb';
import type Customer from './Customer';
import type Window from './Window';
import type Extra from './Extra';
import type Photo from './Photo';

export default class Estimate extends Model {
  static table = 'estimates';

  static associations = {
    customer: { type: 'belongs_to', key: 'customer_id' },
    windows: { type: 'has_many', foreignKey: 'estimate_id' },
    extras: { type: 'has_many', foreignKey: 'estimate_id' },
    photos: { type: 'has_many', foreignKey: 'estimate_id' },
  } as const;

  @field('customer_id') customerId!: string;
  @text('reference_number') referenceNumber!: string;
  @field('status') status!: string;
  @field('total_amount') totalAmount!: number | null;
  @field('discount_amount') discountAmount!: number | null;
  @field('vat_amount') vatAmount!: number | null;
  @field('final_amount') finalAmount!: number | null;
  @field('notes') notes!: string | null;
  @date('valid_until') validUntil!: Date | null;
  @date('pdf_generated_at') pdfGeneratedAt!: Date | null;
  @field('pdf_url') pdfUrl!: string | null;
  @field('is_synced') isSynced!: boolean;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Relations
  @relation('customers', 'customer_id') customer!: Customer;
  @children('windows') windows!: Query<Window>;
  @children('extras') extras!: Query<Extra>;
  @children('photos') photos!: Query<Photo>;

  // Derived fields
  get isDraft(): boolean {
    return this.status === 'draft';
  }

  get isPending(): boolean {
    return this.status === 'pending';
  }

  get isApproved(): boolean {
    return this.status === 'approved';
  }

  get isRejected(): boolean {
    return this.status === 'rejected';
  }

  get isExpired(): boolean {
    if (!this.validUntil) return false;
    return this.validUntil.getTime() < Date.now();
  }

  get hasPdf(): boolean {
    return !!this.pdfUrl && !!this.pdfGeneratedAt;
  }

  // Writer methods
  @writer async updateStatus(status: string) {
    await this.update(estimate => {
      estimate.status = status;
    });
  }

  @writer async updateAmounts(amounts: {
    totalAmount?: number | null;
    discountAmount?: number | null;
    vatAmount?: number | null;
    finalAmount?: number | null;
  }) {
    await this.update(estimate => {
      if (amounts.totalAmount !== undefined)
        estimate.totalAmount = amounts.totalAmount;
      if (amounts.discountAmount !== undefined)
        estimate.discountAmount = amounts.discountAmount;
      if (amounts.vatAmount !== undefined)
        estimate.vatAmount = amounts.vatAmount;
      if (amounts.finalAmount !== undefined)
        estimate.finalAmount = amounts.finalAmount;
    });
  }

  @writer async markAsSynced() {
    await this.update(estimate => {
      estimate.isSynced = true;
    });
  }

  @writer async setPdfInfo(url: string) {
    await this.update(estimate => {
      estimate.pdfUrl = url;
      estimate.pdfGeneratedAt = new Date();
    });
  }
}
