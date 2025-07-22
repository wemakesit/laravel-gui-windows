import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    // We'll add migration definitions here when we need to update the schema
    // For now, we're starting with version 1, so no migrations needed
  ],
});

export default migrations;
