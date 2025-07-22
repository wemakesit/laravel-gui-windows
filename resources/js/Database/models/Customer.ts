import { Model } from '@nozbe/watermelondb';
import {
  text,
  field,
  date,
  readonly,
  children,
  writer,
} from '@nozbe/watermelondb/decorators';
import type { Query } from '@nozbe/watermelondb';
import type Estimate from './Estimate';

export default class Customer extends Model {
  static table = 'customers';

  static associations = {
    estimates: { type: 'has_many', foreignKey: 'customer_id' },
  } as const;

  @text('name') name!: string;
  @field('email') email!: string | null;
  @field('phone') phone!: string | null;
  @field('address_line_1') addressLine1!: string | null;
  @field('address_line_2') addressLine2!: string | null;
  @field('city') city!: string | null;
  @field('county') county!: string | null;
  @field('postcode') postcode!: string | null;
  @field('country') country!: string | null;
  @field('company_name') companyName!: string | null;
  @field('notes') notes!: string | null;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('estimates') estimates!: Query<Estimate>;

  // Derived fields
  get fullAddress(): string {
    const parts = [
      this.addressLine1,
      this.addressLine2,
      this.city,
      this.county,
      this.postcode,
      this.country,
    ].filter(Boolean);
    return parts.join(', ');
  }

  get displayName(): string {
    if (this.companyName) {
      return `${this.companyName} (${this.name})`;
    }
    return this.name;
  }

  // Writer methods
  @writer async updateInfo(
    data: Partial<{
      name: string;
      email: string | null;
      phone: string | null;
      addressLine1: string | null;
      addressLine2: string | null;
      city: string | null;
      county: string | null;
      postcode: string | null;
      country: string | null;
      companyName: string | null;
      notes: string | null;
    }>
  ) {
    await this.update(customer => {
      if (data.name !== undefined) customer.name = data.name;
      if (data.email !== undefined) customer.email = data.email;
      if (data.phone !== undefined) customer.phone = data.phone;
      if (data.addressLine1 !== undefined)
        customer.addressLine1 = data.addressLine1;
      if (data.addressLine2 !== undefined)
        customer.addressLine2 = data.addressLine2;
      if (data.city !== undefined) customer.city = data.city;
      if (data.county !== undefined) customer.county = data.county;
      if (data.postcode !== undefined) customer.postcode = data.postcode;
      if (data.country !== undefined) customer.country = data.country;
      if (data.companyName !== undefined)
        customer.companyName = data.companyName;
      if (data.notes !== undefined) customer.notes = data.notes;
    });
  }
}
