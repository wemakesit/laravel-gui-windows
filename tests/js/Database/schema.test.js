/**
 * WatermelonDB Schema Tests
 * Tests for database schema structure and validation
 */

import { schema } from '../../../resources/js/Database/schema';

describe('WatermelonDB Schema', () => {
  test('should have correct version', () => {
    expect(schema.version).toBe(6);
  });

  test('should have all required tables', () => {
    const tableNames = Object.keys(schema.tables);

    expect(tableNames).toContain('customers');
    expect(tableNames).toContain('estimates');
    expect(tableNames).toContain('windows');
    expect(tableNames).toContain('extras');
    expect(tableNames).toContain('photos');
    expect(tableNames).toContain('window_types');
    expect(tableNames).toContain('finishes');
    expect(tableNames).toContain('company_info');
  });

  // Test each table structure
  describe('Table Structure Tests', () => {
    test('customers table should have correct structure', () => {
      const table = schema.tables.customers;
      expect(table).toBeDefined();
      expect(table.name).toBe('customers');

      // Check required columns exist
      expect(table.columns.name).toBeDefined();
      expect(table.columns.created_at).toBeDefined();
      expect(table.columns.updated_at).toBeDefined();

      // Check column types
      expect(table.columns.name.type).toBe('string');
      expect(table.columns.created_at.type).toBe('number');

      // Check optional columns
      expect(table.columns.email.isOptional).toBe(true);
      expect(table.columns.name.isOptional).toBeFalsy();
    });

    test('estimates table should have correct structure', () => {
      const table = schema.tables.estimates;
      expect(table).toBeDefined();
      expect(table.name).toBe('estimates');

      // Check foreign key is indexed
      expect(table.columns.customer_id.isIndexed).toBe(true);
      expect(table.columns.customer_id.isOptional).toBe(false);

      // Check reference number is indexed
      expect(table.columns.reference_number.isIndexed).toBe(true);
    });

    test('windows table should have correct structure', () => {
      const table = schema.tables.windows;
      expect(table).toBeDefined();
      expect(table.name).toBe('windows');

      // Check foreign key
      expect(table.columns.estimate_id.isIndexed).toBe(true);

      // Check required fields
      expect(table.columns.room.type).toBe('string');
      expect(table.columns.width.type).toBe('number');
      expect(table.columns.height.type).toBe('number');
    });

    test('photos table should have correct structure', () => {
      const table = schema.tables.photos;
      expect(table).toBeDefined();
      expect(table.name).toBe('photos');

      // Check indexed columns
      expect(table.columns.estimate_id.isIndexed).toBe(true);
      expect(table.columns.window_id.isIndexed).toBe(true);
      expect(table.columns.window_id.isOptional).toBe(true);
    });

    test('extras table should have correct structure', () => {
      const table = schema.tables.extras;
      expect(table).toBeDefined();
      expect(table.name).toBe('extras');

      // Check indexed columns
      expect(table.columns.estimate_id.isIndexed).toBe(true);
      expect(table.columns.api_id.isIndexed).toBe(true);
    });
  });

});
