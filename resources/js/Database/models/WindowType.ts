import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, writer } from '@nozbe/watermelondb/decorators';

export default class WindowType extends Model {
  static table = 'window_types';

  @field('api_id') apiId!: string;
  @field('name') name!: string;
  @field('type') type!: string;
  @field('cost') cost!: number;
  @field('description') description?: string;
  @field('is_active') isActive!: boolean;
  @field('last_synced') lastSynced!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @writer async updateFromAPI(data: {
    name?: string;
    type?: string;
    cost?: number;
    description?: string;
    isActive?: boolean;
  }) {
    await this.update(windowType => {
      if (data.name !== undefined) windowType.name = data.name;
      if (data.type !== undefined) windowType.type = data.type;
      if (data.cost !== undefined) windowType.cost = data.cost;
      if (data.description !== undefined) windowType.description = data.description;
      if (data.isActive !== undefined) windowType.isActive = data.isActive;
      windowType.lastSynced = Date.now();
    });
  }
}
