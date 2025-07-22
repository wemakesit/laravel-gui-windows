import { Model } from '@nozbe/watermelondb';
import { text, field, date, readonly, relation, writer } from '@nozbe/watermelondb/decorators';
import type Estimate from './Estimate';
import type Window from './Window';

export default class Photo extends Model {
  static table = 'photos';

  static associations = {
    estimate: { type: 'belongs_to', key: 'estimate_id' },
    window: { type: 'belongs_to', key: 'window_id' },
  } as const;

  @field('estimate_id') estimateId!: string;
  @field('window_id') windowId!: string | null;
  @text('filename') filename!: string;
  @field('file_path') filePath!: string;
  @field('file_size') fileSize!: number | null;
  @field('mime_type') mimeType!: string | null;
  @field('caption') caption!: string | null;
  @field('is_synced') isSynced!: boolean;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Relations
  @relation('estimates', 'estimate_id') estimate!: Estimate;
  @relation('windows', 'window_id') window!: Window | null;

  // Derived fields
  get isWindowPhoto(): boolean {
    return !!this.windowId;
  }

  get isGeneralPhoto(): boolean {
    return !this.windowId;
  }

  get displayName(): string {
    return this.caption || this.filename;
  }

  get fileExtension(): string {
    return this.filename.split('.').pop()?.toLowerCase() || '';
  }

  get isImage(): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    return imageExtensions.includes(this.fileExtension);
  }

  // Writer methods
  @writer async updateCaption(caption: string | null) {
    await this.update(photo => {
      photo.caption = caption;
    });
  }

  @writer async markAsSynced() {
    await this.update(photo => {
      photo.isSynced = true;
    });
  }

  @writer async associateWithWindow(windowId: string | null) {
    await this.update(photo => {
      photo.windowId = windowId;
    });
  }
}
