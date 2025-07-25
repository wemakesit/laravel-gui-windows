import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        createTable({
          name: 'window_types',
          columns: [
            { name: 'api_id', type: 'string', isIndexed: true },
            { name: 'name', type: 'string' },
            { name: 'type', type: 'string' },
            { name: 'cost', type: 'number' },
            { name: 'description', type: 'string', isOptional: true },
            { name: 'is_active', type: 'boolean' },
            { name: 'last_synced', type: 'number' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        createTable({
          name: 'finishes',
          columns: [
            { name: 'api_id', type: 'string', isIndexed: true },
            { name: 'name', type: 'string' },
            { name: 'category', type: 'string' },
            { name: 'cost', type: 'number' },
            { name: 'description', type: 'string', isOptional: true },
            { name: 'is_active', type: 'boolean' },
            { name: 'last_synced', type: 'number' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        addColumns({
          table: 'extras',
          columns: [
            { name: 'api_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'is_config', type: 'boolean' },
            { name: 'is_active', type: 'boolean', isOptional: true },
            { name: 'last_synced', type: 'number', isOptional: true },
          ],
        }),
        createTable({
          name: 'company_info',
          columns: [
            { name: 'key', type: 'string', isIndexed: true },
            { name: 'data', type: 'string' },
            { name: 'last_synced', type: 'number' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        // Ensure customer_id field is properly configured in estimates table
        // This migration forces a schema refresh to fix persistence issues
      ],
    },
    {
      toVersion: 4,
      steps: [
        // Fix customer_id field mapping from @text to @field decorator
        // This addresses the IndexedDB persistence issue
      ],
    },
  ],
});

export default migrations;
