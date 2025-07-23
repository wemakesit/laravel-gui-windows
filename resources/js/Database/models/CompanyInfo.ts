import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, writer } from '@nozbe/watermelondb/decorators';

export default class CompanyInfo extends Model {
  static table = 'company_info';

  @field('key') key!: string; // Always 'default'
  @field('data') data!: string; // JSON string of company info
  @field('last_synced') lastSynced!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @writer async updateFromAPI(companyData: any) {
    await this.update(info => {
      info.data = JSON.stringify(companyData);
      info.lastSynced = Date.now();
    });
  }

  // Helper method to get parsed company data
  getCompanyData(): any {
    try {
      return JSON.parse(this.data);
    } catch {
      return {};
    }
  }
}
