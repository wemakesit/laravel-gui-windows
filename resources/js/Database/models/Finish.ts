import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, writer } from '@nozbe/watermelondb/decorators';

export default class Finish extends Model {
  static table = 'finishes';

  @field('api_id') apiId!: string;
  @field('name') name!: string;
  @field('category') category!: string; // glass_specifications, paint_finishes, hardware_finishes
  @field('cost') cost!: number;
  @field('description') description?: string;
  @field('is_active') isActive!: boolean;
  @field('last_synced') lastSynced!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @writer async updateFromAPI(data: {
    name?: string;
    category?: string;
    cost?: number;
    description?: string;
    isActive?: boolean;
  }) {
    await this.update(finish => {
      if (data.name !== undefined) finish.name = data.name;
      if (data.category !== undefined) finish.category = data.category;
      if (data.cost !== undefined) finish.cost = data.cost;
      if (data.description !== undefined) finish.description = data.description;
      if (data.isActive !== undefined) finish.isActive = data.isActive;
      finish.lastSynced = Date.now();
    });
  }
}
